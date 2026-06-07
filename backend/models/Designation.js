import mongoose from "mongoose";

const designationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

designationSchema.index(
  { title: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  }
);

const Designation = mongoose.model("Designation", designationSchema);

export default Designation;
