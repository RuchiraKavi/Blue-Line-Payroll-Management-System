import mongoose from "mongoose";
import { migrateLegacyRoles } from "../utils/roleMigration.js";

const connectToDatabase = async () => {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error(
      "MONGODB_URL is not set. Copy backend/.env.example to backend/.env and configure MongoDB."
    );
  }

  try {
    await mongoose.connect(mongoUrl);
    await migrateLegacyRoles();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error.message);
    throw error;
  }
};

export default connectToDatabase;
