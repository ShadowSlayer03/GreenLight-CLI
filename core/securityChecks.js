import { execa } from "execa";
import chalk from "chalk";
import fs from "fs";

export async function runSecurityChecks() {
    const securityResults = [];
    try {
        console.log(chalk.blue("Running security checks..."));

        const { stdout: changedFiles } = await execa("git", ["diff", "--name-only", "HEAD"]);
        const filesArray = changedFiles.split('\n').filter(file => file.trim() !== '');

        if (filesArray.length === 0) {
            console.log(chalk.green("✔️ No changed files to check."));
            return securityResults;
        }

        // Define files to exclude from checks
        const excludedFiles = ['greenlight_report.md'];

        let consoleLogFound = false;
        for (const file of filesArray) {
            if (excludedFiles.includes(file)) {
                console.log(chalk.yellow(`⚠️  Skipping excluded file: ${file}`));
                continue;
            }

            if (!fs.existsSync(file)) {
                console.log(chalk.yellow(`⚠️  File not found: ${file}`));
                continue;
            }

            try {
                const { stdout } = await execa("grep", ["-n", "console.log", file]);
                if (stdout) {
                    console.log(chalk.red(`❌ console.log found in ${file}:\n${stdout}`));
                    consoleLogFound = true;
                    securityResults.push({ command: { name: "Console Log Check", command: `grep -n console.log ${file}` }, exitCode: 1, message: stdout });
                }
            } catch (error) {
                if (error.exitCode !== 1) {
                    console.error(chalk.red(`Error checking file ${file}`), error);
                    securityResults.push({ command: { name: "Console Log Check", command: `grep -n console.log ${file}` }, exitCode: error.exitCode, message: error.message });
                }
            }
        }

        if (!consoleLogFound) {
            console.log(chalk.green("✔️ No console.log statements found in changed files."));
            securityResults.push({ command: { name: "Console Log Check", command: "grep -n console.log" }, exitCode: 0 });
        }
    } catch (error) {
        console.error(chalk.red("Error during security checks"), error);
        securityResults.push({ command: { name: "Security Check", command: "Security Check" }, exitCode: error.exitCode, message: error.message });
    }
    return securityResults;
}
