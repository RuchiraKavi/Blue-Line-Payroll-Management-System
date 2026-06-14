import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");

function copyMissingFiles(sourceDir, targetDir) {
  if (!sourceDir || !targetDir || sourceDir === targetDir) return 0;
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

/** Directory where uploaded profile images and files are stored. */
export function getUploadsDir() {
  if (process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR;
  }
  return path.join(backendRoot, "public", "uploads");
}

/** Copy bundled/dev upload files into the active uploads directory. */
export function syncUploadSeeds() {
  const targetDir = getUploadsDir();
  fs.mkdirSync(targetDir, { recursive: true });

  const seedDirs = [
    path.join(backendRoot, "public", "uploads"),
    path.join(backendRoot, "uploads"),
  ];

  if (process.env.RESOURCES_PATH) {
    seedDirs.push(
      path.join(process.env.RESOURCES_PATH, "backend", "public", "uploads")
    );
  }

  let totalCopied = 0;
  for (const seedDir of seedDirs) {
    totalCopied += copyMissingFiles(seedDir, targetDir);
  }

  if (totalCopied > 0) {
    console.log(`Synced ${totalCopied} upload file(s) into ${targetDir}`);
  }

  return totalCopied;
}

export function ensureUploadsDir() {
  const dir = getUploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  syncUploadSeeds();
  return dir;
}

export function normalizeUploadFilename(filename) {
  if (!filename || typeof filename !== "string") return "";
  return filename
    .trim()
    .replace(/^\/+/, "")
    .replace(/^uploads\//i, "")
    .replace(/^public\/uploads\//i, "")
    .replace(/\\/g, "/")
    .split("/")
    .pop();
}

export function getUploadFilePath(filename) {
  const normalized = normalizeUploadFilename(filename);
  if (!normalized) return null;
  return path.join(getUploadsDir(), normalized);
}

export function uploadFileExists(filename) {
  const filePath = getUploadFilePath(filename);
  return Boolean(filePath && fs.existsSync(filePath));
}
