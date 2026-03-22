import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import chalk from "chalk";
import { loadConfig, resolveSourcePath } from "../lib/config.js";
import { resolveFiles, filesAreEqual } from "../lib/files.js";

interface SyncOptions {
  dryRun?: boolean;
  force?: boolean;
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
    if (!options.dryRun) {
      await mkdir(targetDir, { recursive: true });
    }

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
