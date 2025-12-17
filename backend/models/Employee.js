import mongoose, { Schema } from "mongoose";

const employeeSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

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

  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  marital_status: { type: String, required: true },

  joined_date: { type: Date, required: true },
  resigned_date: { type: Date, default: null },

  designation: { type: String, required: true },

  department: {
    type: Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },

  basic_salary: { type: Number, required: true },

  image: { type: String },
});

export default mongoose.model("Employee", employeeSchema);
