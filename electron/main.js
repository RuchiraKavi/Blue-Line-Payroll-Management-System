import { app, BrowserWindow, dialog } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { assertPortAvailable } from "./port.js";
import {
  getBackendDir,
  getFrontendDistDir,
  getProjectRoot,
  SERVER_HOST,
  SERVER_PORT,
} from "./paths.js";
import { bootstrapUserEnv } from "./env.js";
import { bootstrapUploads } from "./uploads.js";

const isDev = !app.isPackaged;

let mainWindow = null;
let backendProcess = null;
let isQuitting = false;
let backendLogTail = "";
let backendReportedReady = false;
let activeServerUrl = `http://${SERVER_HOST}:${SERVER_PORT}`;

function log(...args) {
  if (isDev) {
    console.log("[electron]", ...args);
  }
}

function appendBackendLog(text) {
  backendLogTail = `${backendLogTail}${text}`.slice(-4000);
}

async function startBackend() {
  await assertPortAvailable(SERVER_PORT, SERVER_HOST);

  const backendDir = getBackendDir();
  const backendEntry = path.join(backendDir, "index.js");
  const frontendDist = getFrontendDistDir();
  const { envPath, secretsPath } = bootstrapUserEnv();
  const uploadsDir = bootstrapUploads();

  if (!fs.existsSync(backendEntry)) {
    throw new Error(`Backend entry not found: ${backendEntry}`);
  }

  if (!fs.existsSync(frontendDist)) {
    throw new Error(
      "Frontend build not found. Run `npm run build:frontend` before starting Electron."
    );
  }

  if (!envPath) {
    throw new Error(
      "Missing backend configuration. Expected backend/.env.example in the application bundle."
    );
  }

  backendReportedReady = false;
  activeServerUrl = `http://${SERVER_HOST}:${SERVER_PORT}`;

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      HOST: SERVER_HOST,
      PORT: String(SERVER_PORT),
      FRONTEND_DIST: frontendDist,
      BACKEND_ENV_PATH: envPath,
      SECRETS_ENV_PATH: secretsPath,
      UPLOADS_DIR: uploadsDir,
      RESOURCES_PATH: getProjectRoot(),
    };

    backendProcess = spawn(process.execPath, [backendEntry], {
      cwd: backendDir,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    backendProcess.stdout?.on("data", (chunk) => {
      const text = String(chunk);
      appendBackendLog(text);
      log(text.trim());
      if (text.includes("Server is running on")) {
        backendReportedReady = true;
      }
    });

    backendProcess.stderr?.on("data", (chunk) => {
      const text = String(chunk);
      appendBackendLog(text);
      console.error("[backend]", text.trim());
    });

    backendProcess.on("error", reject);

    backendProcess.on("exit", (code, signal) => {
      if (code !== 0 && code !== null && !isQuitting) {
        const details = backendLogTail.trim();
        dialog.showErrorBox(
          "Backend stopped",
          details
            ? `The server exited unexpectedly (code ${code}).\n\n${details}`
            : `The server exited unexpectedly (code ${code}${signal ? `, signal ${signal}` : ""}).\n\nEnsure MongoDB is running and check %APPDATA%\\payroll-management\\backend.env`
        );
        app.quit();
      }
    });

    waitForServer(resolve, reject);
  });
}

function waitForServer(resolve, reject) {
  const deadline = Date.now() + 60_000;
  let lastError = null;

  const attempt = () => {
    if (Date.now() > deadline) {
      reject(
        lastError ??
          new Error(
            backendLogTail.trim() ||
              "Timed out waiting for backend server. Ensure MongoDB is running."
          )
      );
      return;
    }

    if (!backendReportedReady) {
      setTimeout(attempt, 300);
      return;
    }

    const req = http.get(`${activeServerUrl}/api/health`, (res) => {
      res.resume();
      if (res.statusCode === 200 && backendProcess && !backendProcess.killed) {
        resolve();
        return;
      }
      setTimeout(attempt, 300);
    });

    req.on("error", (error) => {
      lastError = error;
      setTimeout(attempt, 300);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      setTimeout(attempt, 300);
    });
  };

  attempt();
}

function stopBackend() {
  if (!backendProcess) return;

  const proc = backendProcess;
  backendProcess = null;

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(proc.pid), "/f", "/t"], { windowsHide: true });
  } else {
    proc.kill("SIGTERM");
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: "Payroll Management",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.loadURL(activeServerUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await startBackend();
      createWindow();
    } catch (error) {
      dialog.showErrorBox(
        "Failed to start Payroll Management",
        error instanceof Error ? error.message : String(error)
      );
      app.quit();
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
    stopBackend();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
