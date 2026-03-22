import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { createHash } from "node:crypto";
import chalk from "chalk";
import { glob } from "glob";

interface RuleEntry {
  repo: string;
  subDir: string;
  file: string;
  hash: string;
}

function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

interface ScanOptions {
  depth?: string;
}

export async function scanCommand(dir: string, options: ScanOptions): Promise<void> {
  const baseDir = resolve(dir);
  const depth = parseInt(options.depth ?? "3", 10);

  if (!existsSync(baseDir)) {
    console.log(chalk.red(`Directory not found: ${baseDir}`));
    process.exitCode = 1;
    return;
  }

  console.log(chalk.dim(`Scanning ${baseDir} (depth: ${depth})...`));

  // .claude ディレクトリを持つリポを探す
  const pattern = `${"*/".repeat(depth)}.claude/{rules,commands}/*.md`;
  const claudePaths = await glob(pattern, {
    cwd: baseDir,
    absolute: false,
  });

  // 直下の .claude も含む
  const directPaths = await glob(".claude/{rules,commands}/*.md", {
    cwd: baseDir,
    absolute: false,
  });
  claudePaths.push(...directPaths);

  if (claudePaths.length === 0) {
    console.log(chalk.yellow("No .claude/rules or .claude/commands found."));
    return;
  }

  const entries: RuleEntry[] = [];

  for (const relPath of claudePaths) {
    const absPath = join(baseDir, relPath);
    const content = await readFile(absPath, "utf-8");
    const hash = contentHash(content);

    // relPath: "repo/.claude/rules/file.md" → repo, rules, file.md
    const parts = relPath.split("/");
    const claudeIdx = parts.indexOf(".claude");
    const repo = parts.slice(0, claudeIdx).join("/") || ".";
    const subDir = parts[claudeIdx + 1];
    const file = parts.slice(claudeIdx + 2).join("/");

    entries.push({ repo, subDir, file, hash });
  }

  // ファイル名でグループ化
  const byFile = new Map<string, RuleEntry[]>();
  for (const entry of entries) {
    const key = `${entry.subDir}/${entry.file}`;
    const group = byFile.get(key) ?? [];
    group.push(entry);
    byFile.set(key, group);
  }

  // 重複ファイルを表示
  const duplicates = [...byFile.entries()].filter(([_, group]) => group.length > 1);

  if (duplicates.length === 0) {
    console.log(chalk.green("No duplicate rules found."));
    console.log(chalk.dim(`Scanned ${entries.length} file(s) across ${new Set(entries.map((e) => e.repo)).size} repo(s).`));
    return;
  }

  console.log(chalk.bold(`\nDuplicate rules found:\n`));

  for (const [key, group] of duplicates) {
    const hashes = new Set(group.map((e) => e.hash));
    const status = hashes.size === 1 ? chalk.green("identical") : chalk.yellow("divergent");

    console.log(`${chalk.bold(key)} (${status})`);
    for (const entry of group) {
      const repoPath = entry.repo === "." ? baseDir : relative(process.cwd(), join(baseDir, entry.repo));
      console.log(`  ${chalk.dim(repoPath)} ${chalk.dim(`[${entry.hash}]`)}`);
    }
    console.log();
  }

  const identicalCount = duplicates.filter(
    ([_, g]) => new Set(g.map((e) => e.hash)).size === 1,
  ).length;
  const divergentCount = duplicates.length - identicalCount;

  console.log(
    chalk.dim(
      `${duplicates.length} duplicate(s): ${identicalCount} identical, ${divergentCount} divergent`,
    ),
  );
}
