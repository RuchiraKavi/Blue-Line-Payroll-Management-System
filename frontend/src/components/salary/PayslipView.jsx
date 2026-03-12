import React, { useRef } from "react";
import { FaTimes, FaPrint } from "react-icons/fa";

const PayslipView = ({ employee, data, month, year, monthName, onClose }) => {
  const printRef = useRef(null);

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
          .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 12px; margin-bottom: 20px; }
          .company { font-size: 20px; font-weight: bold; color: #92400e; }
          .title { font-size: 18px; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          th { background: #fef3c7; font-weight: 600; }
          .section { margin-top: 20px; }
          .section-title { font-weight: bold; font-size: 14px; margin-bottom: 8px; }
          .total-row { font-weight: bold; background: #fef9c3; }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-amber-50">
          <h2 className="text-xl font-bold text-gray-800">Payslip — {monthName} {year}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
              aria-label="Close"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </div>

        <div ref={printRef} className="p-6 overflow-y-auto flex-1">
          <div className="header text-center border-b-2 border-amber-500 pb-3 mb-5">
            <div className="company text-amber-800 text-xl font-bold">Blue Line MS</div>
            <div className="title text-gray-700 font-semibold">Salary Payslip</div>
            <div className="text-sm text-gray-500 mt-1">{monthName} {year}</div>
          </div>

          <div className="section">
            <div className="section-title text-amber-800">Employee Details</div>
            <table className="w-full border border-gray-200 text-sm">
              <tbody>
                <tr><td className="border px-3 py-2 font-medium w-1/3">Name</td><td className="border px-3 py-2">{empName}</td></tr>
                <tr><td className="border px-3 py-2 font-medium">Employee ID</td><td className="border px-3 py-2">{empId}</td></tr>
                <tr><td className="border px-3 py-2 font-medium">Designation</td><td className="border px-3 py-2">{designation}</td></tr>
                <tr><td className="border px-3 py-2 font-medium">Department</td><td className="border px-3 py-2">{department}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 1. Allowances */}
          <div className="section mt-4">
            <div className="section-title text-amber-800">Allowances</div>
            <table className="w-full border border-gray-200 text-sm">
              <thead>
                <tr className="bg-amber-50">
                  <th className="border px-3 py-2 text-left">Description</th>
                  <th className="border px-3 py-2 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border px-3 py-2">Basic Salary</td><td className="border px-3 py-2 text-right">{n(data.basic_salary)}</td></tr>
                <tr><td className="border px-3 py-2">Travel Allowance</td><td className="border px-3 py-2 text-right">{n(data.travel_allowance)}</td></tr>
                <tr><td className="border px-3 py-2">Food Allowance</td><td className="border px-3 py-2 text-right">{n(data.food_allowance)}</td></tr>
                <tr><td className="border px-3 py-2">Holiday Payment</td><td className="border px-3 py-2 text-right">{n(data.holiday_payment)}</td></tr>
                <tr><td className="border px-3 py-2">Allowance-NS</td><td className="border px-3 py-2 text-right">{n(data.allowance_ns)}</td></tr>
                <tr><td className="border px-3 py-2">Bonus</td><td className="border px-3 py-2 text-right">{n(data.bonus)}</td></tr>
                <tr><td className="border px-3 py-2">No Pay (deduct)</td><td className="border px-3 py-2 text-right">-{n(data.no_pay)}</td></tr>
                <tr className="total-row"><td className="border px-3 py-2 font-bold">Total Allowances</td><td className="border px-3 py-2 text-right font-bold">{n(data.total_allowances)}</td></tr>
                <tr className="total-row"><td className="border px-3 py-2 font-bold">Gross Salary</td><td className="border px-3 py-2 text-right font-bold">{n(data.gross_salary)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 2. Service Charges */}
          <div className="section mt-4">
            <div className="section-title text-slate-800">Service Charges</div>
            <table className="w-full border border-gray-200 text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border px-3 py-2 text-left">Description</th>
                  <th className="border px-3 py-2 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border px-3 py-2">Stamp Duty</td><td className="border px-3 py-2 text-right">{n(data.stamp_duty)}</td></tr>
                <tr><td className="border px-3 py-2">Mobile Deduction</td><td className="border px-3 py-2 text-right">{n(data.mobile_deduction)}</td></tr>
                <tr className="total-row"><td className="border px-3 py-2 font-bold">Total Service Charges</td><td className="border px-3 py-2 text-right font-bold">{n(data.total_service_charges)}</td></tr>
                <tr><td className="border px-3 py-2">PAYE</td><td className="border px-3 py-2 text-right">{n(data.paye)}</td></tr>
                <tr><td className="border px-3 py-2">Salary Advance</td><td className="border px-3 py-2 text-right">{n(data.salary_advance)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 3. EPF Payment */}
          <div className="section mt-4">
            <div className="section-title text-blue-800">EPF Payment</div>
            <table className="w-full border border-gray-200 text-sm">
              <tbody>
                <tr><td className="border px-3 py-2">Total for EPF (base)</td><td className="border px-3 py-2 text-right">{n(data.total_for_epf)}</td></tr>
                <tr><td className="border px-3 py-2">Employee EPF ({epfPct}%)</td><td className="border px-3 py-2 text-right font-semibold">{n(data.epf_payment)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 4. ETF Payment */}
          <div className="section mt-4">
            <div className="section-title text-emerald-800">ETF Payment</div>
            <table className="w-full border border-gray-200 text-sm">
              <tbody>
                <tr><td className="border px-3 py-2">Employer ETF ({etfPct}%)</td><td className="border px-3 py-2 text-right font-semibold">{n(data.etf_payment)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="section mt-4">
            <table className="w-full border border-gray-200 text-sm">
              <tbody>
                <tr className="total-row">
                  <td className="border px-3 py-2 font-bold">Total Deduction</td>
                  <td className="border px-3 py-2 text-right font-bold">{n(data.total_deduction)}</td>
                </tr>
                <tr className="net-row">
                  <td className="border px-3 py-3 font-bold text-lg">Net Pay</td>
                  <td className="border px-3 py-3 text-right font-bold text-lg text-green-700">Rs. {n(data.net_pay)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="section mt-4 pt-4 border-t text-sm text-gray-600">
            <div className="section-title text-amber-800">Bank Details (for credit)</div>
            <p>Bank: {bankName} | Branch: {bankBranch} | Account: {bankAcc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipView;
