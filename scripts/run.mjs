#!/usr/bin/env node
/**
 * Cross-platform runner (Windows / macOS / Linux):
 * - sets DATABASE_URL default for SQLite
 * - unsets Next.js platform-injected standalone config
 * - ensures node_modules/.bin + current Node dir are on PATH
 *   (yarn/npm อาจเรียก node ด้วย absolute path แต่ PATH ไม่มี node)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binDir = path.join(root, "node_modules", ".bin");
const isWin = process.platform === "win32";
const nodeDir = path.dirname(process.execPath);

const env = { ...process.env };
delete env.__NEXT_PRIVATE_STANDALONE_CONFIG;
if (!env.DATABASE_URL) {
  env.DATABASE_URL = "file:./dev.db";
}

// Windows env key may be Path / PATH / path — keep the existing key
const pathKey =
  (isWin && Object.keys(env).find((k) => k.toLowerCase() === "path")) || "PATH";
env[pathKey] = [binDir, nodeDir, env[pathKey] || ""]
  .filter(Boolean)
  .join(path.delimiter);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run.mjs <command> [...args]");
  process.exit(1);
}

function resolveBin(cmd) {
  if (path.isAbsolute(cmd) || cmd.includes("/") || cmd.includes("\\")) {
    return cmd;
  }
  if (isWin) {
    for (const ext of [".cmd", ".bat", ".exe", ""]) {
      const candidate = path.join(binDir, cmd + ext);
      if (fs.existsSync(candidate)) return candidate;
    }
  } else {
    const candidate = path.join(binDir, cmd);
    if (fs.existsSync(candidate)) return candidate;
  }
  return cmd;
}

function winQuote(s) {
  if (!/[ \t"&<>|^]/.test(s)) return s;
  return `"${String(s).replace(/"/g, '""')}"`;
}

const command = resolveBin(args[0]);
const commandArgs = args.slice(1);

let child;
if (isWin) {
  // One cmdline string + shell avoids DEP0190 and runs .cmd correctly
  const cmdline = [command, ...commandArgs].map(winQuote).join(" ");
  child = spawn(cmdline, {
    env,
    stdio: "inherit",
    shell: true,
    cwd: root,
  });
} else {
  child = spawn(command, commandArgs, {
    env,
    stdio: "inherit",
    shell: false,
    cwd: root,
  });
}

child.on("error", (err) => {
  console.error(err.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
