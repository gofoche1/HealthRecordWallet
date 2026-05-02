import express from "express";
import Record from "../models/Record.js";
import Consent from "../models/Consent.js";

const router = express.Router();

// SECURE ACCESS ROUTE
router.get("/:recordId/access", async (req, res) => {
  try {
    const { recordId } = req.params;
    const { granteeId } = req.query;

    const consent = await Consent.findOne({
      granteeId,
      recordId,
      status: "granted",
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    if (!consent) {
      return res.status(403).json({
        error: "Access denied. No active consent found.",
      });
    }

    const record = await Record.findById(recordId);

    return res.status(200).json({
      message: "Access granted",
      record,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to access record",
      details: error.message,
    });
  }
});

export default router;