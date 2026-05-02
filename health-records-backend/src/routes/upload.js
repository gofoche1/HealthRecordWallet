import express from "express";
import multer from "multer";
//import { Readable } from "stream";
import { File } from "node:buffer";
import { encryptBuffer } from "../services/encryption.js";
import { pinata } from "../services/pinata.js";
import Record from "../models/Record.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { encryptedBuffer, iv } = encryptBuffer(req.file.buffer);

   const encryptedFile = new File(
  [encryptedBuffer],
  `${req.file.originalname}.enc`,
  { type: "application/octet-stream" }
);

const result = await pinata.upload.public.file(encryptedFile);


    const newRecord = await Record.create({
      userId,
      title: req.body.title || req.file.originalname,
      encryptedFileCid: result.cid,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    return res.status(200).json({
      message: "Encrypted file uploaded to IPFS via Pinata",
      cid: result.cid,
      iv,
      record: newRecord,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Upload failed",
      details: error.message,
    });
  }
});
router.get("/records/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const records = await Record.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Records fetched successfully",
      count: records.length,
      records,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch records",
      details: error.message,
    });
  }
});
export default router;