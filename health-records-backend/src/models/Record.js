import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    userId: {
  type: String,
  required: true,
},
iv: { type: String, required: true },
    title: { type: String, required: true },
    recordType: { type: String, default: "medical" },
    encryptedFileCid: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    docId: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("Record", recordSchema);