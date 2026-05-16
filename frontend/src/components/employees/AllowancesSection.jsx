import React from "react";

export const ALLOWANCE_FIELDS = [
  { name: "travel_allowance", label: "Travel" },
  { name: "food_allowance", label: "Food" },
  { name: "holiday_payment", label: "Holiday" },
  { name: "allowance_ns", label: "Allowance-NS" },
  { name: "bonus", label: "Bonus" },
];

export const emptyAllowances = () =>
  ALLOWANCE_FIELDS.reduce((acc, { name }) => ({ ...acc, [name]: "" }), {});

const AllowancesSection = ({ values, onChange }) => {
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
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllowancesSection;
