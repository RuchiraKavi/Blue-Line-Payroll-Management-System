import mongoose from "mongoose";

const departmentDesignationSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      required: true,
    },
  },
  { timestamps: true }
);

departmentDesignationSchema.index(
  { department: 1, designation: 1 },
  { unique: true }
);

const DepartmentDesignation = mongoose.model(
  "DepartmentDesignation",
  departmentDesignationSchema
);

export default DepartmentDesignation;
