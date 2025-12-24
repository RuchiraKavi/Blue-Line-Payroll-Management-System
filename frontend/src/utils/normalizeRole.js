export default function normalizeRole(r) {
  if (!r) return "";
  const x = String(r).toLowerCase();
  if (x === "hr_manager") return "hr";
  if (x === "account" || x === "account_manager" || x === "accountant") return "accountant";
  return x;
}
