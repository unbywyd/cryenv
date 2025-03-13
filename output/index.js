import fs from "fs-extra";
import inquirer from "inquirer";
import validator from "validator";
import crypto from "crypto";
import path from "path";
import zlib from "zlib";
import { getPrivateKey, getPublicKey, provideKeys } from "./keys.js";
import { getMissingEnvKeys, updateEnvVariable } from "./env.js";
import { getPackageName } from "./utils.js";
import { execSync } from "child_process";
import { sendSurveyRequest } from "./send.js";
const controls = ["text", "confirm", "password", "email", "phone", "number", "integer", "date", "uuid", "url", "multiselect", "select"];
const formatByControl = {
    text: "text",
    password: "text",
    email: "email",
    phone: "phone",
    number: "number",
    integer: "integer",
    date: "date",
    uuid: "uuid",
    url: "url",
    multiselect: "text",
    select: "text",
    confirm: "text"
};
const selectControls = ["multiselect", "select"];
const questionTypeByControl = {
    text: "input",
    password: "password",
    confirm: "confirm",
    multiselect: "checkbox",
    select: "list",
    email: "input",
    phone: "input",
    number: "input",
    integer: "input",
    date: "input",
    uuid: "input",
    url: "input"
};
export function colorText(text, color) {
    const colors = {
        yellow: "\x1b[33m",
        gray: "\x1b[90m",
        green: "\x1b[32m",
        reset: "\x1b[0m",
        red: "\x1b[31m"
    };
    return `${colors[color]}${text}${colors.reset}`;
}
/*
 * Encrypts the answers object via:
 *   1) compressAnswers -> zlib deflate
 *   2) AES-256-CBC encryption
 *   3) RSA encrypt the AES key
 *   4) Concatenate into JSON -> base64
 *   5) Return as `helloKey::base64_payload`
 */
export const encryptAnswers = (helloKey, answers, publicKey) => {
    // 1) Convert answers to string & compress with zlib
    const answersString = compressAnswers(answers);
    const compressed = zlib.deflateSync(Buffer.from(answersString, "utf-8"), {
        level: zlib.constants.Z_BEST_COMPRESSION
    });
    // 2) Generate a random 256-bit AES key and 128-bit IV
    const aesKey = crypto.randomBytes(32); // 32 bytes = 256 bits
    const iv = crypto.randomBytes(16); // 16 bytes = 128 bits
    // 3) Encrypt the compressed data using AES-256-CBC
    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    const encryptedData = Buffer.concat([cipher.update(compressed), cipher.final()]);
    // 4) Encrypt the AES key with RSA
    const encryptedKey = crypto.publicEncrypt(publicKey, aesKey);
    // 5) Pack everything (RSA-encrypted key, IV, AES-encrypted data) into JSON -> base64
    const payloadJson = JSON.stringify({
        k: encryptedKey.toString("base64"), // RSA-encrypted AES key
        i: iv.toString("base64"), // IV
        d: encryptedData.toString("base64") // AES-encrypted data
    });
    const base64Payload = Buffer.from(payloadJson, "utf-8").toString("base64");
    // Final token: `helloKey::base64Payload`
    return `${helloKey}::${base64Payload}`;
};
/*
 * Decrypts data from `HELLO_KEY::BASE64_PAYLOAD`:
 *   1) Split by `::` to get the base64 payload
 *   2) RSA-decrypt the AES key
 *   3) AES-decrypt the data
 *   4) zlib inflate
 *   5) decompressAnswers => returns the original answers object
 */
