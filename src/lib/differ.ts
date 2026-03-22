/**
 * 簡易行単位差分
 * 完全な diff アルゴリズムではなく、変更行をハイライトする簡易版。
 */
export function diffLines(a: string, b: string): string[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const output: string[] = [];

  const maxLen = Math.max(aLines.length, bLines.length);
  let contextBefore = 0;
  const CONTEXT = 3;

  for (let i = 0; i < maxLen; i++) {
    const aLine = aLines[i];
    const bLine = bLines[i];

    if (aLine === bLine) {
      contextBefore++;
      if (contextBefore <= CONTEXT) {
        output.push(` ${aLine}`);
      }
      continue;
    }

    // コンテキスト省略後の復帰
    if (contextBefore > CONTEXT) {
      output.push(`...`);
      // 直前のコンテキスト行を追加
      const start = Math.max(0, i - CONTEXT);
      for (let j = start; j < i; j++) {
        if (aLines[j] !== undefined) {
          output.push(` ${aLines[j]}`);
        }
      }
    }
    contextBefore = 0;

    if (aLine !== undefined && bLine !== undefined) {
      output.push(`-${aLine}`);
      output.push(`+${bLine}`);
    } else if (aLine !== undefined) {
      output.push(`-${aLine}`);
    } else if (bLine !== undefined) {
      output.push(`+${bLine}`);
    }
  }

  return output;
}
