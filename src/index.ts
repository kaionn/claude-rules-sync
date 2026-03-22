#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { syncCommand } from "./commands/sync.js";
import { diffCommand } from "./commands/diff.js";
import { scanCommand } from "./commands/scan.js";

const program = new Command();

program
  .name("claude-rules-sync")
  .description("Sync Claude Code rules and commands across multiple repositories")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize .claude-sync.json in the current project")
  .option("-s, --source <path>", "Source directory for rules/commands")
  .action(initCommand);

program
  .command("sync")
  .description("Sync rules and commands from the source directory")
  .option("-d, --dry-run", "Show what would be synced without making changes")
  .option("-f, --force", "Overwrite without checking for differences")
  .action(syncCommand);

program
  .command("diff")
  .description("Show differences between local and source rules/commands")
  .action(diffCommand);

program
  .command("scan")
  .description("Scan repositories for duplicate rules")
  .argument("[dir]", "Directory to scan", ".")
  .option("-d, --depth <n>", "Max directory depth to scan", "3")
  .action(scanCommand);

program.parse();
