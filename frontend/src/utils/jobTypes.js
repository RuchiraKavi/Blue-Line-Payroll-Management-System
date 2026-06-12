export const JOB_TYPES = [
  "Permanent",
  "Contract",
  "Probation",
  "Temporary",
  "Part-time",
];

export const JOB_TYPE_OPTIONS = [
  { value: "", label: "Select Job Type" },
  ...JOB_TYPES.map((type) => ({ value: type, label: type })),
];

export function validateJobType(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Job type is required";
  if (!JOB_TYPES.includes(trimmed)) return "Please select a valid job type";
  return null;
}
