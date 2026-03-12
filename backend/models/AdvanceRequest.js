import mongoose, { Schema } from "mongoose";

const advanceRequestSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
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
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

advanceRequestSchema.index({ employeeId: 1, createdAt: -1 });
advanceRequestSchema.index({ status: 1 });

export default mongoose.model("AdvanceRequest", advanceRequestSchema);
