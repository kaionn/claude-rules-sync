import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, saveConfig, resolveSourcePath } from "./config.js";

describe("config", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "claude-rules-sync-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("saveConfig / loadConfig", () => {
    it("設定ファイルの保存と読み込みができる", async () => {
      const config = {
        source: "~/dotfiles/.claude",
        targets: { rules: ["*.md"] },
        strategy: "overwrite" as const,
      };

      await saveConfig(tempDir, config);
      const loaded = await loadConfig(tempDir);

      expect(loaded).toEqual(config);
    });

    it("JSON として正しくフォーマットされる", async () => {
      const config = {
        source: "/tmp/source",
        targets: { rules: ["a.md", "b.md"], commands: ["c.md"] },
        exclude: ["test-*"],
        strategy: "overwrite" as const,
      };

      await saveConfig(tempDir, config);
      const raw = await readFile(join(tempDir, ".claude-sync.json"), "utf-8");

      expect(raw).toContain('"source"');
      expect(raw.endsWith("\n")).toBe(true);
    });
  });

  describe("resolveSourcePath", () => {
    it("チルダをホームディレクトリに展開する", () => {
      const result = resolveSourcePath("~/test");
      expect(result).toBe(join(process.env.HOME ?? "", "test"));
    });

    it("絶対パスはそのまま返す", () => {
      const result = resolveSourcePath("/absolute/path");
      expect(result).toBe("/absolute/path");
    });
  });
});
