import express from "express";
import multer from "multer";
import { encryptBuffer } from "../services/encryption.js";
import { pinata } from "../services/pinata.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { encryptedBuffer, iv } = encryptBuffer(req.file.buffer);

    const encryptedFile = new File(
      [encryptedBuffer],
      `${req.file.originalname}.enc`,
      { type: "application/octet-stream" }
    );

    const result = await pinata.upload.public.file(encryptedFile);

    return res.status(200).json({
      message: "Encrypted file uploaded to IPFS via Pinata",
      cid: result.cid,
      originalName: req.file.originalname,
      storedName: `${req.file.originalname}.enc`,
      iv,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Upload failed",
      details: error.message,
    });
  }
});

export default router;