import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    recordType: { type: String, default: "medical" },
    encryptedFileCid: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Record", recordSchema);