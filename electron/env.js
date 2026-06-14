import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { getBackendDir } from "./paths.js";

const SECRETS_TEMPLATE = `# Email credentials for Payroll Management (Gmail App Password required)
EMAIL_USER=
EMAIL_PASS=
`;

function parseEnvLines(content) {
  const keys = new Set();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    keys.add(trimmed.slice(0, eq).trim());
  }
  return keys;
}

function mergeMissingKeys(targetPath, sourcePath) {
  if (!fs.existsSync(sourcePath)) return;

  const source = fs.readFileSync(sourcePath, "utf8");
  const target = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, "utf8")
    : "";

  const targetKeys = parseEnvLines(target);
  const linesToAppend = [];

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!targetKeys.has(key)) {
      linesToAppend.push(line);
      targetKeys.add(key);
    }
  }

  if (linesToAppend.length === 0) return;

  const prefix = target.length > 0 && !target.endsWith("\n") ? "\n" : "";
  fs.appendFileSync(targetPath, `${prefix}${linesToAppend.join("\n")}\n`, "utf8");
}

function copyEmailFromDevEnv(userEnvPath, secretsPath) {
  const devEnvPath = path.join(getBackendDir(), ".env");
  if (!fs.existsSync(devEnvPath)) return;

  const devVars = {};
  for (const line of fs.readFileSync(devEnvPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    devVars[key] = value;
  }

  if (!devVars.EMAIL_USER?.trim() || !devVars.EMAIL_PASS?.trim()) return;

  const secretsContent = fs.existsSync(secretsPath)
    ? fs.readFileSync(secretsPath, "utf8")
    : "";
  const secretsKeys = parseEnvLines(secretsContent);

  const hasEmailInSecrets =
    /^\s*EMAIL_USER\s*=\s*\S/m.test(secretsContent) &&
    /^\s*EMAIL_PASS\s*=\s*\S/m.test(secretsContent);

  const hasEmailInUserEnv =
    fs.existsSync(userEnvPath) &&
    /^\s*EMAIL_USER\s*=\s*\S/m.test(fs.readFileSync(userEnvPath, "utf8")) &&
    /^\s*EMAIL_PASS\s*=\s*\S/m.test(fs.readFileSync(userEnvPath, "utf8"));

  if (hasEmailInSecrets || hasEmailInUserEnv) return;

  if (!fs.existsSync(secretsPath)) {
    fs.writeFileSync(secretsPath, SECRETS_TEMPLATE, "utf8");
  }

  let updated = fs.readFileSync(secretsPath, "utf8");

  if (!secretsKeys.has("EMAIL_USER") || !/^\s*EMAIL_USER\s*=\s*\S/m.test(updated)) {
    updated = updated.replace(
      /^\s*EMAIL_USER\s*=.*$/m,
      `EMAIL_USER=${devVars.EMAIL_USER}`
    );
    if (!/EMAIL_USER=/m.test(updated)) {
      updated += `\nEMAIL_USER=${devVars.EMAIL_USER}\n`;
    }
  }

  if (!secretsKeys.has("EMAIL_PASS") || !/^\s*EMAIL_PASS\s*=\s*\S/m.test(updated)) {
    updated = updated.replace(
      /^\s*EMAIL_PASS\s*=.*$/m,
      `EMAIL_PASS=${devVars.EMAIL_PASS}`
    );
    if (!/EMAIL_PASS=/m.test(updated)) {
      updated += `EMAIL_PASS=${devVars.EMAIL_PASS}\n`;
    }
  }

  fs.writeFileSync(secretsPath, updated, "utf8");
}

export function getSecretsEnvPath() {
  return path.join(app.getPath("userData"), "secrets.env");
}

/** Prepare writable env files for installed builds. */
export function bootstrapUserEnv() {
  const backendDir = getBackendDir();
  const userDataDir = app.getPath("userData");
  const userEnvPath = path.join(userDataDir, "backend.env");
  const secretsPath = getSecretsEnvPath();
  const bundledExample = path.join(backendDir, ".env.example");

  fs.mkdirSync(userDataDir, { recursive: true });

  if (!app.isPackaged) {
    const devEnv = path.join(backendDir, ".env");
    if (!fs.existsSync(secretsPath)) {
      fs.writeFileSync(secretsPath, SECRETS_TEMPLATE, "utf8");
    }
    if (fs.existsSync(devEnv)) {
      copyEmailFromDevEnv(userEnvPath, secretsPath);
      return { envPath: devEnv, secretsPath };
    }

    if (fs.existsSync(bundledExample)) {
      return { envPath: bundledExample, secretsPath };
    }

    return { envPath: null, secretsPath };
  }

  if (!fs.existsSync(userEnvPath) && fs.existsSync(bundledExample)) {
    fs.copyFileSync(bundledExample, userEnvPath);
  }

  mergeMissingKeys(userEnvPath, bundledExample);

  if (!fs.existsSync(secretsPath)) {
    fs.writeFileSync(secretsPath, SECRETS_TEMPLATE, "utf8");
  }

  copyEmailFromDevEnv(userEnvPath, secretsPath);

  return { envPath: userEnvPath, secretsPath };
}

/** Resolve the backend .env file path (writable in installed builds). */
export function resolveBackendEnvPath() {
  return bootstrapUserEnv().envPath;
}
