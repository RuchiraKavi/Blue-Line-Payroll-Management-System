/** Build approval block fields from a saved salary run. */
export function resolveApprovalInfo(run) {
  if (!run) {
    return {
      approvedBy: "—",
      name: "—",
      designation: "—",
      signatureDataUrl: null,
    };
  }

  const approvedBy = run.approved_by_role?.trim() || "—";
  const name = run.approved_by_name?.trim() || "—";
  const designation = run.approved_by_designation?.trim() || "—";

  return {
    approvedBy,
    name,
    designation,
    signatureDataUrl: run.signature_data_url || null,
  };
}

/** Merge approver fields from a partial run update into existing run state. */
export function mergeRunApprovalFields(existingRun, patch) {
  if (!existingRun || !patch) return existingRun;
  return {
    ...existingRun,
    approved_by_role: patch.approved_by_role ?? existingRun.approved_by_role,
    approved_by_name: patch.approved_by_name ?? existingRun.approved_by_name,
    approved_by_designation:
      patch.approved_by_designation ?? existingRun.approved_by_designation,
    approved_by_user_id: patch.approved_by_user_id ?? existingRun.approved_by_user_id,
    signature_data_url: patch.signature_data_url ?? existingRun.signature_data_url,
    signature_date: patch.signature_date ?? existingRun.signature_date,
  };
}
