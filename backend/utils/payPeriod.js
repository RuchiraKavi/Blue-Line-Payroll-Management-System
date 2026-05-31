export function getCurrentPayPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function isFuturePayPeriod(month, year) {
  const m = Number(month);
  const y = Number(year);
  const { month: cm, year: cy } = getCurrentPayPeriod();
  if (Number.isNaN(m) || Number.isNaN(y)) return false;
  if (y > cy) return true;
  if (y < cy) return false;
  return m > cm;
}

export function assertPayPeriodStarted(month, year) {
  if (isFuturePayPeriod(month, year)) {
    const err = new Error("Salary for this pay period is not available until the month has started.");
    err.statusCode = 400;
    throw err;
  }
}
