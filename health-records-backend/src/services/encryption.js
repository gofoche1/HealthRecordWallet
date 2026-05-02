import "dotenv/config";
import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

if (!process.env.FILE_ENCRYPTION_KEY) {
  throw new Error("FILE_ENCRYPTION_KEY is missing from .env");
}

const KEY = Buffer.from(process.env.FILE_ENCRYPTION_KEY, "hex");

if (KEY.length !== 32) {
  throw new Error("FILE_ENCRYPTION_KEY must be exactly 64 hex characters");
}

export function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return {
    encryptedBuffer: encrypted,
    iv: iv.toString("hex"),
  };
}