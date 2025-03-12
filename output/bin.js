#!/usr/bin/env node
import { useFile, createSurvey, fillSurvey, importSurvey, fromEnv } from "./index.js";
const args = process.argv.slice(2);
(async () => {
    if (args.length === 0) {
        await createSurvey();
    }
    else if (args[0] === "--fill" && args[1]) {
        await fillSurvey(args[1]);
    }
    else if (args[0] === "--import" && args[1]) {
        const envPathIndex = args.indexOf("--path");
        const envPath = envPathIndex !== -1 && args[envPathIndex + 1] ? args[envPathIndex + 1] : undefined;
        await importSurvey(args[1], envPath);
    }
    else if (args[0] === "--restore" && args[1]) {
        await useFile(args[1]);
    }
    else if (args[0] === "--env") {
        await fromEnv(args[1]);
    }
    else {
        console.warn("❌ Invalid command. Usage:\n" +
            "\n🔹 Create a new survey (interactive mode):" +
            "\n   npx cryenv" +
            "\n" +
            "\n🔹 Fill out a survey using a token:" +
            "\n   npx cryenv --fill <token>" +
            "\n   Example: npx cryenv --fill hello::eJyLz8nNSU0s" +
            "\n" +
            "\n🔹 Import survey responses from a token into an .env file:" +
            "\n   npx cryenv --import <token> --path=.env" +
            "\n   Example: npx cryenv --import hello::eJyLz8nNSU0s --path=.env" +
            "\n" +
            "\n🔹 Restore survey data from a backup file:" +
            "\n   npx cryenv --restore <file>" +
            "\n   Example: npx cryenv --restore backup.json" +
            "\n" +
            "\n🔹 Use an existing .env file as a survey template:" +
            "\n   npx cryenv --env <file>" +
            "\n   Example: npx cryenv --env .env.example" +
            "\n");
        process.exit(1);
    }
})();
//# sourceMappingURL=bin.js.map