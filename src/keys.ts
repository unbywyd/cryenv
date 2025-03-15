import inquirer from "inquirer";
import path from "path";
import crypto from "crypto";
import { outputFile, pathExists, readFileSafe } from "fsesm";

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
    if (!acceptSave) return;

    await outputFile(outputPrivate, privateKey);
    await outputFile(outputPublic, publicKey);
    console.log(`🔐 Keys generated and saved to ${rootDir}!`);
};

export const provideKeys = async () => {
    const keys = await getPathKeys('cryenv');
    if (!keys) {
        await generateKeys();
    }
    return true;
}

export const getPathKeys = async (key: string): Promise<[string, string]> => {
    const publicPem = path.join(process.cwd(), `${key}.public.pem`);
    const privatePem = path.join(process.cwd(), `${key}.private.pem`);
    if (await pathExists(publicPem) && await pathExists(privatePem)) {
        return [publicPem, privatePem];
    }
    return null;
}

export const getPublicKey = async (): Promise<string> => {
    const outputPublic = path.join(process.cwd(), `cryenv.public.pem`);
    if (!pathExists(outputPublic)) {
        console.error("❌ Public key not found. Please generate keys first.");
        console.error(`Run 'cryenv generate' to generate keys`);
        process.exit(1);
    } else {
        const publicKey = readFileSafe(outputPublic, "utf-8");
        return publicKey;
    }
}
export const getPrivateKey = async (): Promise<string> => {
    const outputPrivate = path.join(process.cwd(), `cryenv.private.pem`);
    if (!pathExists(outputPrivate)) {
        console.error("❌ Private key not found. Please generate keys first.");
        console.error(`Run 'cryenv generate' to generate keys`);
        process.exit(1);
    }
    const privateKey = readFileSafe(outputPrivate, "utf-8");
    return privateKey;
}
