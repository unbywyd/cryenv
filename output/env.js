import path from 'path';
import fs from 'fs';
export function updateEnvVariable(envPath, key, value, onlyIfEmpty = false) {
    const envFilename = path.basename(envPath);
    try {
        let envContent = '';
        // Check if .env exists, if not create an empty one
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        else {
            console.log(`${envFilename} file not found. Creating a new one at ${envPath}.`);
            fs.writeFileSync(envPath, '');
        }
        // Split the content into lines
        const lines = envContent.split('\n');
        // Update the key-value pair if it exists, or add a new one if it doesn't
        let found = false;
        const updatedLines = lines.map((line) => {
            const [currentKey, ...rest] = line.split('=');
            if (currentKey.trim() === key) {
                found = true;
                // If `onlyIfEmpty` is true, do not overwrite existing non-empty values
                if (onlyIfEmpty && rest.join('=').trim() !== '') {
                    console.log(`${key} already exists in ${envFilename} and will not be updated.`);
                    return line;
                }
                return `${key}="${value}"`; // Replace or update the value
            }
            return line; // Keep the line as is
        });
        if (!found) {
            updatedLines.push(`${key}="${value}"`); // Add the new key-value pair if not found
        }
        // Write the updated content back to the .env file
        fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
        console.log(`${key} updated in ${envFilename}.`);
    }
    catch (error) {
        console.error(`Failed to update ${key} in ${envFilename}:`, error.message);
    }
}
export const getEmptyEnvKeys = (envFilePath) => {
    if (!fs.existsSync(envFilePath)) {
        console.error(`❌ .env file not found at path: ${envFilePath}`);
        return [];
    }
    const envContent = fs.readFileSync(envFilePath, "utf-8");
    const lines = envContent.split("\n");
    const missingKeys = [];
    for (const line of lines) {
        const cleanedLine = line.trim();
        if (!cleanedLine || cleanedLine.startsWith("#"))
            continue;
        if (!cleanedLine.includes("=")) {
            console.log(`⚠️ Key "${cleanedLine}" found without value`);
            missingKeys.push(cleanedLine.trim());
            continue;
        }
        const match = cleanedLine.match(/^([A-Za-z0-9_]+)=(?:"((?:[^"]|\\")*)"|'((?:[^']|\\')*)'|(.+))?$/);
        if (!match)
            continue;
        const key = match[1].trim();
        const value = (match[2] || match[3] || match[4] || "").trim();
        if (value === "") {
            missingKeys.push(key);
        }
    }
    return missingKeys;
};
//# sourceMappingURL=env.js.map