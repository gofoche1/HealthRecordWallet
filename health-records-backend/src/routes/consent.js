import express from "express";
import Consent from "../models/Consent.js";

const router = express.Router();


router.post("/grant", async (req, res) => {
  try {
    const { patientId, granteeId, recordId, expiresAt } = req.body;

    const consent = await Consent.create({
      patientId,
      granteeId,
      recordId,
      expiresAt,
      status: "granted",
    });

    return res.status(201).json({
      message: "Access granted successfully",
      consent,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to grant access",
      details: error.message,
    });
  }
});

router.post("/revoke", async (req, res) => {
  try {
    const { consentId } = req.body;

    const consent = await Consent.findByIdAndUpdate(
      consentId,
      { status: "revoked" },
      { new: true }
    );
  

    if (!consent) {
      return res.status(404).json({ error: "Consent not found" });
    }

    return res.status(200).json({
      message: "Access revoked successfully",
      consent,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to revoke access",
      details: error.message,
    });
  }
});

router.get("/check", async (req, res) => {
  try {
    const { granteeId, recordId } = req.query;

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

    return res.status(200).json({
      hasAccess: !!consent,
      consent,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to check access",
      details: error.message,
    });
  }
});


export default router;