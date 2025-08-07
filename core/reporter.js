import chalk from "chalk";

export function showSummary(results) {
  console.log();
  console.log();
  console.log(chalk.cyan("--- Summary ---"));

  results.forEach((result) => {
    const label = result.command?.name || "Unknown Task";
    const command = result.command?.command || "Unknown Command";
    const exitCode = result.exitCode !== undefined ? result.exitCode : "Unknown Exit Code";
    const duration = result.duration ? ` in ${result.duration}s` : '';

    if (exitCode === 0) {
      console.log(chalk.green(`✔️  ${label} passed${duration}`));
    } else {
      console.log(chalk.red(`❌ ${label} failed${duration}`));
      console.log(chalk.red(`Command: ${command}`));
      console.log(chalk.red(`Exit Code: ${exitCode}`));
    }
  });

  const allSuccess = results.every((res) => res.exitCode === 0);
  if (allSuccess) {
    console.log(
      chalk.green.bold(
        "\n🎉 Congratulations! You have been given the green light 🚦"
      )
    );
  }
}