import { formatRoleLabel } from "./roleConstants.js";

export function getAttendanceReportApprovalPeriod(from, to) {
  const dateStr = from || to;
  if (!dateStr) return null;
  const parts = String(dateStr).split("-").map((n) => Number(n));
  const [year, month] = parts;
  if (!year || !month || month < 1 || month > 12) return null;
  return { month, year };
}

/** Build approval block fields for the attendance report. */
export function resolveAttendanceReportApprovalInfo(approval, user, designationFallback = "—") {
  if (approval?.approved_by_name || approval?.signature_data_url) {
    return {
      approvedBy: approval.approved_by_role?.trim() || "—",
      name: approval.approved_by_name?.trim() || "—",
      designation: approval.approved_by_designation?.trim() || "—",
      signatureDataUrl: approval.signature_data_url || null,
      isApproved: Boolean(approval.signature_data_url),
      approvedAt: approval.approved_at || null,
    };
  }

  return {
    approvedBy: user?.role ? formatRoleLabel(user.role) : "—",
    name: user?.name || "—",
    designation: designationFallback || "—",
    signatureDataUrl: null,
    isApproved: false,
    approvedAt: null,
  };
}
