import { jsPDF } from "jspdf";
import {
  PAYSLIP_COMPANY_NAME,
  formatPaysheetMoney,
  drawReportApprovalBlock,
} from "./paysheetFormat.js";

export { PAYSLIP_COMPANY_NAME as CONTRIBUTION_COMPANY_NAME };

const PDF_HEADERS = [
  "EMPLOYEE ID",
  "EMPLOYEE NAME",
  "EMPLOYEE EPF (8%)",
  "EMPLOYER EPF (12%)",
  "EMPLOYER ETF (3%)",
];

const C = {
  border: [229, 231, 235],
  headerBg: [248, 250, 252],
  headerBlue: [239, 246, 255],
  footerBg: [243, 244, 246],
  approvalBg: [249, 250, 251],
  rowHover: [239, 246, 255],
  text: [55, 65, 81],
  textDark: [17, 24, 39],
  textMuted: [107, 114, 128],
  blue: [30, 64, 175],
};

export function mapContributionEntry(entry) {
  return {
    employee_id: entry.employee_id || "—",
    name: entry.name || "—",
    epf_payment: Number(entry.epf_payment) || 0,
    employer_epf_payment: Number(entry.employer_epf_payment) || 0,
    etf_payment: Number(entry.etf_payment) || 0,
  };
}

export function sumContributionRows(rows) {
  return rows.reduce(
    (acc, row) => ({
      epf_payment: acc.epf_payment + (Number(row.epf_payment) || 0),
      employer_epf_payment:
        acc.employer_epf_payment + (Number(row.employer_epf_payment) || 0),
      etf_payment: acc.etf_payment + (Number(row.etf_payment) || 0),
    }),
    { epf_payment: 0, employer_epf_payment: 0, etf_payment: 0 }
  );
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

function drawEmployeeReportHeader(doc, margin, y, tableW, employeeName, employeeId, periodLabel) {
  const blockH = 30;
  fillBox(doc, margin, y, tableW, blockH, C.headerBg);
  fillBox(doc, margin + tableW * 0.5, y, tableW * 0.5, blockH, C.headerBlue);
  strokeBox(doc, margin, y, tableW, blockH);

  drawText(doc, PAYSLIP_COMPANY_NAME, margin + tableW / 2, y + 9, {
    align: "center",
    bold: true,
    size: 12,
    color: C.textDark,
  });
  drawText(doc, "EPF & ETF Contribution Report", margin + tableW / 2, y + 16, {
    align: "center",
    bold: true,
    size: 10,
    color: C.blue,
  });
  const employeeLine = `Employee: ${employeeName}${
    employeeId && employeeId !== "—" ? ` (${employeeId})` : ""
  }`;
  drawText(doc, employeeLine, margin + 4, y + 23, { size: 9, color: C.textMuted });
  if (periodLabel) {
    drawText(doc, `Period: ${periodLabel}`, margin + 4, y + 28, { size: 9, color: C.textMuted });
  }

  return y + blockH + 6;
}

function drawReportHeader(doc, margin, y, tableW, monthName, year, subtitle) {
  const blockH = subtitle ? 32 : 28;
  fillBox(doc, margin, y, tableW, blockH, C.headerBg);
  fillBox(doc, margin + tableW * 0.5, y, tableW * 0.5, blockH, C.headerBlue);
  strokeBox(doc, margin, y, tableW, blockH);

  drawText(doc, PAYSLIP_COMPANY_NAME, margin + tableW / 2, y + 9, {
    align: "center",
    bold: true,
    size: 12,
    color: C.textDark,
  });
  drawText(doc, "EPF & ETF Contribution Report", margin + tableW / 2, y + 16, {
    align: "center",
    bold: true,
    size: 10,
    color: C.blue,
  });
  let metaY = y + 23;
  if (subtitle) {
    drawText(doc, subtitle, margin + 4, metaY, { size: 9, color: C.textMuted });
    metaY += 5;
  }
  drawText(doc, `Year: ${year}`, margin + 4, metaY, { size: 9, color: C.textMuted });
  drawText(doc, `Month: ${monthName}`, margin + 4, metaY + 4, { size: 9, color: C.textMuted });

  return y + blockH + 6;
}

function drawContributionTableHead(doc, x, y, colWidths, rowH) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  fillBox(doc, x, y, tableW, rowH, C.headerBg);
  fillBox(doc, x + tableW * 0.4, y, tableW * 0.6, rowH, C.headerBlue);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  let colX = x;
  PDF_HEADERS.forEach((header, i) => {
    const pad = 3;
    const align = i >= 2 ? "right" : "left";
    const textX = align === "right" ? colX + colWidths[i] - pad : colX + pad;
    drawText(doc, header, textX, y + 5.5, {
      align,
      bold: true,
      size: 7,
      color: C.text,
    });
    colX += colWidths[i];
  });

  return y + rowH;
}

