import fs from "fs";
import csv from "csvtojson";

/** Escape string for case-insensitive exact regex match. */
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize header keys from csvtojson (BOM, spaces). */
export function normalizeCsvRecord(row) {
  const out = {};
  for (const [key, value] of Object.entries(row || {})) {
    const k = String(key).replace(/^\uFEFF/, "").trim();
    out[k] = value;
  }
  return out;
}

function headerKeyNorm(key) {
  return String(key).replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_");
}

/** Read field by header name (handles BOM, spaces, Day off / day_off). */
export function getCsvField(row, ...aliases) {
  const normalized = normalizeCsvRecord(row);
  for (const alias of aliases) {
    if (normalized[alias] !== undefined && normalized[alias] !== "") return normalized[alias];
  }
  const map = {};
  for (const [key, value] of Object.entries(normalized)) {
    map[headerKeyNorm(key)] = value;
  }
  for (const alias of aliases) {
    const k = headerKeyNorm(alias);
    if (map[k] !== undefined && map[k] !== "") return map[k];
  }
  return undefined;
}

/** Read file as text (UTF-8 BOM, UTF-16 LE from Excel). */
export function readCsvFileText(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.slice(2).toString("utf16le");
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.slice(3).toString("utf8");
  }
  let text = buf.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return text;
}

function detectDelimiter(firstLine) {
  const line = firstLine || "";
  const counts = {
    ",": (line.match(/,/g) || []).length,
    ";": (line.match(/;/g) || []).length,
    "\t": (line.match(/\t/g) || []).length,
  };
  let best = ",";
  let max = counts[","];
  for (const d of [";", "\t"]) {
    if (counts[d] > max) {
      max = counts[d];
      best = d;
    }
  }
  return max >= 4 ? best : ",";
}

/**
 * Parse attendance CSV from disk (Excel-safe: BOM, UTF-16, comma/semicolon/tab).
 */
export async function parseAttendanceCsvFile(filePath) {
  const raw = readCsvFileText(filePath);
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);
  const records = await csv({ delimiter }).fromString(raw);
  return records.map(normalizeCsvRecord);
}
/** Treat "-", empty, etc. as missing. */
export function normalizeCsvCell(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === "" || s === "-" || s === "—" || s.toLowerCase() === "n/a") return null;
  return s;
}

/**
 * Parse CSV date: M/D/YYYY, MM/DD/YYYY, YYYY-MM-DD, or ISO.
 * @returns {Date|null} Local midnight
 */
export function parseCsvDate(value) {
  const s = normalizeCsvCell(value);
  if (!s) return null;

  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    const month = parseInt(mdy[1], 10) - 1;
    const day = parseInt(mdy[2], 10);
    let year = parseInt(mdy[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const d = new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

/** YYYY-MM-DD in local timezone (for API responses and date picker). */
export function formatLocalDateKey(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD query param as local midnight. */
export function parseQueryDateLocal(dateStr) {
  const s = normalizeCsvCell(dateStr);
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const d = new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseTimeToMinutes(timeStr) {
  const s = normalizeCsvCell(timeStr);
  if (!s) return null;
  const parts = s.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Derive working hours from in/out (e.g. 9:05–17:10 → "8:05"). */
export function computeWorkingHoursFromInOut(inTime, outTime) {
  const inMin = parseTimeToMinutes(inTime);
  const outMin = parseTimeToMinutes(outTime);
  if (inMin == null || outMin == null || outMin <= inMin) return null;
  const total = outMin - inMin;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}:${String(mins).padStart(2, "0")}` : String(hours);
}

/**
 * status column: Present | Absent (case-insensitive).
 * Day off / Leave flags also mark absent.
 */
export function parseAttendanceStatus(row) {
  const statusRaw = (normalizeCsvCell(getCsvField(row, "status")) || "").toLowerCase();
  const dayOffVal = getCsvField(row, "Day off", "day_off", "dayoff");
  const leaveVal = getCsvField(row, "Leave", "leave");  const isDayOff =
    dayOffVal !== undefined &&
    dayOffVal !== null &&
    dayOffVal !== "" &&
    String(dayOffVal).trim() !== "0" &&
    normalizeCsvCell(dayOffVal) !== "0";
  const isOnLeave =
    leaveVal !== undefined &&
    leaveVal !== null &&
    leaveVal !== "" &&
    String(leaveVal).trim() !== "0" &&
    normalizeCsvCell(leaveVal) !== "0";

  const isAbsent =
    statusRaw === "absent" ||
    statusRaw === "day off" ||
    isDayOff ||
    isOnLeave;

  return { isAbsent, statusRaw };
}

export function resolveWorkingHoursForRow(row, isAbsent) {
  if (isAbsent) return null;
  const explicit = normalizeCsvCell(getCsvField(row, "workingHours", "working_hours", "workinghours"));
  if (explicit) return explicit;
  return computeWorkingHoursFromInOut(
    getCsvField(row, "inTime", "intime", "in_time"),
    getCsvField(row, "outTime", "outtime", "out_time")
  );
}
/**
 * Find employee by employee_id (exact + case-insensitive) or employee_name.
 */
export async function findEmployeeForAttendanceRow(row, Employee, User) {
  const empId = normalizeCsvCell(getCsvField(row, "employee_id", "employeeId", "employee id"));
  const empName = normalizeCsvCell(getCsvField(row, "employee_name", "employeeName", "employee name", "name"));
  if (empId) {
    let employee = await Employee.findOne({ employee_id: empId });
    if (!employee) {
      employee = await Employee.findOne({
        employee_id: { $regex: new RegExp(`^${escapeRegex(empId)}$`, "i") },
      });
    }
    if (employee) return employee;
  }

  if (empName) {
    let user = await User.findOne({ name: empName });
    if (!user) {
      user = await User.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(empName)}$`, "i") },
      });
    }
    if (user) {
      const employee = await Employee.findOne({ userId: user._id });
      if (employee) return employee;
    }
  }

  return null;
}
