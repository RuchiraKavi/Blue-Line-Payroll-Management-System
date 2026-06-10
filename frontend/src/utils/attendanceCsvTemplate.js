/**
 * Attendance upload template — must match backend parser (attendanceCsvParse.js).
 * Save from Excel as: CSV UTF-8 (Comma delimited).
 */
export const ATTENDANCE_CSV_HEADERS = [
  "employee_id",
  "date",
  "employee_name",
  "inTime",
  "outTime",
  "workingHours",
  "status",
  "Holidays",
  "Day off",
  "Leave",
];

/** Example rows — replace with your employees; delete samples before bulk upload if needed. */
const SAMPLE_ROWS = [
  ["BL001", "5/31/2026", "John", "8:30", "17:30", "8:30", "Present", "0", "0", "0"],
  ["BL002", "5/31/2026", "Tom", "-", "-", "-", "Absent", "0", "1", "0"],
  ["BL003", "5/31/2026", "Alice", "8:30", "17:30", "8:30", "Present", "0", "0", "0"],
];

function escapeCsvCell(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadAttendanceUploadTemplate(filename = "Attendance_CSV_Format.csv") {
  const lines = [
    ATTENDANCE_CSV_HEADERS.map(escapeCsvCell).join(","),
    ...SAMPLE_ROWS.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  const csv = `\uFEFF${lines.join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
