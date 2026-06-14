import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import departmentRouter from "./routes/department.js";
import designationRouter from "./routes/designation.js";
import employeeRouter from "./routes/employee.js";
import attendanceRouter from "./routes/attendance.js";
import leaveRouter from "./routes/leave.js";
import passwordRouter from "./routes/password.js";
import salaryRouter from "./routes/salary.js";
import dashboardRouter from "./routes/dashboard.js";
import advanceRouter from "./routes/advance.js";
import roleRouter from "./routes/role.js";
import {
  getUploadFilePath,
  getUploadsDir,
  normalizeUploadFilename,
} from "./utils/uploadsPath.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        callback(null, true);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    })
  );

  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/departments", departmentRouter);
  app.use("/api/designations", designationRouter);
  app.use("/api/roles", roleRouter);
  app.use("/api/employees", employeeRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/leaves", leaveRouter);
  app.use("/api/password-change", passwordRouter);
  app.use("/api/salary", salaryRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/advance", advanceRouter);

  app.get("/uploads/:filename", (req, res, next) => {
    const filename = normalizeUploadFilename(req.params.filename);
    if (!filename) {
      return res.status(400).json({ success: false, message: "Invalid filename" });
    }

    const filePath = getUploadFilePath(filename);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    res.sendFile(path.resolve(filePath), (err) => {
      if (err) next(err);
    });
  });

  app.use("/uploads", express.static(getUploadsDir()));

  const frontendDist = process.env.FRONTEND_DIST;
  if (frontendDist) {
    app.use(express.static(frontendDist));
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        return next();
      }
      res.sendFile(path.join(frontendDist, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  return app;
}
