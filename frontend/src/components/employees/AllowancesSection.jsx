import React from "react";
import MoneyInput from "../ui/MoneyInput.jsx";

export const ALLOWANCE_FIELDS = [
  { name: "travel_allowance", label: "Travel" },
  { name: "food_allowance", label: "Food" },
  { name: "holiday_payment", label: "Holiday" },
  { name: "allowance_ns", label: "Attendance Allowance" },
  { name: "bonus", label: "Bonus" },
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
            <MoneyInput
              id={name}
              name={name}
              value={values[name] ?? ""}
              onChange={onChange}
              onBlur={onBlur}
              hasError={Boolean(fieldErrors[name])}
              focusRingClass="focus-within:ring-amber-500"
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
