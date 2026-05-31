/** Current calendar month (1–12) and year for pay-period rules. */
export function getCurrentPayPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/** True if pay period has not started yet (no salary cards until the 1st of that month). */
export function isFuturePayPeriod(month, year) {
  const m = Number(month);
  const y = Number(year);
  const { month: cm, year: cy } = getCurrentPayPeriod();
  if (Number.isNaN(m) || Number.isNaN(y)) return false;
  if (y > cy) return true;
  if (y < cy) return false;
  return m > cm;
}

/** First day of pay period (local). */
export function payPeriodStartDate(month, year) {
  return new Date(Number(year), Number(month) - 1, 1);
}
