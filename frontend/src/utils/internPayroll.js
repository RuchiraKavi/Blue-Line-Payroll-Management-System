export const INTERN_MONTHLY_LEAVE_DAYS = 0.5;
export const INTERN_MONTHLY_GRACE_HOURS = 4;

export function isInternRole(role) {
  return String(role || "").toLowerCase().trim() === "intern";
}

export function isInternDesignation(designation) {
  return String(designation || "").toLowerCase().trim() === "intern";
}

export function isInternEmployee(employee) {
  if (!employee) return false;
  const employeeRole = employee.role || "";
  const userRole = employee.userId?.role || "";
  return (
    isInternRole(employeeRole) ||
    isInternRole(userRole) ||
    isInternDesignation(employee.designation)
  );
}

export function getEmployeeEffectiveRole(employee) {
  if (isInternEmployee(employee)) return "intern";
  return employee?.role || employee?.userId?.role || "";
}

export function resolveEpfEtfPayments(totalForEpfBase, role) {
  const base = Math.max(0, Number(totalForEpfBase) || 0);
  if (isInternRole(role)) {
    return {
      total_for_epf: 0,
      epf_payment: 0,
      employer_epf_payment: 0,
      etf_payment: 0,
    };
  }
  return {
    total_for_epf: base,
    epf_payment: Math.round(base * 0.08 * 100) / 100,
    employer_epf_payment: Math.round(base * 0.12 * 100) / 100,
    etf_payment: Math.round(base * 0.03 * 100) / 100,
  };
}
