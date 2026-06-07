import React, { useRef, useState } from "react";
import { FaTimes, FaPrint, FaFileInvoiceDollar, FaPenFancy, FaSave, FaFilePdf } from "react-icons/fa";
import { jsPDF } from "jspdf";

const n = (x) => Number(x || 0).toFixed(2);

/** True if amount should appear on payslip (non-zero). */
function hasPayslipAmount(value) {
  if (value == null || value === "") return false;
  const s = String(value).trim();
  if (s === "" || s === "-" || s === "—" || s.toLowerCase() === "n/a") return false;
  const num = Number(s);
  return !Number.isNaN(num) && Math.abs(num) >= 0.005;
}

/** True if text field should appear (not empty placeholder). */
function hasPayslipText(value) {
  const s = String(value ?? "").trim();
  return s !== "" && s !== "-" && s !== "—" && s.toLowerCase() !== "n/a";
}

function payslipPdfAmounts(data) {
  const totalForEpf = Number(data.total_for_epf) || 0;
  const epfPayslipAmount = totalForEpf * 0.08;
  const totalDeductionPayslip = (Number(data.total_deduction) || 0) - (Number(data.epf_payment) || 0) + epfPayslipAmount;
  const netPayPayslip = (Number(data.gross_salary) || 0) - totalDeductionPayslip;
  return { epfPayslipAmount, totalDeductionPayslip, netPayPayslip };
}

const CELL_PAD = 2;

/** Draw a 2-column table. options.rowHeight overrides default. Returns y after table. */
function pdfTable(doc, y, left, width, rows, options = {}) {
  const { headerFill = null, totalFill = [248, 250, 252], labelColumnFill = null, border = [229, 231, 235], rowHeight = 5 } = options;
  const col2 = left + width;
  const labelW = width * 0.35;
  const valueW = width * 0.65;
  doc.setDrawColor(...border);
  doc.setLineWidth(0.2);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const isHeader = row.header;
    const isTotal = row.bold && row.totalRow;
    const useLabelBg = row.labelBg && labelColumnFill;
    let fill = null;
    if (isHeader && headerFill) fill = headerFill;
    else if (isTotal && totalFill) fill = totalFill;
    else if (useLabelBg) fill = labelColumnFill;
    if (fill && (isHeader || isTotal)) {
      doc.setFillColor(...fill);
      doc.rect(left, y, labelW, rowHeight, "F");
      doc.rect(left + labelW, y, valueW, rowHeight, "F");
    } else if (useLabelBg) {
      doc.setFillColor(...labelColumnFill);
      doc.rect(left, y, labelW, rowHeight, "F");
    }
    doc.setFont("helvetica", row.bold ? "bold" : "normal");
    doc.setFontSize(row.fontSize || 8);
    doc.setTextColor(...(row.color || [0, 0, 0]));
    doc.text(String(row.label || ""), left + CELL_PAD, y + rowHeight - 1.5);
    if (row.value !== undefined) doc.text(String(row.value), col2 - CELL_PAD, y + rowHeight - 1.5, { align: "right" });
    doc.rect(left, y, width, rowHeight);
    y += rowHeight;
  }
  return y;
}

