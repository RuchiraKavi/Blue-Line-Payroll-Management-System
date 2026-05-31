/**
 * Sri Lanka APIT (Advance Personal Income Tax) / PAYE — 2025/2026 tax year.
 * Annual relief: LKR 1,800,000. Progressive slabs on remaining taxable income.
 */

export const ANNUAL_TAX_FREE_RELIEF = 1_800_000;

export const TAX_SLABS = [
  { width: 1_000_000, rate: 0.06 },
  { width: 500_000, rate: 0.18 },
  { width: 500_000, rate: 0.24 },
  { width: 500_000, rate: 0.3 },
  { width: Infinity, rate: 0.36 },
];

export function calculateAnnualTaxAfterRelief(annualTaxableAfterRelief) {
  const taxable = Math.max(0, Number(annualTaxableAfterRelief) || 0);
  let remaining = taxable;
  let tax = 0;

  for (const { width, rate } of TAX_SLABS) {
    if (remaining <= 0) break;
    const slabAmount = Math.min(remaining, width);
    tax += slabAmount * rate;
    remaining -= slabAmount;
  }

  return Math.round(tax);
}

export function calculateAnnualPayeFromGross(annualGrossIncome) {
  const gross = Math.max(0, Number(annualGrossIncome) || 0);
  const afterRelief = Math.max(0, gross - ANNUAL_TAX_FREE_RELIEF);
  return calculateAnnualTaxAfterRelief(afterRelief);
}

export function calculateMonthlyApit(monthlyGrossIncome) {
  const monthly = Math.max(0, Number(monthlyGrossIncome) || 0);
  const annualTax = calculateAnnualPayeFromGross(monthly * 12);
  return Math.round(annualTax / 12);
}
