import React from "react";
import { FaCheck, FaSave } from "react-icons/fa";
import SignatureImageInput from "../ui/SignatureImageInput.jsx";

const AttendanceReportApprovalSection = ({
  approvalInfo,
  editable = false,
  draftSignature = null,
  onDraftSignatureChange,
  onApprove,
  approving = false,
  loading = false,
}) => {
  const approvedBy = approvalInfo?.approvedBy || "—";
  const name = approvalInfo?.name || "—";
  const designation = approvalInfo?.designation || "—";
  const savedSignature = approvalInfo?.signatureDataUrl || null;
  const displaySignature = draftSignature || savedSignature || null;
  const isApproved = Boolean(savedSignature);

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-gray-800">Report approval</p>
        {isApproved && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            <FaCheck className="text-[10px]" />
            Approved
          </span>
        )}
      </div>

      <p>Approved by: {approvedBy}</p>
      <p>Name: {name}</p>
      <p>Designation: {designation}</p>

      <div className="flex items-start gap-2">
        <span className="shrink-0 pt-0.5">Signature:</span>
        {displaySignature ? (
          <img
            src={displaySignature}
            alt="Approver signature"
            className="h-12 object-contain object-left max-w-[180px] border border-gray-200 rounded-lg bg-white p-1"
          />
        ) : (
          <span>—</span>
        )}
      </div>

      {editable && (
        <div className="pt-2 border-t border-gray-200 space-y-3">
          <SignatureImageInput
            value={draftSignature}
            onChange={onDraftSignatureChange}
            disabled={approving || loading}
            label="Add signature to approve"
            changeLabel="Change signature"
          />
          <button
            type="button"
            onClick={onApprove}
            disabled={approving || loading || !draftSignature}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave />
            {approving ? "Approving…" : isApproved ? "Update approval" : "Approve report"}
          </button>
          {!draftSignature && !isApproved && (
            <p className="text-xs text-gray-500">Upload your signature image, then approve the report.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceReportApprovalSection;
