import mongoose, { Schema } from "mongoose";

const leaveReportRunSchema = new Schema(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    signature_data_url: { type: String, default: null },
    approved_by_user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approved_by_role: { type: String, default: null },
    approved_by_name: { type: String, default: null },
    approved_at: { type: Date, default: null },
  },
  { timestamps: true }
);

leaveReportRunSchema.index({ month: 1, year: 1 }, { unique: true });

const LeaveReportRun = mongoose.model("LeaveReportRun", leaveReportRunSchema);

export default LeaveReportRun;
