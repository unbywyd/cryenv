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
export const getMissingEnvKeys = (envFilePath) => {
    if (!fs.existsSync(envFilePath)) {
        console.error(`❌ .env file not found at path: ${envFilePath}`);
        return [];
    }
    // Read the content of the .env file
    const envContent = fs.readFileSync(envFilePath, "utf-8");
    // Split the content into lines
    const lines = envContent.split("\n");
    // Find keys without values
    const missingKeys = [];
    for (const line of lines) {
        // Remove whitespace and comments
        const cleanedLine = line.trim();
        if (!cleanedLine || cleanedLine.startsWith("#"))
            continue;
        // Split the line into key and value
        const [key, value] = cleanedLine.split("=", 2).map((s) => s.trim());
        // If the value is empty or the key is not in process.env
        if (!value || !(key in process.env)) {
            missingKeys.push(key);
        }
    }
    return missingKeys;
};
//# sourceMappingURL=env.js.map