/** Export: generate and download payslip PDF — single page, scaled to fit A4. */
export function downloadPayslipPdf(employee, data, month, year, monthName, signatureDataUrl = null, signatureDate = null) {
  const resolvedSignatureUrl =
    signatureDataUrl ??
    (typeof data?.signature_data_url === "string" && data.signature_data_url.length > 0
      ? data.signature_data_url
      : null);
  const resolvedSignatureDate =
    signatureDate ??
    (typeof data?.signature_date === "string" && data.signature_date.trim()
      ? data.signature_date.trim()
      : null);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const tableWidth = pageW - margin * 2;
  const usableH = pageH - margin * 2;
  const { epfPayslipAmount, totalDeductionPayslip, netPayPayslip } = payslipPdfAmounts(data);
  const joinMonthCarry = Number(data.join_month_carry_forward) || 0;
  const joinMonthWorkedDays = Number(data.join_month_worked_days) || 0;
  const showJoinMonthPay = hasPayslipAmount(joinMonthCarry);
  const totalEarningsPayslip =
    (Number(data.basic_salary) || 0) +
    (Number(data.total_allowances) || 0) +
    (showJoinMonthPay ? joinMonthCarry : 0);
  const empName = employee?.userId?.name || data?.name || "N/A";
  const empId = employee?.employee_id || data?.employee_id || "—";
  const empNic = employee?.nic || data?.nic || "—";
  const empEpfNumber = employee?.epf_number || data?.epf_number || "—";
  const designation = employee?.designation || data?.designation || "—";
  const department = (employee?.department?.dep_name ?? employee?.department) || data?.department || "—";
  const bankName = employee?.bank_details?.bank_name || "";
  const bankBranch = employee?.bank_details?.bank_branch || "";
  const bankAcc = employee?.bank_details?.bank_account_number || "";
  const showBankSection = hasPayslipText(bankName) || hasPayslipText(bankBranch) || hasPayslipText(bankAcc);

  const employeeDetailRows = [
    hasPayslipText(empName) && { label: "Name", value: empName, labelBg: true },
    hasPayslipText(empId) && { label: "Employee ID", value: empId, labelBg: true },
    hasPayslipText(empNic) && { label: "NIC", value: empNic, labelBg: true },
    hasPayslipText(empEpfNumber) && { label: "EPF Number", value: empEpfNumber, labelBg: true },
    hasPayslipText(designation) && { label: "Designation", value: designation, labelBg: true },
    hasPayslipText(department) && { label: "Department", value: department, labelBg: true },
  ].filter(Boolean);

  const earningsLineRows = [
    hasPayslipAmount(data.basic_salary) && { label: "Basic Salary", value: n(data.basic_salary) },
    hasPayslipAmount(data.travel_allowance) && { label: "Travel Allowance", value: n(data.travel_allowance) },
    hasPayslipAmount(data.food_allowance) && { label: "Food Allowance", value: n(data.food_allowance) },
    hasPayslipAmount(data.holiday_payment) && { label: "Holiday Payment", value: n(data.holiday_payment) },
    hasPayslipAmount(data.allowance_ns) && { label: "Allowance-NS", value: n(data.allowance_ns) },
    hasPayslipAmount(data.bonus) && { label: "Bonus", value: n(data.bonus) },
    showJoinMonthPay && {
      label: `Join Month Pay (${joinMonthWorkedDays} days)`,
      value: n(joinMonthCarry),
    },
  ].filter(Boolean);

  const earningsRows = [
    { label: "Description", value: "Amount (Rs.)", header: true },
    ...earningsLineRows,
    { label: "Total Earnings", value: n(totalEarningsPayslip), bold: true, totalRow: true },
    { label: "Gross Salary", value: n(data.gross_salary), bold: true, totalRow: true },
  ];

  const deductionLineRows = [
    hasPayslipAmount(data.stamp_duty) && { label: "Stamp Duty", value: n(data.stamp_duty) },
    hasPayslipAmount(data.mobile_deduction) && { label: "Mobile Deduction", value: n(data.mobile_deduction) },
    hasPayslipAmount(data.no_pay) && { label: "No Pay", value: n(data.no_pay) },
    hasPayslipAmount(data.paye) && { label: "APIT (PAYE)", value: n(data.paye) },
    hasPayslipAmount(data.salary_advance) && { label: "Salary Advance", value: n(data.salary_advance) },
    hasPayslipAmount(epfPayslipAmount) && { label: "Employee EPF (8%)", value: n(epfPayslipAmount) },
  ].filter(Boolean);

  const deductionsRows = [
    { label: "Description", value: "Amount (Rs.)", header: true },
    ...deductionLineRows,
  ];

  const epfRows = [
    hasPayslipAmount(data.total_for_epf) && { label: "Earnings base (for EPF/ETF)", value: n(data.total_for_epf) },
    hasPayslipAmount(data.employer_epf_payment) && { label: "Employer EPF (12%)", value: n(data.employer_epf_payment) },
    hasPayslipAmount(data.etf_payment) && { label: "Employer ETF (3%)", value: n(data.etf_payment) },
  ].filter(Boolean);

  const sectionGap = 5;
  const sectionTitleH = 6;
  const authBlockH = 5 + 3 + 10 + 6;
  const totalLogicalH =
    margin +
    22 +
    (employeeDetailRows.length > 0 ? sectionTitleH + employeeDetailRows.length * 6 + sectionGap : 0) +
    sectionTitleH +
    earningsRows.length * 6 +
    sectionGap +
    (deductionLineRows.length > 0 ? sectionTitleH + deductionsRows.length * 6 + sectionGap : 0) +
    (epfRows.length > 0 ? sectionTitleH + epfRows.length * 6 + sectionGap : 0) +
    6 +
    6 +
    sectionGap +
    (showBankSection ? 5 + 5 + sectionGap : 0) +
    authBlockH;

  const v = Math.min(1, (usableH * 0.97) / totalLogicalH);
  const rowH = 6 * v;
  const gap = (x) => x * v;
  let y = margin;

  const fontTitle = Math.max(7, Math.round(10 * v));
  const opts = (o) => ({ ...o, rowHeight: rowH });

  // —— Company header ——
  doc.setFontSize(Math.round(14 * v));
  doc.setTextColor(30, 64, 175);
  doc.text("Blue Line MS", pageW / 2, y, { align: "center" });
  y += gap(6);
  doc.setFontSize(Math.round(11 * v));
  doc.setTextColor(55, 65, 81);
  doc.text("Salary Payslip", pageW / 2, y, { align: "center" });
  y += gap(5);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`${monthName} ${year}`, pageW / 2, y, { align: "center" });
  y += gap(5);
  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageW - margin, y);
  y += gap(6);

  if (employeeDetailRows.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontTitle);
    doc.setTextColor(31, 41, 55);
    doc.text("Employee Details", margin, y);
    y += gap(6);
    y = pdfTable(doc, y, margin, tableWidth, employeeDetailRows, opts({ labelColumnFill: [249, 250, 251] }));
    y += gap(5);
  }

  // —— Earnings ——
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontTitle);
  doc.setTextColor(146, 64, 14);
  doc.text("Earnings", margin, y);
  y += gap(6);
  y = pdfTable(doc, y, margin, tableWidth, earningsRows, opts({ headerFill: [239, 246, 255] }));
  y += gap(5);

  if (deductionLineRows.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontTitle);
    doc.setTextColor(51, 65, 85);
    doc.text("Deductions", margin, y);
    y += gap(6);
    y = pdfTable(doc, y, margin, tableWidth, deductionsRows, opts({ headerFill: [239, 246, 255] }));
    y += gap(5);
  }

  if (epfRows.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontTitle);
    doc.setTextColor(30, 64, 175);
    doc.text("EPF & ETF", margin, y);
    y += gap(6);
    y = pdfTable(doc, y, margin, tableWidth, epfRows, opts());
    y += gap(5);
  }

  // —— Total Deduction & Net Pay ——
  y = pdfTable(doc, y, margin, tableWidth, [
    { label: "Total Deduction", value: n(totalDeductionPayslip), bold: true, totalRow: true },
  ], opts());
  doc.setFillColor(240, 253, 244);
  doc.rect(margin, y, tableWidth * 0.35, rowH, "F");
  doc.rect(margin + tableWidth * 0.35, y, tableWidth * 0.65, rowH, "F");
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, tableWidth, rowH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.round(11 * v));
  doc.setTextColor(21, 128, 61);
  doc.text("Net Pay", margin + CELL_PAD, y + rowH - 1.5);
  doc.text(`Rs. ${n(netPayPayslip)}`, margin + tableWidth - CELL_PAD, y + rowH - 1.5, { align: "right" });
  y += rowH + gap(6);

  if (showBankSection) {
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageW - margin, y);
    y += gap(5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontTitle);
    doc.setTextColor(31, 41, 55);
    doc.text("Bank Details (for credit)", margin, y);
    y += gap(5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    const bankParts = [
      hasPayslipText(bankName) ? `Bank: ${bankName}` : null,
      hasPayslipText(bankBranch) ? `Branch: ${bankBranch}` : null,
      hasPayslipText(bankAcc) ? `Account: ${bankAcc}` : null,
    ].filter(Boolean);
    doc.text(bankParts.join(" | "), margin, y);
  }

  // —— Authorized by ——
  const authTopBorderY = y + gap(6);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, authTopBorderY, pageW - margin, authTopBorderY);
  y = authTopBorderY + gap(5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontTitle);
  doc.setTextColor(31, 41, 55);
  doc.text("Authorized by", margin, y);
  y += gap(5);
  const sigLabelY = y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text("Accountant Signature", margin, sigLabelY);
  doc.text("Date", margin + tableWidth * 0.5, sigLabelY);
  y += gap(3);
  const sigBoxW = 40;
  const sigBoxH = 10 * v;
  const dateX = margin + tableWidth * 0.5;
  const dateBoxW = 30;
  const sigY = y;

  const dateStr = (resolvedSignatureDate != null && String(resolvedSignatureDate).trim() !== "")
    ? String(resolvedSignatureDate)
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.rect(margin, sigY, sigBoxW, sigBoxH);
  doc.rect(dateX, sigY, dateBoxW, sigBoxH);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(dateStr, dateX + 2, sigY + sigBoxH / 2 + 1.5);

  const safeName = `${String(empName).replace(/[^a-zA-Z0-9-_]/g, "_")}_Payslip_${monthName}_${year}.pdf`;

  const addSignatureAndSave = () => {
    if (resolvedSignatureUrl && typeof resolvedSignatureUrl === "string" && resolvedSignatureUrl.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        try {
          // Draw image to canvas and get PNG data URL so jsPDF gets a consistent format
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            doc.addImage(dataUrl, "PNG", margin, sigY, sigBoxW, sigBoxH);
          } else {
            doc.addImage(img, "PNG", margin, sigY, sigBoxW, sigBoxH);
          }
        } catch (_) {
          try {
            doc.addImage(resolvedSignatureUrl, /image\/png/i.test(resolvedSignatureUrl) ? "PNG" : "JPEG", margin, sigY, sigBoxW, sigBoxH);
          } catch (_) {}
        }
        doc.save(safeName);
      };
      img.onerror = () => doc.save(safeName);
      img.src = resolvedSignatureUrl;
    } else {
      doc.save(safeName);
    }
  };

  addSignatureAndSave();
}

