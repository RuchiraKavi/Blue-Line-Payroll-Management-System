import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { getBackendDir } from "./paths.js";

export function getUserUploadsDir() {
  return path.join(app.getPath("userData"), "uploads");
}

function copyMissingFiles(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return 0;

  fs.mkdirSync(targetDir, { recursive: true });
  let copied = 0;

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
      copied += 1;
    }
  }

  return copied;
}

/**
 * Resolve the writable uploads directory for Electron.
 * Dev: use project backend/public/uploads directly (always up to date).
 * Installed: use AppData and seed from bundled profile images.
 */
export function bootstrapUploads() {
  const projectUploads = path.join(getBackendDir(), "public", "uploads");
  fs.mkdirSync(projectUploads, { recursive: true });

  if (!app.isPackaged) {
    return projectUploads;
  }

  const userUploadsDir = getUserUploadsDir();
  fs.mkdirSync(userUploadsDir, { recursive: true });

  const seedSources = [projectUploads];

  let totalCopied = 0;
  for (const source of seedSources) {
    totalCopied += copyMissingFiles(source, userUploadsDir);
  }

  if (totalCopied > 0) {
    console.log(`[electron] Copied ${totalCopied} upload file(s) to ${userUploadsDir}`);
  }

  return userUploadsDir;
}
