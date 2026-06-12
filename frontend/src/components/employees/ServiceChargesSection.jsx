import React from "react";
import MoneyInput from "../ui/MoneyInput.jsx";

export const SERVICE_CHARGE_FIELDS = [
  { name: "stamp_duty", label: "Stamp Duty" },
  { name: "mobile_deduction", label: "Mobile Deduction" },
];

export const emptyServiceCharges = () =>
  SERVICE_CHARGE_FIELDS.reduce((acc, { name }) => ({ ...acc, [name]: "" }), {});

const ServiceChargesSection = ({ values, onChange, onBlur, fieldErrors = {} }) => {
  return (
    <div className="md:col-span-2 border border-slate-300 rounded-xl p-5 bg-slate-50/60">
      <h4 className="text-lg font-semibold text-slate-900 mb-4">Service Charges</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SERVICE_CHARGE_FIELDS.map(({ name, label }) => (
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
              focusRingClass="focus-within:ring-slate-500"
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

export default ServiceChargesSection;
