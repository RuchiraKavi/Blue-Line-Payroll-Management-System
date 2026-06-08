import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: { type: String, required: true, trim: true },
    isSystem: { type: Boolean, default: false },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

roleSchema.index(
  { key: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  }
);

const Role = mongoose.model("Role", roleSchema);

export default Role;
