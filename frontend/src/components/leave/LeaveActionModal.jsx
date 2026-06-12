import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import SignatureImageInput from "../ui/SignatureImageInput.jsx";

const LeaveActionModal = ({ action, onClose, onConfirm, updating }) => {
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const isApprove = action === "Approved";

  const handleConfirm = () => {
    onConfirm(signatureDataUrl);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 ${
            isApprove ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <h3 className="text-lg font-bold text-gray-900">
            {isApprove ? "Approve Leave" : "Reject Leave"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="p-2 rounded-lg hover:bg-white/80 transition-colors"
            aria-label="Close"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {isApprove
              ? "Confirm approval of this leave request. You may attach your signature as an image."
              : "Confirm rejection of this leave request. You may attach your signature as an image."}
          </p>

          <SignatureImageInput
            value={signatureDataUrl}
            onChange={setSignatureDataUrl}
            disabled={updating}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={updating}
              className={`px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 ${
                isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {updating ? "Saving…" : isApprove ? "Approve" : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveActionModal;
