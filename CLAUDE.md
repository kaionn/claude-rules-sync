# CLAUDE.md

## プロジェクト概要

Claude Code の `.claude/rules/` と `.claude/commands/` を複数リポジトリ間で一元管理・同期する CLI ツール。

## 技術スタック

- TypeScript + Node.js
- commander.js（CLI）
- chalk（カラー出力）
- glob（ファイルマッチ）
- vitest（テスト）

## コマンド

```bash
npm install        # 依存インストール
npm run build      # TypeScript ビルド
npm run dev        # tsx でビルドレス実行
npm test           # テスト実行
npm run lint       # ESLint
```

## Plan

実装計画は GitHub Issue #1 を参照:

```bash
gh issue view 1
```

## ディレクトリ構成

```
src/
  index.ts          # CLI エントリーポイント
  commands/         # 各サブコマンド
    init.ts
    sync.ts
    diff.ts
    scan.ts
  lib/              # 共通ロジック
    config.ts       # .claude-sync.json の読み書き
    scanner.ts      # ファイルスキャン
    differ.ts       # 差分比較
```
