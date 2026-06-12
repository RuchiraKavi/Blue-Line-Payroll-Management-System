import mongoose, { Schema } from "mongoose";
import { countInclusiveCalendarDays } from "../utils/payrollAttendance.js";

const leaveSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Assigned employee (must match employeeId department and designation)
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    leaveType: {
      type: String,
      enum: ["casual", "annual", "sick", "nopay"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    signature_data_url: {
      type: String,
      default: null,
    },

    remarks: {
      type: String,
      default: null,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* ---------------- AUTO-CALCULATE TOTAL DAYS ---------------- */
leaveSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (end < start) {
      return next(new Error("End date cannot be before start date"));
    }

    this.totalDays = countInclusiveCalendarDays(start, end);
  }
  next();
});

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
