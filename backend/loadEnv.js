import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readEnvFile(envPath) {
  if (!envPath || !fs.existsSync(envPath)) return {};
  try {
    return dotenv.parse(fs.readFileSync(envPath, "utf8"));
  } catch (error) {
    console.error(`Failed to read env file ${envPath}:`, error.message);
    return {};
  }
}

/**
 * Merge env files in order; later files override earlier ones.
 * Typical order: .env.example → backend.env → secrets.env
 */
export function loadEnv() {
  const layers = [];

  const localExample = path.join(__dirname, ".env.example");
  if (fs.existsSync(localExample)) {
    layers.push(localExample);
  }

  if (process.env.RESOURCES_PATH) {
    const bundledExample = path.join(process.env.RESOURCES_PATH, "backend", ".env.example");
    if (fs.existsSync(bundledExample) && bundledExample !== localExample) {
      layers.push(bundledExample);
    }
  }

  if (process.env.BACKEND_ENV_PATH && fs.existsSync(process.env.BACKEND_ENV_PATH)) {
    layers.push(process.env.BACKEND_ENV_PATH);
  } else {
    const localEnv = path.join(__dirname, ".env");
    if (fs.existsSync(localEnv)) {
      layers.push(localEnv);
    }
  }

  if (process.env.SECRETS_ENV_PATH && fs.existsSync(process.env.SECRETS_ENV_PATH)) {
    layers.push(process.env.SECRETS_ENV_PATH);
  }

  const merged = {};
  for (const envPath of layers) {
    Object.assign(merged, readEnvFile(envPath));
  }

  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null) {
      process.env[key] = String(value);
    }
  }

  const primary =
    process.env.BACKEND_ENV_PATH ||
    layers.find((p) => p.endsWith(".env") && !p.endsWith(".env.example")) ||
    layers[layers.length - 1] ||
    null;

  return primary;
}

export function isEmailConfigured() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  return Boolean(user && pass);
}
