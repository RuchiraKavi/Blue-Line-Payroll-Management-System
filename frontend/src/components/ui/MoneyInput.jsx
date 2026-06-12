import React from "react";

/**
 * Numeric amount field with Rs. prefix for salary/allowance inputs.
 */
export default function MoneyInput({
  name,
  value,
  onChange,
  onBlur,
  id,
  min = 0,
  step = "0.01",
  placeholder = "0.00",
  required = false,
  disabled = false,
  readOnly = false,
  hasError = false,
  focusRingClass = "focus-within:ring-indigo-500",
  className = "",
  autoComplete = "off",
}) {
  const borderClass = hasError
    ? "border-red-500 focus-within:ring-2 focus-within:ring-red-100 focus-within:border-red-500"
    : `border-gray-300 focus-within:ring-2 ${focusRingClass} focus-within:border-transparent`;

  return (
    <div className={`flex items-stretch w-full rounded-lg border overflow-hidden ${borderClass} ${className}`}>
      <span className="inline-flex items-center px-3 bg-gray-50 text-gray-600 text-sm font-medium border-r border-gray-300 shrink-0 select-none">
        Rs.
      </span>
      <input
        type="number"
        name={name}
        id={id ?? name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        min={min}
        step={step}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete}
        className="flex-1 min-w-0 px-4 py-2 border-0 bg-white text-gray-900 focus:ring-0 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed read-only:bg-gray-100 read-only:cursor-not-allowed"
      />
    </div>
  );
}
