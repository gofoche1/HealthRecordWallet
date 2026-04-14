import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    walletAddress: { type: String, trim: true },
    role: {
      type: String,
      enum: ["patient", "provider", "admin"],
      default: "patient",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);