export const decryptAnswers = async (encryptedData) => {
    // 1) Split off the base64 payload (ignore the helloKey)
    const [baseToken] = encryptedData.split(".");
    const [/* hello */ , base64Payload] = baseToken.split("::");
    if (!base64Payload) {
        throw new Error("Invalid data format (missing `::`).");
    }
    // 2) Parse the JSON payload
    const payloadJson = Buffer.from(base64Payload, "base64").toString("utf-8");
    const { k, i, d } = JSON.parse(payloadJson);
    // 3) RSA-decrypt the AES key
    const privateKey = await getPrivateKey();
    const aesKey = crypto.privateDecrypt(privateKey, Buffer.from(k, "base64"));
    // 4) AES-decrypt the compressed data
    const iv = Buffer.from(i, "base64");
    const encryptedDataBuf = Buffer.from(d, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
    const decompressed = Buffer.concat([
        decipher.update(encryptedDataBuf),
        decipher.final()
    ]);
    // 5) zlib inflate -> original answers string
    const answersString = zlib.inflateSync(decompressed).toString("utf-8");
    // 6) Convert back to object with your existing logic
    return decompressAnswers(answersString);
};
/*
*   Creates a survey token with the provided hello message and survey data
*/
export const createSurveyToken = async (helloKey, surveyData) => {
    const publicKey = (await getPublicKey()).replace(/-----(BEGIN|END) PUBLIC KEY-----|\n/g, "");
    const combinedData = JSON.stringify({ d: surveyData, k: publicKey });
    const compressed = await zlib.deflateSync(combinedData, {
        level: zlib.constants.Z_BEST_COMPRESSION
    });
    return `${helloKey}::${compressed.toString("base64")}`;
};
/*
*   Extracts the survey data, public key and hello message from the compressed token
*/
export const extractEmailsFromToken = (emailParts) => {
    try {
        if (!emailParts)
            return [];
        const emailDecoded = Buffer.from(emailParts, "base64").toString("utf-8");
        const [toEmail, fromEmail] = emailDecoded.split(":");
        return [toEmail, fromEmail];
    }
    catch (error) {
        return [];
    }
};
/*
*   Extracts the survey data, public key and hello message from the compressed token
*/
export const extractSurveyToken = (compressedToken) => {
    try {
        const [helloKey, secondary] = compressedToken.split("::");
        const [token, emailParts] = secondary.split(".");
        const emails = extractEmailsFromToken(emailParts);
        const decompressedData = zlib.inflateSync(Buffer.from(token, "base64")).toString("utf-8");
        const source = JSON.parse(decompressedData);
        const restoredPublicKey = `-----BEGIN PUBLIC KEY-----\n${source.k}\n-----END PUBLIC KEY-----`;
        return { surveyData: source.d, publicKey: restoredPublicKey, hello: helloKey, emails };
    }
    catch (e) {
        console.error("❌ Invalid token. Please provide a valid token.");
        process.exit(1);
    }
};
/*
*   Validates the input based on the provided format
*/
function validateInput(type, input) {
    switch (type) {
        case "email": return validator.isEmail(input);
        case "phone": return validator.isMobilePhone(input, "any");
        case "number": return validator.isNumeric(input);
        case "integer": return validator.isInt(input);
        case "boolean": return ["true", "false", "yes", "no", "1", "0"].includes(input.toLowerCase());
        case "date": return validator.isISO8601(input);
        case "url": return validator.isURL(input);
        case "uuid": return validator.isUUID(input);
        case "text": return input.length > 0;
        default: return true;
    }
}
/*
*   Validates the input based on the provided format
*/
const compressQuestion = (question) => {
    let output = `${question.name}|!${question.message || '_'}|!${question.default || '_'}|!${question.control}|!${question.choices ? question.choices.join(",") : '_'}`;
    return output;
};
const complressQuestions = (questions) => {
    return questions.map(compressQuestion).join(";;");
};
const parseQuestion = (input) => {
    const [name, message, defaultValue, control, choices] = input.split("|!");
    return { name, message: message == '_' ? '' : message, default: defaultValue == '_' ? '' : defaultValue, control: control, choices: choices == '_' ? [] : choices?.split(",").map((s) => s.trim()) };
};
const parseQuestions = (input) => {
    return input.split(";;").map(parseQuestion);
};
export const parseMessageQuestion = (message) => {
    if (!message)
        return { message: '_' };
    const match = message.match(/^(.*?)\s*\((.*?)\)\s*$/);
    if (match) {
        return { message: match[1].trim(), defaultValue: match[2].trim() };
    }
    return { message };
};
export const parseInputQuestion = (input) => {
    const [varName, message] = input.split("|").map((s) => s.trim());
    const messageData = parseMessageQuestion(message);
    return { varName, ...messageData };
};
export const helloToKey = (hello) => {
    return hello.toLowerCase().replace(/[^a-z0-9]/g, "_");
};
export const saveQuestions = async (hello, questions) => {
    const output = path.join(process.cwd(), `${helloToKey(hello)}.cryenv`);
    fs.outputFileSync(output, complressQuestions(questions));
    console.log(colorText(`📦 Questions saved to ${output}`, "green"));
};
export const useFile = async (name) => {
    const validName = /^[a-zA-Z0-9_ \-]*$/.test(name);
    if (!validName) {
        console.error("❌ Invalid file name. Use only letters, numbers, spaces, underscores, and hyphens.");
        process.exit(1);
    }
    const fromSaveFile = path.join(process.cwd(), `${name}.cryenv`);
    if (!fs.existsSync(fromSaveFile)) {
        console.error(`❌ File ${name}.cryenv not found`);
        process.exit(1);
    }
    const keys = await provideKeys();
    if (!keys) {
        console.error(`❌ Keys for ${name} not found`);
        process.exit(1);
    }
    const questions = fs.readFileSync(fromSaveFile, "utf-8");
    try {
        const data = parseQuestions(questions);
        if (data.length === 0) {
            console.error(`❌ File ${name}.cryenv is empty`);
            process.exit(1);
        }
        console.log(colorText(`📦 Questions loaded from ${name}.cryenv and contain the following questions:`, 'green'));
        for (const question of data) {
            console.log(colorText(`❓ ${question.name}:${question.message == '_' ? '-' : question.message}`, "gray"));
        }
        const token = await createSurveyToken(name, complressQuestions(data));
        await toFill(token);
    }
    catch (e) {
        console.error(`❌ Invalid file ${name}.cryenv`);
        process.exit(1);
    }
};
export const requestEmails = async () => {
    try {
        const { toEmail } = await inquirer.prompt([
            {
                type: "confirm",
                name: "toEmail",
                message: "Send the token to an email address?"
            }
        ]);
        if (toEmail) {
            const { fromEmail, toEmail } = await inquirer.prompt([
                {
                    type: "input",
                    name: "toEmail",
                    message: "Recipient email address:",
                    validate: (input) => validator.isEmail(input) || "Invalid email address"
                },
                {
                    type: "input",
                    name: "fromEmail",
                    message: "Your email address:",
                    validate: (input) => validator.isEmail(input) || "Invalid email address"
                },
            ]);
            return [toEmail, fromEmail];
        }
        return false;
    }
    catch (e) {
        return false;
    }
};
/*
*   Asks the user to provide the keys
*/
export const toFill = async (token) => {
    try {
        const emails = await requestEmails();
        if (emails) {
            const [toEmail, fromEmail] = emails;
            const email = `${toEmail}:${fromEmail}`;
            const toBase64 = Buffer.from(email).toString("base64");
            const result = `${token}.${toBase64}`;
            console.log(colorText(`Great! Send this command to the person who should fill out this survey`, "gray"));
            console.log(colorText(`npx cryenv --fill ${result}`, "green"));
            try {
                const { acceptToSend } = await inquirer.prompt([
                    {
                        type: "confirm",
                        name: "acceptToSend",
                        message: `Send the email to ${toEmail}?`
                    }
                ]);
                if (acceptToSend) {
                    await sendSurveyRequest('fill', `${result}`);
                    console.log(colorText(`✅ Email sent to ${toEmail}!`, "green"));
                    console.log(colorText(`Please check your spam folder if you don't see the email.`, "gray"));
                }
                else {
                    console.log(colorText(`Email not sent.`, "red"));
                }
            }
            catch (e) {
                console.error("❌ Failed to send email. Please try again later.");
            }
            copyToClipboard(`npx cryenv --fill ${result}`);
            console.log("📦 Encrypted token copied to clipboard!");
            return;
        }
        else {
            console.log(colorText(`Great! Send this command to the person who should fill out this survey`, "gray"));
            console.log(colorText(`npx cryenv --fill ${token}`, "green"));
            copyToClipboard(`npx cryenv --fill ${token}`);
            console.log(colorText("📦 Encrypted token copied to clipboard!", 'gray'));
        }
    }
    catch (e) {
        console.error("\n ❌ Action was aborted by the user");
        console.error(`Email not provided.`);
        console.log(colorText(`Great! Send this command to the person who should fill out this survey`, "gray"));
        console.log(colorText(`npx cryenv --fill ${token}`, "green"));
        copyToClipboard(`npx cryenv --fill ${token}`);
        console.log(colorText("📦 Encrypted token copied to clipboard!", 'gray'));
        process.exit(0);
    }
};
export const createSurveyByKeys = async (envKeys) => {
    const questions = [];
    let hello = "";
    const keys = await provideKeys();
    if (!keys) {
        console.error(`❌ Keys not found`);
        process.exit(1);
    }
    const packageName = await getPackageName();
    try {
        const { helloMessage } = await inquirer.prompt([
            {
                type: "input",
                name: "helloMessage",
                message: "Hello message:",
                default: packageName ? packageName : undefined,
                validate: (input) => {
                    const value = input.trim();
                    if (!value)
                        return "Hello message cannot be empty";
                    const englishOnly = /^[a-zA-Z0-9_ \-]*$/.test(value);
                    if (!englishOnly)
                        return "Only English characters are allowed";
                    const minChars = value.length >= 3;
                    if (!minChars)
                        return "Hello message should be at least 5 characters long";
                    return true;
                }
            }
        ]);
        hello = helloMessage;
    }
    catch (e) {
        console.error("\n ❌ Action was aborted by the user");
        console.error("Invalid hello message. Please enter a valid message.");
        process.exit(1);
    }
    const helloKey = helloToKey(hello);
    for (const key of envKeys) {
        try {
            const { sourceMessage } = await inquirer.prompt([
                {
                    type: "input",
                    name: "sourceMessage",
                    message: `Enter description for ${key}:`,
                    required: true,
                    validate: (input) => input.trim() !== "" || "Description cannot be empty"
                }
            ]);
            const { message, defaultValue } = parseMessageQuestion(sourceMessage);
            const { control } = await inquirer.prompt([
                {
                    type: "list",
                    name: "control",
                    message: "Choose the type of question:",
                    choices: controls
                }
            ]);
            let choices;
            const isSelectControl = selectControls.includes(control);
            if (isSelectControl) {
                const { options } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "options",
                        message: "Enter options separated by commas:",
                        validate: (input) => {
                            if (input.split(",").length < 2) {
                                return "Please enter at least two options";
                            }
                            if (input.trim() === "") {
                                return "Options list cannot be empty";
                            }
                            return true;
                        }
                    }
                ]);
                choices = options.split(",").map((s) => s.trim());
            }
            questions.push({ message, control, name: key, default: defaultValue, choices });
        }
        catch (e) {
            console.error("\n ❌ Action was aborted by the user");
            process.exit(1);
        }
    }
    await saveQuestions(hello, questions);
    const token = await createSurveyToken(helloKey, complressQuestions(questions));
    await toFill(token);
};
export const createSurvey = async () => {
    const questions = [];
    let hello = "";
    const keys = await provideKeys();
    if (!keys) {
        console.error(`❌ Keys not found`);
        process.exit(1);
    }
    try {
        const packageName = await getPackageName();
        const { helloMessage } = await inquirer.prompt([
            {
                type: "input",
                name: "helloMessage",
                required: true,
                default: packageName ? packageName : undefined,
                message: "Hello message:",
                validate: (input) => {
                    const value = input.trim();
                    if (!value)
                        return "Hello message cannot be empty";
                    const englishOnly = /^[a-zA-Z0-9_ \-]*$/.test(value);
                    if (!englishOnly)
                        return "Only English characters are allowed";
                    const minChars = value.length >= 3;
                    if (!minChars)
                        return "Hello message should be at least 5 characters long";
                    return true;
                }
            }
        ]);
        hello = helloMessage;
    }
    catch (e) {
        console.error("❌ Invalid hello message. Please enter a valid message.");
        process.exit(1);
    }
    const helloKey = helloToKey(hello);
    const addQuestion = async () => {
        try {
            const { question } = await inquirer.prompt([
                {
                    type: "input",
                    name: "question",
                    required: true,
                    message: "varName | Description (default value): ",
                    default: "DB | Postgres (postgres://user:pass@localhost:5432/dbname)",
                    validate: (input) => {
                        if (!input.trim())
                            return "Question cannot be empty";
                        const key = input.split("|")[0].trim();
                        const validKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key);
                        if (!validKey)
                            return "Invalid variable name. Use only letters, numbers and underscores";
                        if (questions.find(q => q.name === key))
                            return "Variable name already exists";
                        return true;
                    }
                }
            ]);
            if (!question.trim())
                return;
            const { message, defaultValue, varName } = parseInputQuestion(question);
            const { control } = await inquirer.prompt([
                {
                    type: "list",
                    name: "control",
                    message: "Choose the type of question:",
                    choices: controls
                }
            ]);
            let choices;
            const isSelectControl = selectControls.includes(control);
            if (isSelectControl) {
                const { options } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "options",
                        message: "Enter options separated by commas:",
                        validate: (input) => {
                            if (input.split(",").length < 2) {
                                return "Please enter at least two options";
                            }
                            if (input.trim() === "") {
                                return "Options list cannot be empty";
                            }
                            return true;
                        }
                    }
                ]);
                choices = options.split(",").map((s) => s.trim());
            }
            questions.push({ message, control, name: varName, default: defaultValue, choices });
            const { addMore } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "addMore",
                    message: "Add another question?",
                    default: false
                }
            ]);
            if (addMore) {
                await addQuestion();
            }
        }
        catch (e) {
            console.error("❌ Action was aborted by the user, exiting process");
            process.exit(1);
        }
    };
    try {
        await addQuestion();
    }
    catch (e) {
        console.error("❌ Invalid question.", e?.message);
        process.exit(1);
    }
    if (!questions.length) {
        console.error("❌ No questions added. Exiting...");
        process.exit(1);
    }
    await saveQuestions(hello, questions);
    const token = await createSurveyToken(helloKey, complressQuestions(questions));
    await toFill(token);
};
export const compressAnswers = (answers) => {
    return Object.entries(answers).map(([name, value]) => `${name}::${value}`).join(";;");
};
export const decompressAnswers = (answers) => {
    return answers.split(";;").reduce((acc, item) => {
        const [name, value] = item.split("::");
        return { ...acc, [name]: value };
    }, {});
};
export const fillSurvey = async (token) => {
    try {
        const { surveyData, publicKey, hello, emails } = extractSurveyToken(token);
        const helloMessage = hello.replace(/_/g, ' ');
        console.log(colorText(`👋 ${helloMessage}`, "yellow"));
        if (emails.length > 0) {
            console.log(colorText(`📧 This survey was sent from ${emails[1]}`, 'green'));
            console.log(colorText(`📧 Please fill it out and notify the sender. We will also send them an email.`, 'gray'));
        }
        else {
            console.log(colorText(`📧 This survey was sent to you directly.`, 'green'));
            console.log(colorText(`📧 Please fill it out and notify the sender.`, 'gray'));
        }
        const questions = parseQuestions(surveyData);
        const answers = await inquirer.prompt(questions.map((q) => {
            const type = questionTypeByControl[q.control];
            const format = formatByControl[q.control];
            return {
                type: type,
                name: q.name,
                required: true,
                message: q.message || q.name,
                default: q.default || undefined,
                validate: (input) => validateInput(format, input) || `Invalid ${format} format`,
                choices: q.choices
            };
        }));
        const encryptedAnswers = encryptAnswers(hello, answers, publicKey);
        if (!emails.length) {
            const sendEmails = await requestEmails();
            if (sendEmails) {
                emails.push(...sendEmails.reverse());
            }
        }
        const { acceptToFinish } = await inquirer.prompt([
            {
                type: "confirm",
                name: "acceptToFinish",
                message: "Do you want to finish the survey?"
            }
        ]);
        if (!acceptToFinish) {
            console.error("🚫 Survey not completed. Exiting...");
            process.exit(0);
        }
        console.log(colorText(`Great! Send this command to the person who should import the answers and fill their env file`, "gray"));
        if (emails.length > 0) {
            const [toEmail, fromEmail] = emails;
            const email = `${toEmail}:${fromEmail}`;
            const toBase64 = Buffer.from(email).toString("base64");
            const result = `${encryptedAnswers}.${toBase64}`;
            await sendSurveyRequest('import', result);
            console.log(colorText(`✅ Email sent to ${toEmail}!`, "green"));
            console.log(colorText(`Please check your spam folder if you don't see the email.`, "gray"));
            console.log(colorText(`npx cryenv --import ${result}`, "green"));
            copyToClipboard(`npx cryenv --import ${result}`);
        }
        else {
            console.log(colorText(`npx cryenv --import ${encryptedAnswers}`, "green"));
            copyToClipboard(`npx cryenv --import ${encryptedAnswers}`);
        }
        console.log(colorText("📦 Encrypted answers copied to clipboard!", 'gray'));
    }
    catch (e) {
        console.error("❌ An error occurred while filling the survey.", e.message);
        process.exit(1);
    }
};
export const copyToClipboard = (text) => {
    const platform = process.platform;
    try {
        if (platform === "darwin") {
            execSync(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`);
        }
        else if (platform === "win32") {
            execSync(`echo ${text} | clip`, { shell: "cmd.exe" });
        }
        else {
            execSync(`echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`);
        }
    }
    catch (error) {
        console.error("❌ Clipboard copy failed:", error.message);
    }
};
export const saveToEnv = (data, envOutput) => {
    if (!fs.existsSync(envOutput)) {
        fs.writeFileSync(envOutput, '');
    }
    Object.entries(data).forEach(([key, value]) => {
        updateEnvVariable(envOutput, key, value);
    });
};
export const importSurvey = async (encryptedToken, saveTo) => {
    const decryptedAnswers = await decryptAnswers(encryptedToken);
    try {
        for (const [key, value] of Object.entries(decryptedAnswers)) {
            console.log(colorText(`${key}: ${value}`, "yellow"));
        }
        const envOutput = saveTo ? path.join(process.cwd(), saveTo) : path.join(process.cwd(), ".env");
        const { acceptToSave } = await inquirer.prompt([
            {
                type: "confirm",
                name: "acceptToSave",
                message: `Save the answers to ${envOutput}?`
            }
        ]);
        if (!acceptToSave) {
            console.log("🚫 Survey not imported. Exiting...");
            process.exit(0);
        }
        saveToEnv(decryptedAnswers, envOutput);
        console.log(colorText(`✅ All answers saved to ${envOutput}`, "green"));
    }
    catch (e) {
        console.error("❌ An error occurred while importing the survey.", e.message);
        process.exit(1);
    }
};
export const fromEnv = async (filepath) => {
    const envPath = filepath ? path.join(process.cwd(), filepath) : path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
        console.error(`❌ File ${envPath} not found`);
        process.exit(1);
    }
    else {
        console.log(colorText(`📦 Reading from ${envPath}`, "green"));
    }
    const missingKeys = getMissingEnvKeys(envPath);
    console.log(missingKeys);
    if (missingKeys.length === 0) {
        console.log(colorText("✅ All keys are present in the .env file", "yellow"));
        process.exit(0);
    }
    createSurveyByKeys(missingKeys);
};
//# sourceMappingURL=index.js.map