import mongoose from "mongoose";

const consentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    granteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Record",
      required: true,
    },
    status: {
      type: String,
      enum: ["granted", "revoked", "expired"],
      default: "granted",
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Consent", consentSchema);