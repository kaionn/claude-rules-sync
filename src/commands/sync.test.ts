import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { saveConfig } from "../lib/config.js";
import { syncCommand } from "./sync.js";

describe("syncCommand", () => {
  let projectDir: string;
  let sourceDir: string;

  beforeEach(async () => {
    const base = await mkdtemp(join(tmpdir(), "claude-rules-sync-test-"));
    projectDir = join(base, "project");
    sourceDir = join(base, "source");

    await mkdir(join(sourceDir, "rules"), { recursive: true });
    await mkdir(join(sourceDir, "commands"), { recursive: true });
    await mkdir(projectDir, { recursive: true });

    // ソースにルールファイルを配置
    await writeFile(join(sourceDir, "rules", "test-rule.md"), "# Test Rule\nContent here");
    await writeFile(join(sourceDir, "commands", "test-cmd.md"), "# Test Command");
  });

  afterEach(async () => {
    const base = join(projectDir, "..");
    await rm(base, { recursive: true });
  });

  it("ソースからルールをコピーできる", async () => {
    await saveConfig(projectDir, {
      source: sourceDir,
      targets: { rules: ["*"] },
      strategy: "overwrite",
    });

    const origCwd = process.cwd();
    process.chdir(projectDir);

    try {
      await syncCommand({});

      const destFile = join(projectDir, ".claude", "rules", "test-rule.md");
      expect(existsSync(destFile)).toBe(true);

      const content = await readFile(destFile, "utf-8");
      expect(content).toBe("# Test Rule\nContent here");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("同一内容のファイルはスキップされる", async () => {
    await saveConfig(projectDir, {
      source: sourceDir,
      targets: { rules: ["*"] },
      strategy: "overwrite",
    });

    const origCwd = process.cwd();
    process.chdir(projectDir);

    try {
      // 1回目: コピー
      await syncCommand({});
      // 2回目: スキップされるはず
      await syncCommand({});

      const destFile = join(projectDir, ".claude", "rules", "test-rule.md");
      expect(existsSync(destFile)).toBe(true);
    } finally {
      process.chdir(origCwd);
    }
  });

  it("dry-run ではファイルをコピーしない", async () => {
    await saveConfig(projectDir, {
      source: sourceDir,
      targets: { rules: ["*"] },
      strategy: "overwrite",
    });

    const origCwd = process.cwd();
    process.chdir(projectDir);

    try {
      await syncCommand({ dryRun: true });

      const destFile = join(projectDir, ".claude", "rules", "test-rule.md");
      expect(existsSync(destFile)).toBe(false);
    } finally {
      process.chdir(origCwd);
    }
  });
});
