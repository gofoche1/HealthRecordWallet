import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.js";
import consentRoutes from "./routes/consent.js";
import { connectMongo } from "./config/db.mongo.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "health-records-backend" });
});

app.use("/api", uploadRoutes);
app.use("/api/consent", consentRoutes);

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectMongo();
    console.log("MongoDB connected");

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

startServer();