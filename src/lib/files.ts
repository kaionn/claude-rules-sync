import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { glob } from "glob";

export async function resolveFiles(
  sourceDir: string,
  subDir: string,
  patterns: string[],
  exclude: string[],
): Promise<string[]> {
  const baseDir = join(sourceDir, subDir);
  if (!existsSync(baseDir)) return [];

  const globPatterns = patterns.includes("*") ? ["*.md"] : patterns;
  const results = await Promise.all(
    globPatterns.map((p) => glob(p, { cwd: baseDir, ignore: exclude, absolute: false })),
  );
  return [...new Set(results.flat())];
}

export async function filesAreEqual(a: string, b: string): Promise<boolean> {
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
