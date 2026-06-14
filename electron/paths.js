import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Project root (parent of electron/). */
export function getProjectRoot() {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return path.join(__dirname, "..");
}

export function getBackendDir() {
  return path.join(getProjectRoot(), "backend");
}

export function getFrontendDistDir() {
  return path.join(getProjectRoot(), "frontend", "dist");
}

export const SERVER_HOST = "127.0.0.1";
export const SERVER_PORT = 5000;
export const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
