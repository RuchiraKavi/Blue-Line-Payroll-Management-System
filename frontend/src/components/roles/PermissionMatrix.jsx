import React from "react";
import {
  CRUD_ACTIONS,
  PERMISSION_SECTIONS,
  setAllPermissions,
  setSectionPermissions,
} from "../../utils/permissionSections.js";

const PermissionMatrix = ({ value, onChange, disabled = false }) => {
  const permissions = value || {};

  const toggle = (sectionKey, actionKey) => {
    if (disabled) return;
    const current = Boolean(permissions[sectionKey]?.[actionKey]);
    onChange(
      setSectionPermissions(permissions, sectionKey, {
        [actionKey]: !current,
      })
    );
  };

  const toggleRow = (sectionKey, checked) => {
    if (disabled) return;
    onChange(
      setSectionPermissions(permissions, sectionKey, {
        create: checked,
        read: checked,
        update: checked,
        delete: checked,
      })
    );
  };

  const toggleColumn = (actionKey, checked) => {
    if (disabled) return;
    const next = { ...permissions };
    for (const section of PERMISSION_SECTIONS) {
      next[section.key] = {
        ...next[section.key],
        [actionKey]: checked,
      };
    }
    onChange(next);
  };

  const toggleAll = (checked) => {
    if (disabled) return;
    onChange(setAllPermissions(permissions, checked));
  };

  const isRowFullyChecked = (sectionKey) =>
    CRUD_ACTIONS.every((action) => permissions[sectionKey]?.[action.key]);

  const isColumnFullyChecked = (actionKey) =>
    PERMISSION_SECTIONS.every((section) => permissions[section.key]?.[actionKey]);

  const allChecked = PERMISSION_SECTIONS.every((section) =>
    isRowFullyChecked(section.key)
  );

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Section Permissions
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose Create, Read, Update, and Delete access for each module.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={allChecked}
            disabled={disabled}
            onChange={(e) => toggleAll(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Select all
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-white border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                Section
              </th>
              {CRUD_ACTIONS.map((action) => (
                <th key={action.key} className="px-3 py-3 text-center font-semibold text-gray-700">
                  <label className="inline-flex flex-col items-center gap-1 cursor-pointer">
                    <span>{action.label}</span>
                    <input
                      type="checkbox"
                      checked={isColumnFullyChecked(action.key)}
                      disabled={disabled}
                      onChange={(e) => toggleColumn(action.key, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold text-gray-700">All</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_SECTIONS.map((section) => (
              <tr key={section.key} className="border-b border-gray-100 hover:bg-gray-50/80">
                <td className="px-4 py-3 font-medium text-gray-800">{section.label}</td>
                {CRUD_ACTIONS.map((action) => (
                  <td key={action.key} className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(permissions[section.key]?.[action.key])}
                      disabled={disabled}
                      onChange={() => toggle(section.key, action.key)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      aria-label={`${section.label} ${action.label}`}
                    />
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isRowFullyChecked(section.key)}
                    disabled={disabled}
                    onChange={(e) => toggleRow(section.key, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label={`All permissions for ${section.label}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionMatrix;
