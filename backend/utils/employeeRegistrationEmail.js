import sendEmail from "./sendEmail.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "Rs. 0";
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:38%;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-weight:500;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function section(title, rowsHtml) {
  return `
    <h3 style="margin:24px 0 10px;color:#1e3a8a;font-size:16px;">${escapeHtml(title)}</h3>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      ${rowsHtml}
    </table>
  `;
}

export function buildEmployeeRegistrationEmailHtml({
  name,
  email,
  password,
  employeeId,
  epfNumber,
  nic,
  mobileNumber,
  address,
  dob,
  gender,
  maritalStatus,
  designation,
  jobType,
  departmentName,
  joinedDate,
  resignedDate,
  role,
  basicSalary,
  travelAllowance,
  foodAllowance,
  holidayPayment,
  allowanceNs,
  bonus,
  stampDuty,
  mobileDeduction,
  bankName,
  bankBranch,
  bankAccountNumber,
  casualLeave,
  annualLeave,
  sickLeave,
}) {
  const personalRows = [
    row("Full Name", name),
    row("Email", email),
    row("NIC", nic),
    row("EPF Number", epfNumber),
    row("Mobile Number", mobileNumber),
    row("Address", address),
    row("Date of Birth", formatDate(dob)),
    row("Gender", gender),
    row("Marital Status", maritalStatus),
  ].join("");

  const jobRows = [
    row("Employee ID", employeeId),
    row("Designation", designation),
    row("Job Type", jobType),
    row("Department", departmentName),
    row("Role", role),
    row("Joined Date", formatDate(joinedDate)),
    row("Resigned Date", resignedDate ? formatDate(resignedDate) : "Still Working"),
  ].join("");

  const compensationRows = [
    row("Basic Salary", formatCurrency(basicSalary)),
    row("Travel Allowance", formatCurrency(travelAllowance)),
    row("Food Allowance", formatCurrency(foodAllowance)),
    row("Holiday Payment", formatCurrency(holidayPayment)),
    row("Attendance Allowance", formatCurrency(allowanceNs)),
    row("Bonus", formatCurrency(bonus)),
    row("Stamp Duty", formatCurrency(stampDuty)),
    row("Mobile Deduction", formatCurrency(mobileDeduction)),
  ].join("");

  const bankRows = [
    row("Bank Name", bankName),
    row("Bank Branch", bankBranch),
    row("Account Number", bankAccountNumber),
  ].join("");

  const leaveRows = [
    row("Casual Leave", casualLeave),
    row("Annual Leave", annualLeave),
    row("Sick Leave", sickLeave),
  ].join("");

  const loginRows = [
    row("Login Email", email),
    row("Temporary Password", password),
  ].join("");

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:28px 24px;color:#ffffff;">
            <h2 style="margin:0 0 8px;font-size:24px;">Welcome to Blue Line Payroll</h2>
            <p style="margin:0;opacity:0.92;">Your employee registration has been completed successfully.</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 16px;line-height:1.6;">Dear <strong>${escapeHtml(name)}</strong>,</p>
            <p style="margin:0 0 8px;line-height:1.6;">
              Please find your registered employee details below. Keep this email for your records.
            </p>
            ${section("Personal Information", personalRows)}
            ${section("Employment Details", jobRows)}
            ${section("Compensation", compensationRows)}
            ${section("Bank Details", bankRows)}
            ${section("Leave Balance Assigned", leaveRows)}
            ${section("Login Credentials", loginRows)}
            <p style="margin:24px 0 0;line-height:1.6;color:#374151;">
              Please sign in using the credentials above and change your password after your first login.
            </p>
            <p style="margin:16px 0 0;line-height:1.6;">
              Regards,<br/>
              <strong>HR Department</strong><br/>
              Blue Line Payroll Management
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmployeeRegistrationEmail(details) {
  const html = buildEmployeeRegistrationEmailHtml(details);

  await sendEmail({
    to: details.email,
    subject: `Welcome – Your Employee Registration Details (${details.employeeId})`,
    html,
  });
}
