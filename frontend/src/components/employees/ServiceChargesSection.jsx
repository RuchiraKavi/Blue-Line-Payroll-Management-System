import React from "react";

export const SERVICE_CHARGE_FIELDS = [
  { name: "stamp_duty", label: "Stamp Duty" },
  { name: "mobile_deduction", label: "Mobile Deduction" },
];

export const emptyServiceCharges = () =>
  SERVICE_CHARGE_FIELDS.reduce((acc, { name }) => ({ ...acc, [name]: "" }), {});

const ServiceChargesSection = ({ values, onChange }) => {
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
            <input
              type="number"
              id={name}
              name={name}
              min="0"
              step="0.01"
              value={values[name] ?? ""}
              onChange={onChange}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceChargesSection;
