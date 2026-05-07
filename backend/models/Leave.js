import mongoose, { Schema } from "mongoose";

const leaveSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Assigned employee (must be same department as employeeId.department)
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
      min: 1,
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

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    this.totalDays = diffDays;
  }
  next();
});

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