const PayslipView = ({ employee, data, month, year, monthName, onClose, initialSignature = null, initialSignatureDate = null, onSavePayslip = null, savingPayslip = false, readOnly = false }) => {
  const printRef = useRef(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState(initialSignature ?? null);
  const [signatureDate] = useState(() => (initialSignatureDate && String(initialSignatureDate).trim()) ? String(initialSignatureDate).trim() : new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }));
  const pdfSignatureRef = useRef({ signatureDataUrl: null, signatureDate: null });
  pdfSignatureRef.current = { signatureDataUrl, signatureDate };

  const handleSignatureFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setSignatureDataUrl(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Payslip - ${employee?.userId?.name || "Employee"}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .company { font-size: 20px; font-weight: bold; color: #1e40af; }
          .title { font-size: 18px; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          th { background: #eff6ff; font-weight: 600; }
          .section { margin-top: 20px; }
          .section-title { font-weight: bold; font-size: 14px; margin-bottom: 8px; }
          .total-row { font-weight: bold; background: #f8fafc; }
          .net-row { font-weight: bold; font-size: 16px; background: #dcfce7; }
          .text-right { text-align: right; }
        </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const empName = employee?.userId?.name || data?.name || "N/A";
  const empId = employee?.employee_id || data?.employee_id || "—";
  const empNic = employee?.nic || data?.nic || "—";
  const empEpfNumber = employee?.epf_number || data?.epf_number || "—";
  const designation = employee?.designation || data?.designation || "—";
  const department = (employee?.department?.dep_name ?? employee?.department) || data?.department || "—";
  const bankName = employee?.bank_details?.bank_name || "";
  const bankBranch = employee?.bank_details?.bank_branch || "";
  const bankAcc = employee?.bank_details?.bank_account_number || "";

  // Payslip uses 8% for EPF payment (contribution tracking uses 12% elsewhere)
  const epfPct = 8;
  const etfPct = Number(data.etf_percent) || 3;
  const totalForEpf = Number(data.total_for_epf) || 0;
  const epfPayslipAmount = totalForEpf * (epfPct / 100);
  const totalDeductionPayslip = (Number(data.total_deduction) || 0) - (Number(data.epf_payment) || 0) + epfPayslipAmount;
  // "Total Earnings" should include basic salary as well as allowances.
  const joinMonthCarry = Number(data.join_month_carry_forward) || 0;
  const joinMonthWorkedDays = Number(data.join_month_worked_days) || 0;
  const showJoinMonthPay = hasPayslipAmount(joinMonthCarry);
  const totalEarningsPayslip =
    (Number(data.basic_salary) || 0) +
    (Number(data.total_allowances) || 0) +
    (showJoinMonthPay ? joinMonthCarry : 0);
  const netPayPayslip = (Number(data.gross_salary) || 0) - totalDeductionPayslip;

  const employeeDetailFields = [
    hasPayslipText(empName) && { label: "Name", value: empName },
    hasPayslipText(empId) && { label: "Employee ID", value: empId },
    hasPayslipText(empNic) && { label: "NIC", value: empNic },
    hasPayslipText(empEpfNumber) && { label: "EPF Number", value: empEpfNumber },
    hasPayslipText(designation) && { label: "Designation", value: designation },
    hasPayslipText(department) && { label: "Department", value: department },
  ].filter(Boolean);

  const earningsLines = [
    hasPayslipAmount(data.basic_salary) && { label: "Basic Salary", amount: data.basic_salary },
    hasPayslipAmount(data.travel_allowance) && { label: "Travel Allowance", amount: data.travel_allowance },
    hasPayslipAmount(data.food_allowance) && { label: "Food Allowance", amount: data.food_allowance },
    hasPayslipAmount(data.holiday_payment) && { label: "Holiday Payment", amount: data.holiday_payment },
    hasPayslipAmount(data.allowance_ns) && { label: "Allowance-NS", amount: data.allowance_ns },
    hasPayslipAmount(data.bonus) && { label: "Bonus", amount: data.bonus },
    showJoinMonthPay && {
      label: `Join Month Pay (${joinMonthWorkedDays} days)`,
      amount: joinMonthCarry,
    },
  ].filter(Boolean);

  const deductionLines = [
    hasPayslipAmount(data.stamp_duty) && { label: "Stamp Duty", amount: data.stamp_duty },
    hasPayslipAmount(data.mobile_deduction) && { label: "Mobile Deduction", amount: data.mobile_deduction },
    hasPayslipAmount(data.no_pay) && { label: "No Pay", amount: data.no_pay },
    hasPayslipAmount(data.paye) && { label: "APIT (PAYE)", amount: data.paye },
    hasPayslipAmount(data.salary_advance) && { label: "Salary Advance", amount: data.salary_advance },
    hasPayslipAmount(epfPayslipAmount) && { label: "Employee EPF (8%)", amount: epfPayslipAmount },
  ].filter(Boolean);

  const epfLines = [
    hasPayslipAmount(data.total_for_epf) && { label: "Earnings base (for EPF/ETF)", amount: data.total_for_epf },
    hasPayslipAmount(data.employer_epf_payment) && { label: "Employer EPF (12%)", amount: data.employer_epf_payment },
    hasPayslipAmount(data.etf_payment) && { label: "Employer ETF (3%)", amount: data.etf_payment },
  ].filter(Boolean);

  const showBankOnScreen =
    hasPayslipText(bankName) || hasPayslipText(bankBranch) || hasPayslipText(bankAcc);

  const tableHeader = "bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs font-semibold border-b-2 border-gray-200";
  const tableCell = "border border-gray-200 px-4 py-3 text-sm";
  const sectionTitle = "text-sm font-bold text-gray-800 uppercase tracking-wider mb-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: title row + actions row to avoid overflow */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-gray-50 to-blue-50 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 min-w-0">
              <FaFileInvoiceDollar className="text-blue-600 shrink-0" />
              <span className="truncate">Payslip — {monthName} {year}</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors shrink-0"
              aria-label="Close"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && (
              <>
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer transition-colors text-sm">
                  <FaPenFancy className="text-blue-600 shrink-0" />
                  <span>{signatureDataUrl ? "Change signature" : "Add signature"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleSignatureFile} />
                </label>
                {signatureDataUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => onSavePayslip?.(signatureDataUrl)}
                      disabled={savingPayslip}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <FaSave className="shrink-0" /> {savingPayslip ? "Saving…" : "Save payslip"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureDataUrl(null)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
                    >
                      Clear
                    </button>
                  </>
                )}
              </>
            )}
            <button
              onClick={() => {
                const { signatureDataUrl: sig, signatureDate: dt } = pdfSignatureRef.current;
                downloadPayslipPdf(employee, data, month, year, monthName, sig, dt);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
            >
              <FaFilePdf className="shrink-0" /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              <FaPrint className="shrink-0" /> Print
            </button>
          </div>
        </div>

        <div ref={printRef} className="p-6 overflow-y-auto flex-1">
          {/* Company header */}
          <div className="text-center border-b-2 border-blue-200 pb-4 mb-6">
            <div className="text-blue-800 text-xl font-bold">Blue Line MS</div>
            <div className="text-gray-700 font-semibold mt-1">Salary Payslip</div>
            <div className="text-sm text-gray-500 mt-0.5">{monthName} {year}</div>
          </div>

          {employeeDetailFields.length > 0 && (
          <div className="mb-6">
            <div className={sectionTitle}>Employee Details</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {employeeDetailFields.map((row) => (
                    <tr key={row.label}>
                      <td className={`${tableCell} font-medium w-1/3 bg-gray-50`}>{row.label}</td>
                      <td className={tableCell}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Earnings */}
          <div className="mb-6">
            <div className={`${sectionTitle} text-amber-800`}>Earnings</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className={tableHeader}>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsLines.map((row) => (
                    <tr key={row.label}>
                      <td className={tableCell}>{row.label}</td>
                      <td className={`${tableCell} text-right`}>{n(row.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100"><td className={`${tableCell} font-bold`}>Total Earnings</td><td className={`${tableCell} text-right font-bold`}>{n(totalEarningsPayslip)}</td></tr>
                  <tr className="bg-gray-100"><td className={`${tableCell} font-bold`}>Gross Salary</td><td className={`${tableCell} text-right font-bold`}>{n(data.gross_salary)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {deductionLines.length > 0 && (
          <div className="mb-6">
            <div className={`${sectionTitle} text-slate-800`}>Deductions</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className={tableHeader}>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {deductionLines.map((row) => (
                    <tr key={row.label}>
                      <td className={tableCell}>{row.label}</td>
                      <td className={`${tableCell} text-right`}>{n(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {epfLines.length > 0 && (
          <div className="mb-6">
            <div className={`${sectionTitle} text-blue-800`}>EPF & ETF</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {epfLines.map((row) => (
                    <tr key={row.label}>
                      <td className={tableCell}>{row.label}</td>
                      <td className={`${tableCell} text-right text-gray-600`}>{n(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Total Deduction & Net Pay */}
          <div className="rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-gray-100">
                  <td className={`${tableCell} font-bold`}>Total Deduction</td>
                  <td className={`${tableCell} text-right font-bold`}>{n(totalDeductionPayslip)}</td>
                </tr>
                <tr className="bg-green-50 border-t-2 border-green-200">
                  <td className="px-4 py-4 font-bold text-lg text-gray-900">Net Pay</td>
                  <td className="px-4 py-4 text-right font-bold text-lg text-green-700">Rs. {n(netPayPayslip)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {showBankOnScreen && (
          <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
            <div className={`${sectionTitle} text-gray-800`}>Bank Details (for credit)</div>
            <p className="text-gray-600">
              {[
                hasPayslipText(bankName) ? `Bank: ${bankName}` : null,
                hasPayslipText(bankBranch) ? `Branch: ${bankBranch}` : null,
                hasPayslipText(bankAcc) ? `Account: ${bankAcc}` : null,
              ]
                .filter(Boolean)
                .join(" | ")}
            </p>
          </div>
          )}

          {/* Accountant Signature - prints with the payslip */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <div className={`${sectionTitle} text-gray-800`}>Authorized by</div>
            <div className="flex flex-wrap gap-8 sm:gap-12 mt-4">
              <div className="flex-1 min-w-[140px]">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Accountant Signature</p>
                {signatureDataUrl ? (
                  <img src={signatureDataUrl} alt="Accountant signature" className="h-14 object-contain object-left max-w-[200px]" />
                ) : (
                  <div className="h-14 border-b-2 border-gray-300 w-full max-w-[200px]" />
                )}
              </div>
              <div className="flex-1 min-w-[120px]">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm font-medium text-gray-800 border-b-2 border-gray-300 pb-1 inline-block min-w-[120px]">{signatureDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipView;
