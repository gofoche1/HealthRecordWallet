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
    granteeId: granteeId.toLowerCase(),
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
// Provider requests access
router.post("/request", async (req, res) => {
  try {
    const { patientId, granteeId, recordId } = req.body;

    console.log("REQUEST BODY:", req.body);

    if (!patientId || !granteeId || !recordId) {
      return res.status(400).json({
        error: "Missing required fields",
        received: req.body,
      });
    }

    const request = await Consent.create({
      patientId: patientId.toLowerCase(),
      granteeId: granteeId.toLowerCase(),
      recordId,
      status: "pending",
    });

    return res.status(201).json({
      message: "Access request created successfully",
      request,
    });
  } catch (error) {
    console.error("CONSENT REQUEST ERROR:", error);

    return res.status(500).json({
      error: "Failed to create access request",
      details: error.message,
    });
  }
});

// Patient gets pending requests
router.get("/requests/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

   const requests = await Consent.find({
  patientId: patientId.toLowerCase(),
  status: "pending",
}).populate("recordId");

    return res.status(200).json({
      message: "Pending requests fetched successfully",
      count: requests.length,
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch requests",
      details: error.message,
    });
  }
});

// Patient approves request
router.post("/approve", async (req, res) => {
  try {
    const { consentId } = req.body;

    const consent = await Consent.findByIdAndUpdate(
      consentId,
      { status: "granted" },
      { new: true }
    );

    return res.status(200).json({
      message: "Access request approved",
      consent,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to approve request",
      details: error.message,
    });
  }
});
router.get("/all", async (_req, res) => {
  try {
    const consents = await Consent.find().populate("recordId").sort({ createdAt: -1 });
    res.json({ count: consents.length, consents });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch consents", details: error.message });
  }
});

router.get("/history/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const history = await Consent.find({
        patientId: patientId.toLowerCase(),
        })
        .populate("recordId")
        .sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Consent history fetched successfully",
      count: history.length,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch consent history",
      details: error.message,
    });
  }
});

router.post("/deny", async (req, res) => {
  try {
    const { consentId } = req.body;

    const consent = await Consent.findByIdAndUpdate(
      consentId,
      { status: "revoked" },
      { new: true }
    );

    if (!consent) {
      return res.status(404).json({ error: "Request not found" });
    }

    return res.status(200).json({
      message: "Access request denied",
      consent,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to deny request",
      details: error.message,
    });
  }
});
export default router;