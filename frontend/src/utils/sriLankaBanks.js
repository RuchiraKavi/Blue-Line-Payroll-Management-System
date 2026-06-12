/** Approved banks for employee bank details. */
export const SRI_LANKA_BANKS = [
  "Bank of Ceylon",
  "Cargills Bank PLC",
  "Commercial Bank of Ceylon PLC",
  "DFCC Bank PLC",
  "Hatton National Bank PLC",
  "National Development Bank PLC",
  "National Savings Bank",
  "Nations Trust Bank PLC",
  "Pan Asia Banking Corporation PLC",
  "People's Bank",
  "Pradeshiya Sanwardhana Bank",
  "Sanasa Development Bank PLC",
  "Union Bank of Colombo PLC",
];

export const SRI_LANKA_BANK_OPTIONS = [
  { value: "", label: "Select Bank" },
  ...SRI_LANKA_BANKS.map((bank) => ({ value: bank, label: bank })),
];
