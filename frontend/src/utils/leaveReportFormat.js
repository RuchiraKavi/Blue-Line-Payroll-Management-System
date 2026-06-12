import { jsPDF } from "jspdf";
import { PAYSLIP_COMPANY_NAME } from "./paysheetFormat.js";
import { leaveTypeLabels } from "./LeaveHelper.jsx";

const PDF_HEADERS = [
  "EMPLOYEE ID",
  "EMPLOYEE NAME",
  "DEPARTMENT",
  "DATE",
  "LEAVE TYPE",
];

const C = {
  border: [229, 231, 235],
  headerBg: [248, 250, 252],
  headerBlue: [239, 246, 255],
  approvalBg: [249, 250, 251],
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

export function leaveOverlapsMonth(leave, month, year) {
  if (!leave?.startDate || !leave?.endDate) return false;
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  return start <= monthEnd && end >= monthStart;
}

export function formatLeaveReportDate(startDate, endDate) {
  if (!startDate) return "—";
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  if (start.toDateString() === end.toDateString()) return fmt(start);
  return `${fmt(start)} - ${fmt(end)}`;
}

export function mapLeaveToReportRow(leave) {
  return {
    employee_id: leave?.employeeId?.employee_id || "—",
    name: leave?.employeeId?.userId?.name || "—",
    department: leave?.employeeId?.department?.dep_name || "—",
    date: formatLeaveReportDate(leave.startDate, leave.endDate),
    leave_type: leaveTypeLabels[leave?.leaveType] || leave?.leaveType || "—",
    startDate: leave?.startDate ? new Date(leave.startDate).getTime() : 0,
  };
}

export function buildLeaveReportRows(leaves, month, year) {
  return (leaves || [])
    .filter((leave) => leaveOverlapsMonth(leave, month, year))
    .map(mapLeaveToReportRow)
    .sort((a, b) => {
      const idCmp = String(a.employee_id).localeCompare(String(b.employee_id));
      if (idCmp !== 0) return idCmp;
      return a.startDate - b.startDate;
    })
    .map(({ startDate, ...row }) => row);
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

function drawLeaveReportHeader(doc, margin, y, tableW, monthName, year) {
  drawText(doc, PAYSLIP_COMPANY_NAME, margin + tableW / 2, y + 6, {
    align: "center",
    bold: true,
    size: 12,
    color: C.textDark,
  });
  drawText(doc, "Leave Report", margin + tableW / 2, y + 13, {
    align: "center",
    bold: true,
    size: 10,
    color: C.blue,
  });

  let metaY = y + 22;
  drawText(doc, `Year: ${year}`, margin, metaY, { size: 9, color: C.textMuted });
  metaY += 5;
  drawText(doc, `Month: ${monthName}`, margin, metaY, { size: 9, color: C.textMuted });

  return metaY + 8;
}

function drawLeaveTableHead(doc, x, y, colWidths, rowH) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  fillBox(doc, x, y, tableW, rowH, C.headerBg);
  fillBox(doc, x + tableW * 0.4, y, tableW * 0.6, rowH, C.headerBlue);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  let colX = x;
  PDF_HEADERS.forEach((header, i) => {
    const pad = 3;
    const textX = colX + pad;
    drawText(doc, header, textX, y + 5.5, { align: "left", bold: true, size: 7, color: C.text });
    colX += colWidths[i];
  });

  return y + rowH;
}

function drawLeaveDataRow(doc, x, y, colWidths, rowH, row, stripe) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  if (stripe) fillBox(doc, x, y, tableW, rowH, C.rowHover);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.15);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  const values = [
    row.employee_id || "—",
    row.name || "—",
    row.department || "—",
    row.date || "—",
    row.leave_type || "—",
  ];

  let colX = x;
  values.forEach((value, i) => {
    const pad = 3;
    const isName = i === 1;
    drawText(doc, value, colX + pad, y + 5.5, {
      align: "left",
      bold: isName,
      size: 8.5,
      color: isName ? C.textDark : C.text,
    });
    colX += colWidths[i];
  });

  return y + rowH;
}

function drawLeaveApprovalBlock(doc, margin, y, tableW, approvalInfo = {}) {
  const approvedBy = approvalInfo.approvedBy || "—";
  const name = approvalInfo.name || "—";
  const signatureDataUrl = approvalInfo.signatureDataUrl || null;
  const blockH = signatureDataUrl ? 34 : 26;

  fillBox(doc, margin, y, tableW, blockH, C.approvalBg);
  strokeBox(doc, margin, y, tableW, blockH);

  let lineY = y + 6;
  drawText(doc, `Approved by: ${approvedBy}`, margin + 4, lineY, { size: 9, color: C.textMuted });
  lineY += 5;
  drawText(doc, `Name: ${name}`, margin + 4, lineY, { size: 9, color: C.textMuted });
  lineY += 5;

  if (signatureDataUrl) {
    try {
      const format = /image\/png/i.test(signatureDataUrl) ? "PNG" : "JPEG";
      doc.addImage(signatureDataUrl, format, margin + 4, lineY, 42, 14);
    } catch {
      drawText(doc, "Signature: —", margin + 4, lineY + 1, { size: 9, color: C.textMuted });
    }
  } else {
    drawText(doc, "Signature: —", margin + 4, lineY + 1, { size: 9, color: C.textMuted });
  }

  return y + blockH;
}

/**
 * Download leave report PDF (monthly format).
 */
export function downloadLeaveReportPdf({
  rows,
  monthName,
  year,
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
  const colWidths = equalColumnWidths(tableW, 5);
  const headRowH = 9;
  const dataRowH = 8;
  const footerSpace = 34;

  let y = 14;
  let tableTopY = 0;

  const beginTable = () => {
    tableTopY = y;
    y = drawLeaveTableHead(doc, margin, y, colWidths, headRowH);
  };

  const closeTable = () => {
    strokeBox(doc, margin, tableTopY, tableW, y - tableTopY);
  };

  y = drawLeaveReportHeader(doc, margin, y, tableW, monthName, year);
  beginTable();

  rows.forEach((row, index) => {
    if (y + dataRowH > pageH - footerSpace) {
      closeTable();
      doc.addPage("landscape");
      y = 14;
      beginTable();
    }
    y = drawLeaveDataRow(doc, margin, y, colWidths, dataRowH, row, index % 2 === 1);
  });

  closeTable();

  y += 8;
  const approvalBlockH = approvalInfo?.signatureDataUrl ? 34 : 26;
  if (y + approvalBlockH > pageH - margin) {
    doc.addPage("landscape");
    y = 14;
  }
  drawLeaveApprovalBlock(doc, margin, y, tableW, approvalInfo);

  const safeName =
    fileName || `Leave_Report_${monthName}_${year}.pdf`.replace(/\s+/g, "_");
  doc.save(safeName);
}

export function getMonthName(month) {
  return MONTH_NAMES[month - 1] || "";
}

export { PAYSLIP_COMPANY_NAME as LEAVE_REPORT_COMPANY_NAME };
