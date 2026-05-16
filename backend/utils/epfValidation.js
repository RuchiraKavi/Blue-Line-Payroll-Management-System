/** Auto-generated EPF numbers: EPF001, EPF002, … */
export const EPF_NUMBER_REGEX = /^EPF\d{3,}$/i;

export function normalizeEpfNumber(value) {
  if (value == null) return "";
  return String(value).trim().toUpperCase().replace(/\s+/g, "");
}

export function validateEpfNumberFormat(value) {
  const normalized = normalizeEpfNumber(value);
  return EPF_NUMBER_REGEX.test(normalized);
}

/** Next EPF number (EPF001, EPF002, …) from highest existing EPF### value. */
export async function getNextEpfNumber(Employee) {
  const rows = await Employee.find({ epf_number: { $regex: /^EPF\d+$/i } })
    .select("epf_number")
    .lean();

  let maxNum = 0;
  for (const row of rows) {
    const m = String(row.epf_number || "").match(/^EPF(\d+)$/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }

  let nextNum = maxNum + 1;
  let candidate = `EPF${String(nextNum).padStart(3, "0")}`;
  while (await Employee.findOne({ epf_number: candidate }).select("_id")) {
    nextNum += 1;
    candidate = `EPF${String(nextNum).padStart(3, "0")}`;
  }
  return candidate;
}

export async function assertUniqueEpfNumber(Employee, epfNumber, excludeEmployeeId = null) {
  const normalized = normalizeEpfNumber(epfNumber);
  if (!validateEpfNumberFormat(normalized)) {
    return { ok: false, message: "EPF number must use format EPF001 (EPF + digits)" };
  }
  const query = { epf_number: normalized };
  if (excludeEmployeeId) query._id = { $ne: excludeEmployeeId };
  const existing = await Employee.findOne(query).select("_id");
  if (existing) {
    return { ok: false, message: "EPF number already assigned to another employee" };
  }
  return { ok: true, value: normalized };
}

/** Use provided EPF number or allocate the next EPF### automatically. */
export async function resolveEpfNumberForNewEmployee(Employee, epfNumberFromBody) {
  const trimmed = epfNumberFromBody != null ? String(epfNumberFromBody).trim() : "";
  if (trimmed) {
    return assertUniqueEpfNumber(Employee, trimmed);
  }
  const value = await getNextEpfNumber(Employee);
  return { ok: true, value };
}