function drawContributionDataRow(doc, x, y, colWidths, rowH, row, stripe) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  if (stripe) fillBox(doc, x, y, tableW, rowH, C.rowHover);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.15);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  const values = [
    row.employee_id || "—",
    row.name || "—",
    formatPaysheetMoney(row.epf_payment),
    formatPaysheetMoney(row.employer_epf_payment),
    formatPaysheetMoney(row.etf_payment),
  ];

  let colX = x;
  values.forEach((value, i) => {
    const pad = 3;
    const align = i >= 2 ? "right" : "left";
    const textX = align === "right" ? colX + colWidths[i] - pad : colX + pad;
    drawText(doc, value, textX, y + 5.5, {
      align,
      bold: i === 1,
      size: 8.5,
      color: i === 1 ? C.textDark : C.text,
    });
    colX += colWidths[i];
  });

  return y + rowH;
}

function drawContributionTotalRow(doc, x, y, colWidths, rowH, totals) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  fillBox(doc, x, y, tableW, rowH, C.footerBg);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + tableW, y);

  drawText(doc, "Total", x + 3, y + 5.5, { bold: true, size: 9, color: C.textDark });

  const totalValues = [
    formatPaysheetMoney(totals.epf_payment),
    formatPaysheetMoney(totals.employer_epf_payment),
    formatPaysheetMoney(totals.etf_payment),
  ];

  let colX = x + colWidths[0] + colWidths[1];
  totalValues.forEach((value, i) => {
    const colIndex = i + 2;
    drawText(doc, value, colX + colWidths[colIndex] - 3, y + 5.5, {
      align: "right",
      bold: true,
      size: 9,
      color: C.textDark,
    });
    colX += colWidths[colIndex];
  });

  return y + rowH;
}

function renderContributionSection(doc, {
  rows,
  monthName,
  year,
  subtitle,
  margin,
  tableW,
  startY,
  pageH,
  withHeader = true,
  approvalInfo,
}) {
  const colWidths = equalColumnWidths(tableW, 5);
  const headRowH = 9;
  const dataRowH = 8;
  const footerSpace = 36;
  let y = startY;
  let tableTopY = 0;

  const totals = sumContributionRows(rows);

  const beginTable = () => {
    tableTopY = y;
    y = drawContributionTableHead(doc, margin, y, colWidths, headRowH);
  };

  const closeTable = () => {
    strokeBox(doc, margin, tableTopY, tableW, y - tableTopY);
  };

  if (withHeader) {
    y = drawReportHeader(doc, margin, y, tableW, monthName, year, subtitle);
  }
  beginTable();

  rows.forEach((row, index) => {
    if (y + dataRowH > pageH - footerSpace) {
      closeTable();
      doc.addPage("landscape");
      y = 14;
      beginTable();
    }
    y = drawContributionDataRow(doc, margin, y, colWidths, dataRowH, row, index % 2 === 1);
  });

  if (y + dataRowH + 1 > pageH - footerSpace) {
    closeTable();
    doc.addPage("landscape");
    y = 14;
    beginTable();
  }

  y = drawContributionTotalRow(doc, margin, y, colWidths, dataRowH + 1, totals);
  closeTable();

  y += 8;
  const approvalBlockH = approvalInfo?.signatureDataUrl ? 38 : 30;
  if (y + approvalBlockH > pageH - margin) {
    doc.addPage("landscape");
    y = 14;
  }
  drawReportApprovalBlock(doc, margin, y, tableW, approvalInfo);

  return y + approvalBlockH + 4;
}

/**
 * Download EPF & ETF contribution report PDF (monthly, all employees).
 */
