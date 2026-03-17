import mongoose, { Schema } from "mongoose";

const payslipEntrySchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employee_id: { type: String },
    name: { type: String },
    designation: { type: String },
    department: { type: String },
    basic_salary: { type: Number, default: 0 },
    travel_allowance: { type: Number, default: 0 },
    food_allowance: { type: Number, default: 0 },
    holiday_payment: { type: Number, default: 0 },
    allowance_ns: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    no_pay: { type: Number, default: 0 },
    salary_advance: { type: Number, default: 0 },
    stamp_duty: { type: Number, default: 0 },
    mobile_deduction: { type: Number, default: 0 },
    paye: { type: Number, default: 0 },
    epf_percent: { type: Number, default: 8 },
    etf_percent: { type: Number, default: 3 },
    total_allowances: { type: Number, default: 0 },
    total_service_charges: { type: Number, default: 0 },
    gross_salary: { type: Number, default: 0 },
    total_for_epf: { type: Number, default: 0 },
    epf_payment: { type: Number, default: 0 },
    employer_epf_payment: { type: Number, default: 0 },
    etf_payment: { type: Number, default: 0 },
    total_deduction: { type: Number, default: 0 },
    net_pay: { type: Number, default: 0 },
    approval_status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    signature_data_url: { type: String, default: null },
    signature_date: { type: String, default: null },
    bank_details: {
      bank_name: String,
      bank_branch: String,
      bank_account_number: String,
    },
  },
  { _id: false }
);

const salaryRunSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    entries: [payslipEntrySchema],
    signature_data_url: { type: String, default: null },
    signature_date: { type: String, default: null },
    finalized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

salaryRunSchema.index({ month: 1, year: 1 }, { unique: true });

export default mongoose.model("SalaryRun", salaryRunSchema);
