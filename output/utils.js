import fs from "fs";
import path from "path";
export const getPackageName = async () => {
    let packageJsonPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packageJsonPath)) {
        const backLink = path.join(process.cwd(), "../package.json");
        if (!fs.existsSync(backLink)) {
            return null;
        }
        else {
            packageJsonPath = backLink;
        }
    }
    try {
        const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, "utf-8"));
        return packageJson.name ?? null;
    }
    catch (error) {
        return null;
    }
};
//# sourceMappingURL=utils.js.map