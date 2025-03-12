import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import crypto from "crypto";
import { readFileSync } from "fs";
const { existsSync, outputFileSync } = fs;
export const generateKeys = async () => {
    let keyName = "cryenv";
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });
    const outputPrivate = path.join(process.cwd(), `${keyName}.private.pem`);
    const outputPublic = path.join(process.cwd(), `${keyName}.public.pem`);
    const rootDir = path.dirname(outputPrivate);
    const { acceptSave } = await inquirer.prompt([
        {
            type: "confirm",
            name: "acceptSave",
            message: `Save keys to ${rootDir}?`
        }
    ]);
    if (!acceptSave)
        return;
    outputFileSync(outputPrivate, privateKey);
    outputFileSync(outputPublic, publicKey);
    console.log(`🔐 Keys generated and saved to ${rootDir}!`);
};
export const provideKeys = async () => {
    const keys = await getPathKeys('cryenv');
    if (!keys) {
        await generateKeys();
    }
    return true;
};
export const getPathKeys = async (key) => {
    const publicPem = path.join(process.cwd(), `${key}.public.pem`);
    const privatePem = path.join(process.cwd(), `${key}.private.pem`);
    if (existsSync(publicPem) && existsSync(privatePem)) {
        return [publicPem, privatePem];
    }
    return null;
};
export const getPublicKey = async () => {
    const outputPublic = path.join(process.cwd(), `cryenv.public.pem`);
    if (!existsSync(outputPublic)) {
        console.error("❌ Public key not found. Please generate keys first.");
        console.error(`Run 'cryenv generate' to generate keys`);
        process.exit(1);
    }
    else {
        const publicKey = readFileSync(outputPublic, "utf-8");
        return publicKey;
    }
};
export const getPrivateKey = async () => {
    const outputPrivate = path.join(process.cwd(), `cryenv.private.pem`);
    if (!existsSync(outputPrivate)) {
        console.error("❌ Private key not found. Please generate keys first.");
        console.error(`Run 'cryenv generate' to generate keys`);
        process.exit(1);
    }
    const privateKey = readFileSync(outputPrivate, "utf-8");
    return privateKey;
};
//# sourceMappingURL=keys.js.map