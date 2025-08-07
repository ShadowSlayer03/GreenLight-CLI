#!/usr/bin/env node

import { Command } from "commander";
import { runChecks } from "../core/runChecks.js";
import analyzeImpact from "../core/impactAnalyzer.js";
import figlet from "figlet";
import chalk from "chalk";

function displayIntro() {
    const data = figlet.textSync("GreenLight", { font: "Graffiti" });
    console.log(chalk.green(data));
    console.log(chalk.green("Created by ShadowSlayer03(O810099)"));
    console.log(
        chalk.green("A CLI tool for running preflight checks efficiently.")
    );
    console.log();
}

const program = new Command();

program
    .name("greenlight")
    .description("Run preflight checks")
    .option("--smart", "Run only impacted tests/components and show summary")
    .option(
        "--only <tasks>",
        "Specify tasks to run, e.g. lint,build,test,component"
    )
    .option("--fix", "Auto-fix linting issues for lint(run with other tests)")
    .option(
        "--secure",
        "Run security checks for sensitive information and console logs"
    )
    .option("--report", "Generate a report (only works with --smart)")
    .option("--ignore-applitools", "Ignore applitools.config.js changes")
    .action(async (options) => {
        if (Object.keys(options).length > 0) displayIntro();

        const tasksToRun = options.only ? options.only.split(",") : null;
        const ignoreApplitools = options.ignoreApplitools;
        const checkSecurity = options.secure;
        const generateReport = options.report;

        if (generateReport && !options.smart) {
            console.log(
                chalk.red(
                    "Error: The --report flag can only be used with the --smart flag."
                )
            );
            return;
        }

        if (tasksToRun) {
            const { changedFiles, impactedFiles } = await analyzeImpact();
            await runChecks({
                tasks: tasksToRun,
                changedFiles,
                impactedFiles,
                fix: options.fix,
                ignoreApplitools,
                checkSecurity,
                generateReport,
            });
        } else if (options.smart) {
            const { changedFiles, impactedFiles } = await analyzeImpact();
            await runChecks({
                tasks: ["lint", "build", "test", "component"],
                changedFiles,
                impactedFiles,
                fix: options.fix,
                ignoreApplitools,
                checkSecurity,
                generateReport,
            });
        } else if (options.fix) {
            await runChecks({
                tasks: ["lint", ...tasksToRun],
                fix: options.fix,
                ignoreApplitools,
                checkSecurity,
                generateReport,
            });
        }
    });

if (process.argv.length <= 2) {
    displayIntro();
    program.outputHelp();
}

program.parse(process.argv);

process.on("SIGINT", () => {
    console.log(
        chalk.red("\nProcess interrupted by user. Bye!")
    );
    process.exit(1);
});

process.on("SIGTERM", () => {
    console.log(
        chalk.red("\nProcess terminated by user. Bye!")
    );
    process.exit(1);
});
