import { formatRoleLabel } from "./roleConstants.js";

/** Build approval block fields for the monthly leave report. */
export function resolveLeaveReportApprovalInfo(approval, user) {
  if (approval?.approved_by_name || approval?.signature_data_url) {
    return {
      approvedBy: approval.approved_by_role?.trim() || "—",
      name: approval.approved_by_name?.trim() || "—",
      signatureDataUrl: approval.signature_data_url || null,
      isApproved: Boolean(approval.signature_data_url),
      approvedAt: approval.approved_at || null,
    };
  }

  return {
    approvedBy: user?.role ? formatRoleLabel(user.role) : "—",
    name: user?.name || "—",
    signatureDataUrl: null,
    isApproved: false,
    approvedAt: null,
  };
}
