import { jsPDF } from "jspdf";

export const PAYSLIP_COMPANY_NAME = "BLUE LINE OCEAN (PVT) LTD";

const PAYSLIP_HEADERS = [
  "EMPLOYEE NAME",
  "EMPLOYEE ID",
  "DESIGNATION",
  "BASIC SALARY",
  "ALLOWANCES",
  "DEDUCTIONS",
  "NET SALARY",
];

/** Match on-screen Tailwind palette */
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
  green: [21, 128, 61],
};

/** Paysheet columns: basic, allowances (non-basic earnings), deductions, net. */
export function resolvePaysheetAmounts(row, computed = null) {
  const basic = Number(row.basic_salary ?? computed?.basic_salary) || 0;
  const gross = Number(row.gross_salary ?? computed?.gross_salary) || 0;
  const storedAllowances = row.total_allowances ?? computed?.total_allowances;
  const joinCarry =
    Number(row.join_month_carry_forward ?? computed?.join_month_carry_forward) || 0;

  let allowances;
  if (gross > 0) {
    allowances = Math.max(0, gross - basic);
  } else if (storedAllowances != null) {
    allowances = Number(storedAllowances) + joinCarry;
  } else {
    allowances = 0;
  }

  return {
    basic_salary: basic,
    allowances,
    total_deduction: Number(row.total_deduction ?? computed?.total_deduction) || 0,
    net_pay: Number(row.net_pay ?? computed?.net_pay) || 0,
  };
}

