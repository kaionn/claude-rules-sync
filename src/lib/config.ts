import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface SyncConfig {
  source: string;
  targets: {
    rules?: string[];
    commands?: string[];
  };
  exclude?: string[];
  strategy: "overwrite" | "skip" | "prompt";
}

const CONFIG_FILE = ".claude-sync.json";

export function resolveSourcePath(source: string): string {
  if (source.startsWith("~/")) {
    return resolve(process.env.HOME ?? "", source.slice(2));
  }
  return resolve(source);
}

export async function loadConfig(dir: string): Promise<SyncConfig> {
  const configPath = resolve(dir, CONFIG_FILE);
  const content = await readFile(configPath, "utf-8");
  return JSON.parse(content) as SyncConfig;
}

export async function saveConfig(
  dir: string,
  config: SyncConfig,
): Promise<void> {
  const configPath = resolve(dir, CONFIG_FILE);
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function getConfigFileName(): string {
  return CONFIG_FILE;
}
