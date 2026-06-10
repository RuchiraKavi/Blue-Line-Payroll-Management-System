import React from "react";

export const ALLOWANCE_FIELDS = [
  { name: "travel_allowance", label: "Travel" },
  { name: "food_allowance", label: "Food" },
  { name: "holiday_payment", label: "Holiday" },
  { name: "allowance_ns", label: "Attendance Allowance" },
];

export const emptyAllowances = () =>
  ALLOWANCE_FIELDS.reduce((acc, { name }) => ({ ...acc, [name]: "" }), {});

const AllowancesSection = ({ values, onChange, onBlur, fieldErrors = {} }) => {
  return (
    <div className="md:col-span-2 border border-amber-200 rounded-xl p-5 bg-amber-50/40">
      <h4 className="text-lg font-semibold text-amber-900 mb-4">Allowances</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALLOWANCE_FIELDS.map(({ name, label }) => (
          <div key={name}>
            <label
              htmlFor={name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {label}
            </label>
            <input
              type="number"
              id={name}
              name={name}
              min="0"
              step="0.01"
              value={values[name] ?? ""}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="0.00"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${
                fieldErrors[name]
                  ? "border-red-500 focus:ring-red-100 focus:border-red-500"
                  : "border-gray-300 focus:ring-amber-500 focus:border-transparent"
              }`}
            />
            {fieldErrors[name] && (
              <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors[name]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllowancesSection;
