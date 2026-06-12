export const JOB_TYPES = [
  "Permanent",
  "Contract",
  "Probation",
  "Temporary",
  "Part-time",
];

export function validateJobType(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return { ok: false, message: "Job type is required" };
  }
  if (!JOB_TYPES.includes(trimmed)) {
    return { ok: false, message: "Invalid job type selected" };
  }
  return { ok: true, value: trimmed };
}
