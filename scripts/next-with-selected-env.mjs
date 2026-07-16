#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const allowedAppEnvs = new Set(["local", "dev", "stage", "prod"]);
const supportedNextCommands = new Set(["dev", "build", "start"]);

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);

      if (quote === '"') {
        value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
      }
    } else {
      // Strip inline comments for unquoted values.
      const commentIndex = value.indexOf(" #");
      if (commentIndex >= 0) {
        value = value.slice(0, commentIndex).trim();
      }
    }

    result[key] = value;
  }

  return result;
}

function fail(message) {
  console.error(`[env-loader] ${message}`);
  process.exit(1);
}

function validateAppEnv(value, sourceLabel) {
  if (!value) {
    fail(`${sourceLabel} must define one of: local, dev, stage, prod.`);
  }

  if (!allowedAppEnvs.has(value)) {
    fail(`Invalid ${sourceLabel}="${value}". Allowed values: local, dev, stage, prod.`);
  }

  return value;
}

const [nextCommand, ...nextArgs] = process.argv.slice(2);
if (!nextCommand) {
  fail("Missing Next.js command. Usage: node scripts/next-with-selected-env.mjs <dev|build|start> [...args]");
}

if (!supportedNextCommands.has(nextCommand)) {
  fail(`Unsupported command \"${nextCommand}\". Allowed commands: dev, build, start.`);
}

const rootEnvPath = path.join(projectRoot, ".env");
const appEnvFromProcess = process.env.APP_ENV?.trim();
let appEnv;

if (appEnvFromProcess) {
  appEnv = validateAppEnv(appEnvFromProcess, "APP_ENV");
} else {
  if (!existsSync(rootEnvPath)) {
    fail("Missing .env file in project root. Define APP_ENV to run without .env.");
  }

  const rootEnv = parseEnvFile(rootEnvPath);
  appEnv = validateAppEnv(rootEnv.NODE_ENV, "NODE_ENV in .env");
}

const selectedEnvPath = path.join(projectRoot, `.env.${appEnv}`);
let selectedEnv = {};

if (existsSync(selectedEnvPath)) {
  selectedEnv = parseEnvFile(selectedEnvPath);
} else if (!appEnvFromProcess) {
  fail(`Missing environment file: .env.${appEnv}`);
} else {
  console.warn(
    `[env-loader] .env.${appEnv} not found; continuing with process environment variables only.`
  );
}
const nextNodeEnv = nextCommand === "dev" ? "development" : "production";

const childEnv = {
  ...process.env,
  ...selectedEnv,
  APP_ENV: appEnv,
  NODE_ENV: nextNodeEnv,
  __NEXT_PROCESSED_ENV: "true",
};

const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(nextBin)) {
  fail("Could not locate Next.js CLI at node_modules/next/dist/bin/next.");
}

const child = spawn(process.execPath, [nextBin, nextCommand, ...nextArgs], {
  cwd: projectRoot,
  stdio: "inherit",
  env: childEnv,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
