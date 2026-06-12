import React from "react";

const ReportApprovalSection = ({ approvalInfo }) => {
  const approvedBy = approvalInfo?.approvedBy || "—";
  const name = approvalInfo?.name || "—";
  const designation = approvalInfo?.designation || "—";
  const signatureDataUrl = approvalInfo?.signatureDataUrl || null;

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600 space-y-2">
      <p>Approved by: {approvedBy}</p>
      <p>Name: {name}</p>
      <p>Designation: {designation}</p>
      <div className="flex items-start gap-2">
        <span>Signature:</span>
        {signatureDataUrl ? (
          <img
            src={signatureDataUrl}
            alt="Approver signature"
            className="h-12 object-contain object-left max-w-[180px]"
          />
        ) : (
          <span>—</span>
        )}
      </div>
    </div>
  );
};

export default ReportApprovalSection;
