import { copyFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import chalk from "chalk";
import { glob } from "glob";
import { loadConfig, resolveSourcePath } from "../lib/config.js";

interface SyncOptions {
  dryRun?: boolean;
  force?: boolean;
}

async function resolveFiles(
  sourceDir: string,
  subDir: string,
  patterns: string[],
  exclude: string[],
): Promise<string[]> {
  const baseDir = join(sourceDir, subDir);
  if (!existsSync(baseDir)) return [];

  if (patterns.includes("*")) {
    return glob("*.md", { cwd: baseDir, ignore: exclude, absolute: false });
  }

  const files: string[] = [];
  for (const pattern of patterns) {
    const matched = await glob(pattern, {
      cwd: baseDir,
      ignore: exclude,
      absolute: false,
    });
    files.push(...matched);
  }
  return [...new Set(files)];
}

async function filesAreEqual(a: string, b: string): Promise<boolean> {
  try {
    const [contentA, contentB] = await Promise.all([
      readFile(a, "utf-8"),
      readFile(b, "utf-8"),
    ]);
    return contentA === contentB;
  } catch {
    return false;
  }
}

export async function syncCommand(options: SyncOptions): Promise<void> {
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
  let synced = 0;
  let skipped = 0;

  for (const [subDir, patterns] of Object.entries(config.targets)) {
    if (!patterns || patterns.length === 0) continue;

    const files = await resolveFiles(sourceDir, subDir, patterns, exclude);
    if (files.length === 0) {
      console.log(chalk.dim(`No files matched for ${subDir}/`));
      continue;
    }

    const targetDir = join(claudeDir, subDir);

    for (const file of files) {
      const srcPath = join(sourceDir, subDir, file);
      const destPath = join(targetDir, file);

      if (!options.force && existsSync(destPath)) {
        const equal = await filesAreEqual(srcPath, destPath);
        if (equal) {
          skipped++;
          continue;
        }
      }

      if (options.dryRun) {
        console.log(chalk.cyan(`  [dry-run] ${subDir}/${file}`));
        synced++;
        continue;
      }

      await mkdir(targetDir, { recursive: true });
      await copyFile(srcPath, destPath);
      console.log(chalk.green(`  synced ${subDir}/${file}`));
      synced++;
    }
  }

  if (options.dryRun) {
    console.log(chalk.dim(`\n${synced} file(s) would be synced, ${skipped} unchanged`));
  } else {
    console.log(chalk.dim(`\n${synced} file(s) synced, ${skipped} unchanged`));
  }
}
