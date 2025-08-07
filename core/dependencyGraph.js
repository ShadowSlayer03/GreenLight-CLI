import chalk from "chalk";
import ora from "ora";
import madge from "madge";
import fs from "fs";
import path from "path";

const GRAPH_CACHE_PATH = path.resolve("./dependencyGraphCache.json");
let graph = null;

export async function getDependencyGraph() {
  const spinner = ora(chalk.blue("Getting dependency graph...")).start();

  if (graph) {
    spinner.succeed(chalk.green("Dependency graph already in memory."));
    return graph;
  }

  if (fs.existsSync(GRAPH_CACHE_PATH)) {
    spinner.succeed(
      chalk.green("Fetched dependency graph from cache successfully!")
    );
    graph = JSON.parse(fs.readFileSync(GRAPH_CACHE_PATH, "utf8"));
  } else {
    spinner.text = chalk.yellow("Dependency graph not found! Generating...");
    try {
      const result = await madge(["./src", "./cypress/component"], {
        // Include both directories
        tsConfig: "./tsconfig.json",
        fileExtensions: ["ts", "tsx", "js", "jsx"],
      });
      graph = result.obj();
      fs.writeFileSync(GRAPH_CACHE_PATH, JSON.stringify(graph, null, 2));
      spinner.succeed(
        chalk.green("Dependency graph generated and cached successfully!")
      );
    } catch (error) {
      spinner.fail(chalk.red("Failed to generate dependency graph."));
      console.error(error);
    }
  }

  return graph;
}

export async function getImpactedFiles(changedFiles) {
  const graph = await getDependencyGraph();
  const impacted = new Set();

  function traverse(file) {
    impacted.add(file);
    for (const [key, deps] of Object.entries(graph)) {
      if (deps.includes(file) && !impacted.has(key)) {
        traverse(key);
      }
    }
  }

  const relativeChangedFiles = changedFiles.map((file) => {
    return path.relative(process.cwd(), file).replace(/\\/g, "/");
  });

  relativeChangedFiles.forEach((file) => {
    traverse(file);
  });

  return [...impacted];
}
