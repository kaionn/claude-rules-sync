import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import chalk from "chalk";
import { type SyncConfig, saveConfig, getConfigFileName } from "../lib/config.js";

interface InitOptions {
  source?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const configFile = getConfigFileName();
  const configPath = resolve(cwd, configFile);

  if (existsSync(configPath)) {
    console.log(chalk.yellow(`${configFile} already exists. Use 'sync' to update.`));
    return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const source =
      options.source ??
      (await rl.question(
        chalk.cyan("Source directory for rules/commands (e.g., ~/dotfiles/.claude): "),
      ));

    if (!source) {
      console.log(chalk.red("Source directory is required."));
      return;
    }

    const rulesInput = await rl.question(
      chalk.cyan('Rules to sync (comma-separated, or "*" for all, default: "*"): '),
    );
    const commandsInput = await rl.question(
      chalk.cyan('Commands to sync (comma-separated, or "*" for all, default: none): '),
    );
    const excludeInput = await rl.question(
      chalk.cyan("Patterns to exclude (comma-separated, default: none): "),
    );

    const parseList = (input: string): string[] | undefined => {
      const trimmed = input.trim();
      if (!trimmed) return undefined;
      if (trimmed === "*") return ["*"];
      return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    };

    const rules = parseList(rulesInput) ?? ["*"];
    const commands = parseList(commandsInput);
    const exclude = parseList(excludeInput);

    const config: SyncConfig = {
      source,
      targets: {
        rules,
        ...(commands && { commands }),
      },
      ...(exclude && { exclude }),
      strategy: "overwrite",
    };

    await saveConfig(cwd, config);
    console.log(chalk.green(`Created ${configFile}`));
    console.log(chalk.dim(JSON.stringify(config, null, 2)));
  } finally {
    rl.close();
  }
}
