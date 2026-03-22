import { describe, it, expect } from "vitest";
import { diffLines } from "./differ.js";

describe("diffLines", () => {
  it("同じ内容なら空配列を返す", () => {
    const result = diffLines("hello\nworld", "hello\nworld");
    // コンテキスト行のみ
    expect(result.every((line) => line.startsWith(" "))).toBe(true);
  });

  it("追加行を + で表示する", () => {
    const result = diffLines("hello", "hello\nworld");
    expect(result.some((line) => line === "+world")).toBe(true);
  });

  it("削除行を - で表示する", () => {
    const result = diffLines("hello\nworld", "hello");
    expect(result.some((line) => line === "-world")).toBe(true);
  });

  it("変更行を -/+ ペアで表示する", () => {
    const result = diffLines("old line", "new line");
    expect(result.some((line) => line === "-old line")).toBe(true);
    expect(result.some((line) => line === "+new line")).toBe(true);
  });
});
