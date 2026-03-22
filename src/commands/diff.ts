import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import chalk from "chalk";
import { glob } from "glob";
import { loadConfig, resolveSourcePath } from "../lib/config.js";
import { diffLines } from "../lib/differ.js";
import { resolveFiles } from "../lib/files.js";

export async function diffCommand(): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const sourceDir = resolveSourcePath(config.source);
  const exclude = config.exclude ?? [];

  if (!existsSync(sourceDir)) {
    console.log(chalk.red(`Source directory not found: ${sourceDir}`));
    process.exitCode = 1;
    return;
  }

  const claudeDir = resolve(cwd, ".claude");
  let diffCount = 0;

  for (const [subDir, patterns] of Object.entries(config.targets)) {
    if (!patterns || patterns.length === 0) continue;

    const files = await resolveFiles(sourceDir, subDir, patterns, exclude);

    for (const file of files) {
      const srcPath = join(sourceDir, subDir, file);
      const destPath = join(claudeDir, subDir, file);

      if (!existsSync(destPath)) {
        console.log(chalk.yellow(`+ ${subDir}/${file} (new — exists only in source)`));
        diffCount++;
        continue;
      }

      const [srcContent, destContent] = await Promise.all([
        readFile(srcPath, "utf-8"),
        readFile(destPath, "utf-8"),
      ]);

      if (srcContent === destContent) continue;

      diffCount++;
      console.log(chalk.bold(`\n--- ${subDir}/${file} (local)`));
      console.log(chalk.bold(`+++ ${subDir}/${file} (source)`));
      const lines = diffLines(destContent, srcContent);
      for (const line of lines) {
        if (line.startsWith("+")) {
          console.log(chalk.green(line));
        } else if (line.startsWith("-")) {
          console.log(chalk.red(line));
        } else {
          console.log(chalk.dim(line));
        }
      }
    }

    const localDir = join(claudeDir, subDir);
    if (existsSync(localDir)) {
      const localFiles = await glob("*.md", {
        cwd: localDir,
        absolute: false,
      });
      const sourceFiles = new Set(files);
      for (const lf of localFiles) {
        if (!sourceFiles.has(lf)) {
          console.log(
            chalk.red(`- ${subDir}/${lf} (exists only locally — not in source)`),
          );
          diffCount++;
        }
      }
    }
  }

  if (diffCount === 0) {
    console.log(chalk.green("No differences found."));
  } else {
    console.log(chalk.dim(`\n${diffCount} file(s) with differences`));
  }
}
