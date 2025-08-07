import concurrently from "concurrently";
import chalk from "chalk";
import { execa } from "execa";
import updateCypressTargets from "./updateCypressTargets.js";
import { showSummary } from "./reporter.js";
import path from "path";
import { runSecurityChecks } from "./securityCheck.js";
import { generateDetailedReport } from "./mdReportGenerator.js";

export async function runChecks({
  tasks = [],
  fix = false,
  changedFiles = null,
  impactedFiles = null,
  ignoreApplitools = false,
  checkSecurity = false,
  generateReport = false,
}) {
  const lintArgs = ["run", "lint", ...(fix ? ["--", "--fix"] : [])];
  const allResults = [];
  const reportData = {
    changedFiles: changedFiles || [],
    affectedFiles: impactedFiles || [],
    commands: [],
  };

  if (checkSecurity) {
    const securityResults = await runSecurityChecks();
    allResults.push(...securityResults);
    if (securityResults.some((res) => res.exitCode !== 0)) {
      showSummary(allResults);
      if (generateReport) generateDetailedReport(reportData, allResults);
      return;
    }
  }

  if (tasks.length === 0) {
    console.log(chalk.red("No valid tasks specified."));
    return;
  }

  // Lint and Build Phase
  const lintBuildCommands = [];
  if (tasks.includes("lint")) {
    lintBuildCommands.push({
      command: `npm ${lintArgs.join(" ")}`,
      name: "Lint",
      prefixColor: "blue",
    });
  }

  if (tasks.includes("build")) {
    lintBuildCommands.push({
      command: "npm run build",
      name: "Build",
      prefixColor: "green",
    });
  }

  if (lintBuildCommands.length > 0) {
    try {
      const { result: lintBuildPromise } = await concurrently(
        lintBuildCommands,
        {
          successCondition: "all",
          killOthersOn: ["failure"],
          prefix: "name",
          color: true,
        }
      );

      const lintBuildResults = await lintBuildPromise;

      lintBuildResults.forEach((res) => {
        res.duration = (
          (res.timings.endDate - res.timings.startDate) /
          1000
        ).toFixed(2);
      });

      allResults.push(...lintBuildResults);

      const lintBuildSuccess = lintBuildResults.every(
        (res) => res.exitCode === 0
      );

      if (!lintBuildSuccess) {
        console.log(
          chalk.red(
            "Lint or Build failed. Please fix the issues and try again."
          )
        );
        showSummary(allResults);
        if (generateReport) generateDetailedReport(reportData, allResults);
        return;
      }
    } catch (error) {
      console.error("Error during lint/build execution:", error);
      if (Array.isArray(error)) {
        showSummary([...allResults, ...error]);
        if (generateReport)
          generateDetailedReport(reportData, [...allResults, ...error]);
      }
      return;
    }
  }

  // Test and Component Phase
  const testComponentCommands = [];
  if (tasks.includes("test")) {
    if (impactedFiles) {
      const testFiles = impactedFiles
        .filter((file) => file.endsWith(".test.tsx"))
        .map((file) => path.basename(file, ".test.tsx"))
        .join(" ");

      if (testFiles) {
        testComponentCommands.push({
          command: `npm run test -- --no-coverage ${testFiles}`,
          name: "Test",
          prefixColor: "yellow",
        });
      } else {
        console.log(chalk.yellow("No impacted test files found."));
      }
    } else {
      testComponentCommands.push({
        command: "npm run test",
        name: "Test",
        prefixColor: "yellow",
      });
    }
  }

  if (tasks.includes("component")) {
    if (ignoreApplitools) {
      try {
        await execa("git", [
          "update-index",
          "--assume-unchanged",
          "applitools.config.js",
        ]);
        console.log(
          chalk.blue("Git assume-unchanged set for applitools.config.js")
        );
      } catch (error) {
        console.error(
          chalk.red(
            "Failed to set git assume-unchanged for applitools.config.js"
          ),
          error
        );
      }
    }

    const impactedSpecs = impactedFiles
      ?.filter((file) => file.endsWith(".cy.tsx"))
      ?.join(" ");

    if (impactedSpecs) {
      testComponentCommands.push({
        command: `cypress run CYPRESS_coverage=true --component --headless --reporter spec --env grepUntagged=true --spec ${impactedSpecs}`,
        name: "Component",
        prefixColor: "cyan",
      });
    } else {
      console.log(chalk.yellow("No impacted Cypress specs found."));
    }
  }

  if (testComponentCommands.length > 0) {
    try {
      const { result: testComponentPromise } = await concurrently(
        testComponentCommands,
        {
          successCondition: "all",
          killOthersOn: ["failure"],
          prefix: "name",
          color: true,
        }
      );

      const testComponentResults = await testComponentPromise;

      testComponentResults.forEach((res) => {
        res.duration = (
          (res.timings.endDate - res.timings.startDate) /
          1000
        ).toFixed(2);
      });

      allResults.push(...testComponentResults);

      showSummary(allResults);
      if (generateReport) generateDetailedReport(reportData, allResults);
    } catch (error) {
      console.error("Error during execution:", error);
      if (Array.isArray(error)) {
        showSummary([...allResults, ...error]);
        if (generateReport)
          generateDetailedReport(reportData, [...allResults, ...error]);
      }
    }
  } else {
    showSummary(allResults);
    if (generateReport) generateDetailedReport(reportData, allResults);
  }
}


