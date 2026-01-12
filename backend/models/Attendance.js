import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    employee_id: {
      type: String,
      required: true,
      index: true,
    },

    // 📅 Attendance date (normalized to 00:00)
    date: {
      type: Date,
      required: true,
      index: true,
    },

    inTime: {
      type: String,
      default: null,
      trim: true,
    },

    outTime: {
      type: String,
      default: null,
      trim: true,
    },

    workingHours: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent"],
      required: true,
      default: "Present",
    },

    // 🧾 Optional: who uploaded the attendance
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 📂 Source of attendance
    source: {
      type: String,
      enum: ["CSV", "Manual"],
      default: "CSV",
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   UNIQUE CONSTRAINT
   Prevent duplicate attendance
========================= */
attendanceSchema.index(
  { employee: 1, date: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
