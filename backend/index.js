import { loadEnv, isEmailConfigured } from "./loadEnv.js";
import connectToDatabase from "./db/db.js";
import { createApp } from "./createApp.js";
import { ensureUploadsDir } from "./utils/uploadsPath.js";
import fs from "fs";
import path from "path";

const envFile = loadEnv();
if (envFile) {
  console.log(`Environment loaded from: ${envFile}`);
}
console.log(
  isEmailConfigured()
    ? "Email: configured"
    : "Email: not configured (set EMAIL_USER and EMAIL_PASS in backend/.env or secrets.env)"
);

const uploadsDir = ensureUploadsDir();
const uploadCount = fs.existsSync(uploadsDir)
  ? fs.readdirSync(uploadsDir).filter((name) =>
      fs.statSync(path.join(uploadsDir, name)).isFile()
    ).length
  : 0;
console.log(`Uploads directory: ${uploadsDir} (${uploadCount} file(s))`);

try {
  await connectToDatabase();
} catch (error) {
  console.error(
    "Startup failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}

const app = createApp();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "127.0.0.1";

const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

server.on("error", (error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
