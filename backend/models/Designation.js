import mongoose from "mongoose";

const designationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },
  { timestamps: true }
);

designationSchema.index({ department: 1, title: 1 }, { unique: true });

const Designation = mongoose.model("Designation", designationSchema);

export default Designation;
