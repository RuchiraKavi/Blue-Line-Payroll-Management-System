import mongoose, { Schema } from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    // 🔐 AUTH USER
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🆔 EMPLOYEE IDENTIFIERS
    employee_id: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    nic: {
      type: String,
      required: true,
      unique: true,
    },

    epf_number: {
      type: String,
      required: [true, "EPF number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    // 👤 PERSONAL DETAILS
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    marital_status: { type: String, required: true },
    address: { type: String, trim: true, default: "" },
    mobile_number: { type: String, trim: true, default: "" },

    // 💼 EMPLOYMENT DETAILS
    joined_date: { type: Date, required: true },
    resigned_date: { type: Date, default: null },

    designation: {
      type: String,
      required: true,
    },

    // 🏢 DEPARTMENT
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // 💰 SALARY
    basic_salary: { type: Number, required: true },
    travel_allowance: { type: Number, default: 0, min: 0 },
    food_allowance: { type: Number, default: 0, min: 0 },
    holiday_payment: { type: Number, default: 0, min: 0 },
    allowance_ns: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    stamp_duty: { type: Number, default: 0, min: 0 },
    mobile_deduction: { type: Number, default: 0, min: 0 },

    // 🏦 BANK DETAILS
    bank_details: {
      bank_name: { type: String, required: true },
      bank_branch: { type: String, required: true },
      bank_account_number: { type: String, required: true },
    },

    // 🖼 PROFILE IMAGE
    image: { type: String },

    // 🧑‍💼 ROLE TYPE (admin, hr, accountant, manager, employee, intern)
    role: {
      type: String,
      enum: ["admin", "hr", "accountant", "manager", "employee", "intern"],
      required: true,
    },

    // 🌴 LEAVE BALANCE (stored as `leave_balance` to match controllers)
    leave_balance: {
      casual: {
        type: Number,
        default: function () {
          // All roles get 7 casual leaves
          return 7;
        },
      },
      annual: {
        type: Number,
        default: function () {
          // Interns get 0 annual, all others get 14
          return this.role === "intern" ? 0 : 14;
        },
      },
      sick: {
        type: Number,
        default: function () {
          // Interns get 0 sick, all others get 21
          return this.role === "intern" ? 0 : 21;
        },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