export function downloadContributionReportPdf({
  rows,
  monthName,
  year,
  fileName,
  approvalInfo,
}) {
  if (!rows?.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const tableW = pageW - margin * 2;

  renderContributionSection(doc, {
    rows,
    monthName,
    year,
    margin,
    tableW,
    startY: 14,
    pageH,
    withHeader: true,
    approvalInfo,
  });

  const safeName =
    fileName ||
    `EPF_ETF_Contribution_${monthName}_${year}.pdf`.replace(/\s+/g, "_");
  doc.save(safeName);
}

/**
 * Download multi-month contribution reports (one section per month).
 */
export function downloadContributionReportRangePdf({ sections, fileName }) {
  if (!sections?.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const tableW = pageW - margin * 2;

  sections.forEach((section, index) => {
    if (index > 0) doc.addPage("landscape");
    renderContributionSection(doc, {
      rows: section.rows,
      monthName: section.monthName,
      year: section.year,
      subtitle: section.subtitle,
      margin,
      tableW,
      startY: 14,
      pageH,
      withHeader: true,
      approvalInfo: section.approvalInfo,
    });
  });

  const safeName = fileName || "EPF_ETF_Contribution_Report.pdf";
  doc.save(safeName);
}

const PERIOD_PDF_HEADERS = [
  "PERIOD",
  "EMPLOYEE EPF (8%)",
  "EMPLOYER EPF (12%)",
  "EMPLOYER ETF (3%)",
];

function drawPeriodTableHead(doc, x, y, colWidths, rowH) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  fillBox(doc, x, y, tableW, rowH, C.headerBg);
  fillBox(doc, x + tableW * 0.25, y, tableW * 0.75, rowH, C.headerBlue);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  let colX = x;
  PERIOD_PDF_HEADERS.forEach((header, i) => {
    const pad = 3;
    const align = i === 0 ? "left" : "right";
    const textX = align === "right" ? colX + colWidths[i] - pad : colX + pad;
    drawText(doc, header, textX, y + 5.5, { align, bold: true, size: 7, color: C.text });
    colX += colWidths[i];
  });

  return y + rowH;
}

function drawPeriodDataRow(doc, x, y, colWidths, rowH, row, stripe) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  if (stripe) fillBox(doc, x, y, tableW, rowH, C.rowHover);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.15);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  const values = [
    `${row.monthName} ${row.year}`,
    formatPaysheetMoney(row.epf_payment),
    formatPaysheetMoney(row.employer_epf_payment),
    formatPaysheetMoney(row.etf_payment),
  ];

  let colX = x;
  values.forEach((value, i) => {
    const pad = 3;
    const align = i === 0 ? "left" : "right";
    const textX = align === "right" ? colX + colWidths[i] - pad : colX + pad;
    drawText(doc, value, textX, y + 5.5, {
      align,
      bold: i === 0,
      size: 8.5,
      color: i === 0 ? C.textDark : C.text,
    });
    colX += colWidths[i];
  });

  return y + rowH;
}

function drawPeriodTotalRow(doc, x, y, colWidths, rowH, totals) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  fillBox(doc, x, y, tableW, rowH, C.footerBg);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + tableW, y);

  drawText(doc, "Total", x + 3, y + 5.5, { bold: true, size: 9, color: C.textDark });

  const totalValues = [
    formatPaysheetMoney(totals.epf_payment),
    formatPaysheetMoney(totals.employer_epf_payment),
    formatPaysheetMoney(totals.etf_payment),
  ];

  let colX = x + colWidths[0];
  totalValues.forEach((value, i) => {
    const colIndex = i + 1;
    drawText(doc, value, colX + colWidths[colIndex] - 3, y + 5.5, {
      align: "right",
      bold: true,
      size: 9,
      color: C.textDark,
    });
    colX += colWidths[colIndex];
  });

  return y + rowH;
}

/**
 * Download single-employee contribution report PDF (period rows).
 */
export function downloadEmployeeContributionReportPdf({
  rows,
  employeeName,
  employeeId,
  periodLabel,
  fileName,
  approvalInfo,
}) {
  if (!rows?.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const tableW = pageW - margin * 2;
  const colWidths = equalColumnWidths(tableW, 4);
  const headRowH = 9;
  const dataRowH = 8;
  const footerSpace = 36;
  let y = 14;
  let tableTopY = 0;
  const totals = sumContributionRows(rows);

  const beginTable = () => {
    tableTopY = y;
    y = drawPeriodTableHead(doc, margin, y, colWidths, headRowH);
  };

  const closeTable = () => {
    strokeBox(doc, margin, tableTopY, tableW, y - tableTopY);
  };

  y = drawEmployeeReportHeader(doc, margin, y, tableW, employeeName, employeeId, periodLabel);
  beginTable();

  rows.forEach((row, index) => {
    if (y + dataRowH > pageH - footerSpace) {
      closeTable();
      doc.addPage("landscape");
      y = 14;
      beginTable();
    }
    y = drawPeriodDataRow(doc, margin, y, colWidths, dataRowH, row, index % 2 === 1);
  });

  if (y + dataRowH + 1 > pageH - footerSpace) {
    closeTable();
    doc.addPage("landscape");
    y = 14;
    beginTable();
  }

  y = drawPeriodTotalRow(doc, margin, y, colWidths, dataRowH + 1, totals);
  closeTable();

  y += 8;
  const approvalBlockH = approvalInfo?.signatureDataUrl ? 38 : 30;
  if (y + approvalBlockH > pageH - margin) {
    doc.addPage("landscape");
    y = 14;
  }
  drawReportApprovalBlock(doc, margin, y, tableW, approvalInfo);

  doc.save(fileName || "Employee_Contribution_Report.pdf");
}
