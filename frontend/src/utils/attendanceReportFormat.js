import { jsPDF } from "jspdf";
import {
  PAYSLIP_COMPANY_NAME,
  drawReportApprovalBlock,
} from "./paysheetFormat.js";

const PDF_HEADERS = [
  "EMPLOYEE ID",
  "EMPLOYEE NAME",
  "DEPARTMENT",
  "DESIGNATION",
  "DAYS WORKED",
  "TOTAL LEAVES",
];

const C = {
  border: [229, 231, 235],
  headerBg: [248, 250, 252],
  headerBlue: [239, 246, 255],
  rowHover: [239, 246, 255],
  text: [55, 65, 81],
  textDark: [17, 24, 39],
  textMuted: [107, 114, 128],
  blue: [30, 64, 175],
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split("-").map((n) => Number(n));
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Working days in range (Monday–Saturday, excluding Sunday). */
export function countWorkingDaysInRange(from, to) {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (!start || !end || end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (cursor.getDay() !== 0) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function resolveAttendanceReportPeriod(from, to) {
  const start = parseLocalDate(from || to);
  const end = parseLocalDate(to || from);

  if (!start) {
    return {
      year: "—",
      monthName: "—",
      daysWorkedInPeriod: 0,
    };
  }

  const year = start.getFullYear();
  let monthName = MONTH_NAMES[start.getMonth()] || "—";

  if (end && (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear())) {
    const endMonth = MONTH_NAMES[end.getMonth()] || "";
    monthName = `${monthName} – ${endMonth}`;
    if (start.getFullYear() !== end.getFullYear()) {
      monthName = `${monthName} ${start.getFullYear()}–${end.getFullYear()}`;
    }
  }

  return {
    year,
    monthName,
    daysWorkedInPeriod: countWorkingDaysInRange(from || to, to || from),
  };
}

export function mapSummaryToAttendanceRow(emp, leaveTotalsMap) {
  return {
    employee_id: emp.employee_id || "—",
    name: emp.employee_name || "—",
    department: emp.department || "—",
    designation: emp.designation || "—",
    days_worked: emp.workedDays ?? 0,
    total_leaves: leaveTotalsMap?.[emp.employee_db_id] ?? 0,
  };
}

export function buildAttendanceReportRows(summaryRows, leaveTotalsMap) {
  return (summaryRows || [])
    .map((emp) => mapSummaryToAttendanceRow(emp, leaveTotalsMap))
    .sort((a, b) => String(a.employee_id).localeCompare(String(b.employee_id)));
}

function equalColumnWidths(tableW, count) {
  const width = tableW / count;
  return Array.from({ length: count }, () => width);
}

function fillBox(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, "F");
}

function strokeBox(doc, x, y, w, h, color = C.border, lineWidth = 0.35) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  doc.rect(x, y, w, h, "S");
}

function drawText(doc, text, x, y, { align = "left", bold = false, size = 9, color = C.text } = {}) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(text ?? ""), x, y, { align });
}

function drawAttendanceReportHeader(doc, margin, y, tableW, monthName, year, daysWorkedInPeriod) {
  drawText(doc, PAYSLIP_COMPANY_NAME, margin + tableW / 2, y + 6, {
    align: "center",
    bold: true,
    size: 12,
    color: C.textDark,
  });
  drawText(doc, "Attendance Report", margin + tableW / 2, y + 13, {
    align: "center",
    bold: true,
    size: 10,
    color: C.blue,
  });

  let metaY = y + 22;
  drawText(doc, `Year: ${year}`, margin, metaY, { size: 9, color: C.textMuted });
  metaY += 5;
  drawText(doc, `Month: ${monthName}`, margin, metaY, { size: 9, color: C.textMuted });
  metaY += 5;
  drawText(doc, `Number of days worked: ${daysWorkedInPeriod}`, margin, metaY, {
    size: 9,
    color: C.textMuted,
  });

  return metaY + 8;
}

function drawAttendanceTableHead(doc, x, y, colWidths, rowH) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  fillBox(doc, x, y, tableW, rowH, C.headerBg);
  fillBox(doc, x + tableW * 0.35, y, tableW * 0.65, rowH, C.headerBlue);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  let colX = x;
  PDF_HEADERS.forEach((header, i) => {
    drawText(doc, header, colX + 3, y + 5.5, { align: "left", bold: true, size: 7, color: C.text });
    colX += colWidths[i];
  });

  return y + rowH;
}

function drawAttendanceDataRow(doc, x, y, colWidths, rowH, row, stripe) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  if (stripe) fillBox(doc, x, y, tableW, rowH, C.rowHover);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.15);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  const values = [
    row.employee_id || "—",
    row.name || "—",
    row.department || "—",
    row.designation || "—",
    String(row.days_worked ?? 0),
    String(row.total_leaves ?? 0),
  ];

  let colX = x;
  values.forEach((value, i) => {
    const isName = i === 1;
    const isNumeric = i >= 4;
    drawText(doc, value, colX + (isNumeric ? colWidths[i] - 3 : 3), y + 5.5, {
      align: isNumeric ? "right" : "left",
      bold: isName,
      size: 8.5,
      color: isName ? C.textDark : C.text,
    });
    colX += colWidths[i];
  });

  return y + rowH;
}

/**
 * Download attendance report PDF (monthly summary format).
 */
export function downloadAttendanceReportPdf({
  rows,
  monthName,
  year,
  daysWorkedInPeriod,
  fileName,
  approvalInfo,
}) {
  if (!rows?.length) return;
  if (!approvalInfo?.signatureDataUrl) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const tableW = pageW - margin * 2;
  const colWidths = equalColumnWidths(tableW, 6);
  const headRowH = 9;
  const dataRowH = 8;
  const footerSpace = 40;

  let y = 14;
  let tableTopY = 0;

  const beginTable = () => {
    tableTopY = y;
    y = drawAttendanceTableHead(doc, margin, y, colWidths, headRowH);
  };

  const closeTable = () => {
    strokeBox(doc, margin, tableTopY, tableW, y - tableTopY);
  };

  y = drawAttendanceReportHeader(doc, margin, y, tableW, monthName, year, daysWorkedInPeriod);
  beginTable();

  rows.forEach((row, index) => {
    if (y + dataRowH > pageH - footerSpace) {
      closeTable();
      doc.addPage("landscape");
      y = 14;
      beginTable();
    }
    y = drawAttendanceDataRow(doc, margin, y, colWidths, dataRowH, row, index % 2 === 1);
  });

  closeTable();

  y += 8;
  const approvalBlockH = approvalInfo?.signatureDataUrl ? 38 : 30;
  if (y + approvalBlockH > pageH - margin) {
    doc.addPage("landscape");
    y = 14;
  }
  drawReportApprovalBlock(doc, margin, y, tableW, approvalInfo);

  const safeName =
    fileName ||
    `Attendance_Report_${String(monthName).replace(/\s+/g, "_")}_${year}.pdf`.replace(/\s+/g, "_");
  doc.save(safeName);
}

export { PAYSLIP_COMPANY_NAME as ATTENDANCE_REPORT_COMPANY_NAME };
