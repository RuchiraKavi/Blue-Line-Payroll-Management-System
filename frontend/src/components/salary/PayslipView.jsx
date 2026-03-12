import React, { useRef, useState } from "react";
import { FaTimes, FaPrint, FaFileInvoiceDollar, FaPenFancy } from "react-icons/fa";

const PayslipView = ({ employee, data, month, year, monthName, onClose }) => {
  const printRef = useRef(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [signatureDate] = useState(() => new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }));

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

  const empName = employee?.userId?.name || "N/A";
  const empId = employee?.employee_id || "—";
  const designation = employee?.designation || "—";
  const department = employee?.department?.dep_name || "—";
  const bankName = employee?.bank_details?.bank_name || "—";
  const bankBranch = employee?.bank_details?.bank_branch || "—";
  const bankAcc = employee?.bank_details?.bank_account_number || "—";

  const n = (x) => Number(x || 0).toFixed(2);
  const epfPct = Number(data.epf_percent) || 8;
  const etfPct = Number(data.etf_percent) || 3;

  const tableHeader = "bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs font-semibold border-b-2 border-gray-200";
  const tableCell = "border border-gray-200 px-4 py-3 text-sm";
  const sectionTitle = "text-sm font-bold text-gray-800 uppercase tracking-wider mb-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - same style as other admin section headers */}
        <div className="px-6 py-4 bg-linear-to-r from-gray-50 to-blue-50 border-b border-gray-200 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaFileInvoiceDollar className="text-blue-600" />
            Payslip — {monthName} {year}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 cursor-pointer transition-colors">
              <FaPenFancy className="text-blue-600" />
              <span>{signatureDataUrl ? "Change signature" : "Add signature"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleSignatureFile} />
            </label>
            {signatureDataUrl && (
              <button
                type="button"
                onClick={() => setSignatureDataUrl(null)}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl font-medium"
              >
                Clear
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg transition-colors"
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              aria-label="Close"
            >
              <FaTimes className="text-lg" />
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

          {/* Employee Details */}
          <div className="mb-6">
            <div className={sectionTitle}>Employee Details</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className={`${tableCell} font-medium w-1/3 bg-gray-50`}>Name</td><td className={tableCell}>{empName}</td></tr>
                  <tr><td className={`${tableCell} font-medium bg-gray-50`}>Employee ID</td><td className={tableCell}>{empId}</td></tr>
                  <tr><td className={`${tableCell} font-medium bg-gray-50`}>Designation</td><td className={tableCell}>{designation}</td></tr>
                  <tr><td className={`${tableCell} font-medium bg-gray-50`}>Department</td><td className={tableCell}>{department}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Allowances */}
          <div className="mb-6">
            <div className={`${sectionTitle} text-amber-800`}>Allowances</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className={tableHeader}>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className={tableCell}>Basic Salary</td><td className={`${tableCell} text-right`}>{n(data.basic_salary)}</td></tr>
                  <tr><td className={tableCell}>Travel Allowance</td><td className={`${tableCell} text-right`}>{n(data.travel_allowance)}</td></tr>
                  <tr><td className={tableCell}>Food Allowance</td><td className={`${tableCell} text-right`}>{n(data.food_allowance)}</td></tr>
                  <tr><td className={tableCell}>Holiday Payment</td><td className={`${tableCell} text-right`}>{n(data.holiday_payment)}</td></tr>
                  <tr><td className={tableCell}>Allowance-NS</td><td className={`${tableCell} text-right`}>{n(data.allowance_ns)}</td></tr>
                  <tr><td className={tableCell}>Bonus</td><td className={`${tableCell} text-right`}>{n(data.bonus)}</td></tr>
                  <tr><td className={tableCell}>No Pay (deduct)</td><td className={`${tableCell} text-right`}>-{n(data.no_pay)}</td></tr>
                  <tr className="bg-gray-100"><td className={`${tableCell} font-bold`}>Total Allowances</td><td className={`${tableCell} text-right font-bold`}>{n(data.total_allowances)}</td></tr>
                  <tr className="bg-gray-100"><td className={`${tableCell} font-bold`}>Gross Salary</td><td className={`${tableCell} text-right font-bold`}>{n(data.gross_salary)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Service Charges */}
          <div className="mb-6">
            <div className={`${sectionTitle} text-slate-800`}>Service Charges</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className={tableHeader}>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className={tableCell}>Stamp Duty</td><td className={`${tableCell} text-right`}>{n(data.stamp_duty)}</td></tr>
                  <tr><td className={tableCell}>Mobile Deduction</td><td className={`${tableCell} text-right`}>{n(data.mobile_deduction)}</td></tr>
                  <tr className="bg-gray-100"><td className={`${tableCell} font-bold`}>Total Service Charges</td><td className={`${tableCell} text-right font-bold`}>{n(data.total_service_charges)}</td></tr>
                  <tr><td className={tableCell}>PAYE</td><td className={`${tableCell} text-right`}>{n(data.paye)}</td></tr>
                  <tr><td className={tableCell}>Salary Advance</td><td className={`${tableCell} text-right`}>{n(data.salary_advance)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* EPF Payment */}
          <div className="mb-6">
            <div className={`${sectionTitle} text-blue-800`}>EPF Payment</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className={tableCell}>Total for EPF (base)</td><td className={`${tableCell} text-right`}>{n(data.total_for_epf)}</td></tr>
                  <tr><td className={tableCell}>Employee EPF ({epfPct}%)</td><td className={`${tableCell} text-right font-semibold`}>{n(data.epf_payment)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ETF Payment */}
          <div className="mb-6">
            <div className={`${sectionTitle} text-emerald-800`}>ETF Payment</div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className={tableCell}>Employer ETF ({etfPct}%)</td><td className={`${tableCell} text-right font-semibold`}>{n(data.etf_payment)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Deduction & Net Pay */}
          <div className="rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-gray-100">
                  <td className={`${tableCell} font-bold`}>Total Deduction</td>
                  <td className={`${tableCell} text-right font-bold`}>{n(data.total_deduction)}</td>
                </tr>
                <tr className="bg-green-50 border-t-2 border-green-200">
                  <td className="px-4 py-4 font-bold text-lg text-gray-900">Net Pay</td>
                  <td className="px-4 py-4 text-right font-bold text-lg text-green-700">Rs. {n(data.net_pay)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bank Details */}
          <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
            <div className={`${sectionTitle} text-gray-800`}>Bank Details (for credit)</div>
            <p className="text-gray-600">Bank: {bankName} | Branch: {bankBranch} | Account: {bankAcc}</p>
          </div>

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
