import React from "react";
import { FaPenFancy } from "react-icons/fa";

const SignatureImageInput = ({
  value,
  onChange,
  disabled = false,
  label = "Add signature (optional)",
  changeLabel = "Change signature",
}) => {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <label
        className={`inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
        }`}
      >
        <FaPenFancy className="text-blue-600 shrink-0" />
        <span>{value ? changeLabel : label}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={disabled}
        />
      </label>

      {value && (
        <div className="flex flex-wrap items-end gap-3">
          <img
            src={value}
            alt="Signature preview"
            className="h-16 object-contain object-left max-w-[220px] border border-gray-200 rounded-lg bg-white p-2"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default SignatureImageInput;
