import mongoose from "mongoose";

const consentSchema = new mongoose.Schema(
  {
    patientId: {
  type: String,
  required: true,
},
  granteeId: {
    type: String,
    required: true,
  },

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Record",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "granted", "revoked", "expired"],
      default: "pending",
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Consent", consentSchema);