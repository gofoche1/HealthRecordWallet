import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.js";
import { connectMongo } from "./config/db.mongo.js";

connectMongo().catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "health-records-backend" });
});

app.use("/api", uploadRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


