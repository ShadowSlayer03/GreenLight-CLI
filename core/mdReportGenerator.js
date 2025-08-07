import fs from "fs";
import path from "path";
import chalk from "chalk";

export function generateDetailedReport(reportData, results) {
  const reportFilePath = path.resolve("greenlight_report.md");
  const reportStream = fs.createWriteStream(reportFilePath);

  reportStream.write("# Greenlight Report\n\n");

  reportStream.write("## Changed Files\n");
  reportData.changedFiles.forEach((file) => {
    reportStream.write(`- ${file}\n`);
  });
  reportStream.write("\n");

  reportStream.write("## Affected Files\n");
  reportData.affectedFiles.forEach((file) => {
    reportStream.write(`- ${file}\n`);
  });
  reportStream.write("\n");

  reportStream.write("## Commands Executed\n");
  reportData.commands.forEach((command) => {
    reportStream.write(`- ${command.name}: ${command.command}\n`);
  });
  reportStream.write("\n");

  reportStream.write("## Results\n");
  results.forEach((result) => {
    const label = result.command?.name || "Unknown Task";
    const command = result.command?.command || "Unknown Command";
    const exitCode = result.exitCode !== undefined ? result.exitCode : "Unknown Exit Code";
    const duration = result.duration ? ` in ${result.duration}s` : '';

    if (exitCode === 0) {
      reportStream.write(`✔️  ${label} passed${duration}\n`);
    } else {
      reportStream.write(`❌ ${label} failed${duration}\n`);
      reportStream.write(`Command: ${command}\n`);
      reportStream.write(`Exit Code: ${exitCode}\n`);
    }
  });

  reportStream.end();
  console.log(chalk.green(`Report generated at ${reportFilePath}. \n`));
}