export function formatMoneyValue(value) {
  return Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPaysheetMoney(value) {
  return `Rs. ${formatMoneyValue(value)}`;
}

function getColumnWidths(tableW) {
  const ratios = [0.2, 0.11, 0.16, 0.13, 0.13, 0.13, 0.14];
  return ratios.map((r) => tableW * r);
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

function drawHeaderBlock(doc, margin, y, tableW, monthName, year) {
  const blockH = 28;
  fillBox(doc, margin, y, tableW, blockH, C.headerBg);
  fillBox(doc, margin + tableW * 0.5, y, tableW * 0.5, blockH, C.headerBlue);
  strokeBox(doc, margin, y, tableW, blockH);

  drawText(doc, PAYSLIP_COMPANY_NAME, margin + tableW / 2, y + 9, {
    align: "center",
    bold: true,
    size: 12,
    color: C.textDark,
  });
  drawText(doc, "Monthly Pay Sheet", margin + tableW / 2, y + 16, {
    align: "center",
    bold: true,
    size: 10,
    color: C.blue,
  });
  drawText(doc, `Year: ${year}`, margin + 4, y + 23, { size: 9, color: C.textMuted });
  drawText(doc, `Month: ${monthName}`, margin + 4, y + 27, { size: 9, color: C.textMuted });

  return y + blockH + 6;
}

function drawTableHead(doc, x, y, colWidths, rowH) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  fillBox(doc, x, y, tableW, rowH, C.headerBg);
  fillBox(doc, x + tableW * 0.45, y, tableW * 0.55, rowH, C.headerBlue);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  let colX = x;
  PAYSLIP_HEADERS.forEach((header, i) => {
    const pad = 3;
    const align = i >= 3 ? "right" : "left";
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

function drawDataRow(doc, x, y, colWidths, rowH, row, amounts, stripe) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  if (stripe) {
    fillBox(doc, x, y, tableW, rowH, C.rowHover);
  }
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.15);
  doc.line(x, y + rowH, x + tableW, y + rowH);

  const values = [
    row.name || "—",
    row.employee_id || "—",
    row.designation || "—",
    formatPaysheetMoney(amounts.basic_salary),
    formatPaysheetMoney(amounts.allowances),
    formatPaysheetMoney(amounts.total_deduction),
    formatPaysheetMoney(amounts.net_pay),
  ];

  let colX = x;
  values.forEach((value, i) => {
    const pad = 3;
    const align = i >= 3 ? "right" : "left";
    const textX = align === "right" ? colX + colWidths[i] - pad : colX + pad;
    const isNet = i === 6;
    const isName = i === 0;
    drawText(doc, value, textX, y + 5.5, {
      align,
      bold: isName || isNet,
      size: 8.5,
      color: isNet ? C.green : isName ? C.textDark : C.text,
    });
    colX += colWidths[i];
  });

  return y + rowH;
}

function drawTotalRow(doc, x, y, colWidths, rowH, totals) {
  const tableW = colWidths.reduce((s, w) => s + w, 0);
  fillBox(doc, x, y, tableW, rowH, C.footerBg);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + tableW, y);

  const mergedW = colWidths[0] + colWidths[1] + colWidths[2];
  drawText(doc, "Total amount", x + 3, y + 5.5, { bold: true, size: 9, color: C.textDark });

  const totalValues = [
    formatPaysheetMoney(totals.basic_salary),
    formatPaysheetMoney(totals.allowances),
    formatPaysheetMoney(totals.total_deduction),
    formatPaysheetMoney(totals.net_pay),
  ];

  let colX = x + mergedW;
  totalValues.forEach((value, i) => {
    const colIndex = i + 3;
    drawText(doc, value, colX + colWidths[colIndex] - 3, y + 5.5, {
      align: "right",
      bold: true,
      size: 9,
      color: i === 3 ? C.green : C.textDark,
    });
    colX += colWidths[colIndex];
  });

  return y + rowH;
}

export function drawReportApprovalBlock(doc, margin, y, tableW, approvalInfo = {}) {
  const approvedBy = approvalInfo.approvedBy || "—";
  const name = approvalInfo.name || "—";
  const designation = approvalInfo.designation || "—";
  const signatureDataUrl = approvalInfo.signatureDataUrl || null;
  const blockH = signatureDataUrl ? 38 : 30;

  fillBox(doc, margin, y, tableW, blockH, C.approvalBg);
  strokeBox(doc, margin, y, tableW, blockH);

  let lineY = y + 6;
  drawText(doc, `Approved by: ${approvedBy}`, margin + 4, lineY, { size: 9, color: C.textMuted });
  lineY += 5;
  drawText(doc, `Name: ${name}`, margin + 4, lineY, { size: 9, color: C.textMuted });
  lineY += 5;
  drawText(doc, `Designation: ${designation}`, margin + 4, lineY, { size: 9, color: C.textMuted });
  lineY += 5;

  if (signatureDataUrl) {
    try {
      const format = /image\/png/i.test(signatureDataUrl) ? "PNG" : "JPEG";
      doc.addImage(signatureDataUrl, format, margin + 4, lineY, 42, 14);
    } catch {
      drawText(doc, "Signature: —", margin + 4, lineY + 4, { size: 9, color: C.textMuted });
    }
  } else {
    drawText(doc, "Signature: —", margin + 4, lineY + 1, { size: 9, color: C.textMuted });
  }

  return y + blockH;
}

/**
 * Download monthly pay sheet PDF using the same visual style as the on-screen table.
 */
export function downloadMonthlyPaysheetPdf({
  rows,
  monthName,
  year,
  getAmounts,
  fileName,
  approvalInfo,
}) {
  if (!rows?.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const tableW = pageW - margin * 2;
  const colWidths = getColumnWidths(tableW);
  const headRowH = 9;
  const dataRowH = 8;
  const footerSpace = 36;

  const totals = rows.reduce(
    (acc, row) => {
      const amounts = getAmounts(row);
      acc.basic_salary += amounts.basic_salary;
      acc.allowances += amounts.allowances;
      acc.total_deduction += amounts.total_deduction;
      acc.net_pay += amounts.net_pay;
      return acc;
    },
    { basic_salary: 0, allowances: 0, total_deduction: 0, net_pay: 0 }
  );

  let y = 14;
  let tableTopY = 0;

  const beginTable = () => {
    tableTopY = y;
    y = drawTableHead(doc, margin, y, colWidths, headRowH);
  };

  const closeTable = () => {
    strokeBox(doc, margin, tableTopY, tableW, y - tableTopY);
  };

  const startPage = (withPaysheetHeader) => {
    y = 14;
    if (withPaysheetHeader) {
      y = drawHeaderBlock(doc, margin, y, tableW, monthName, year);
    }
    beginTable();
  };

  startPage(true);

  rows.forEach((row, index) => {
    if (y + dataRowH > pageH - footerSpace) {
      closeTable();
      doc.addPage("landscape");
      startPage(false);
    }
    const amounts = getAmounts(row);
    y = drawDataRow(doc, margin, y, colWidths, dataRowH, row, amounts, index % 2 === 1);
  });

  if (y + dataRowH + 1 > pageH - footerSpace) {
    closeTable();
    doc.addPage("landscape");
    startPage(false);
  }

  y = drawTotalRow(doc, margin, y, colWidths, dataRowH + 1, totals);
  closeTable();

  y += 8;
  if (y + (approvalInfo?.signatureDataUrl ? 38 : 30) > pageH - margin) {
    doc.addPage("landscape");
    y = 14;
  }
  drawReportApprovalBlock(doc, margin, y, tableW, approvalInfo);

  const safeName =
    fileName ||
    `Monthly_Pay_Sheet_${monthName}_${year}.pdf`.replace(/\s+/g, "_");
  doc.save(safeName);
}
