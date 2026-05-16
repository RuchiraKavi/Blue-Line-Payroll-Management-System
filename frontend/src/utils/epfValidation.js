/** Display-only: system-generated EPF numbers use EPF001, EPF002, … */
export const EPF_NUMBER_REGEX = /^EPF\d{3,}$/i;

export function normalizeEpfNumber(value) {
  if (value == null) return "";
  return String(value).trim().toUpperCase().replace(/\s+/g, "");
}

export function validateEpfNumber(value) {
  return EPF_NUMBER_REGEX.test(normalizeEpfNumber(value));
}
