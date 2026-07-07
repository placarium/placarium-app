#!/usr/bin/env node
/**
 * Setup de ambiente local (idempotente):
 * 1. Cria .env na raiz a partir de .env.example (se não existir)
 * 2. Cria symlinks para os apps lerem o MESMO .env:
 *    apps/web/.env.local -> ../../.env   (Next lê sozinho)
 *    apps/ingest/.env    -> ../../.env   (dotenv/config lê do cwd)
 *
 * Rodar: pnpm setup:env (ou node scripts/setup-env.mjs)
 */
import { copyFileSync, existsSync, lstatSync, symlinkSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const envFile = join(root, ".env");
if (!existsSync(envFile)) {
  copyFileSync(join(root, ".env.example"), envFile);
  console.log("✔ .env criado a partir de .env.example — revise os valores");
} else {
  console.log("• .env já existe — mantido");
}

ensureSymlink(join(root, "apps/web/.env.local"), "../../.env");
ensureSymlink(join(root, "apps/ingest/.env"), "../../.env");

function ensureSymlink(linkPath, target) {
  try {
    const stat = lstatSync(linkPath, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) {
      unlinkSync(linkPath);
    } else if (stat) {
      console.warn(`! ${linkPath} existe como arquivo comum — não vou sobrescrever`);
      return;
    }
    symlinkSync(target, linkPath);
    console.log(`✔ symlink ${linkPath} -> ${target}`);
  } catch (error) {
    console.error(`✖ falha criando symlink ${linkPath}:`, error.message);
    process.exitCode = 1;
  }
}
