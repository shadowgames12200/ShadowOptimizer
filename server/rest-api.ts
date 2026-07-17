import express, { Request, Response } from "express";
import * as db from "./db";

const router = express.Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

/**
 * Public REST endpoint for license validation
 * POST /api/validate-license
 * Body: { key: string, hwid: string }
 * Response: { authorized: boolean, message: string, ... }
 */
router.post("/validate-license", async (req: Request, res: Response) => {
  try {
    const { key, hwid } = req.body;

    // Validate input
    if (!key || typeof key !== "string") {
      return res.status(400).json({
        authorized: false,
        message: "Missing or invalid 'key' parameter",
      });
    }

    if (!hwid || typeof hwid !== "string") {
      return res.status(400).json({
        authorized: false,
        message: "Missing or invalid 'hwid' parameter",
      });
    }

    const requestSource = req.ip || req.headers["x-forwarded-for"] || "unknown";

    // Get license by key
    const license = await db.getLicenseByKey(key);
    if (!license) {
      // If DB is unavailable, getLicenseByKey returns undefined — treat as invalid key
      await db.logAccessAttempt(0, hwid, "invalid_key", requestSource as string);
      return res.status(200).json({
        authorized: false,
        message: "Invalid license key",
      });
    }

    // Check if license is revoked
    if (license.status === "revoked") {
      await db.logAccessAttempt(license.id, hwid, "revoked", requestSource as string);
      return res.status(200).json({
        authorized: false,
        message: "License has been revoked",
      });
    }

    // Check if license is expired
    if (license.status === "expired" || (license.expiresAt && new Date() > license.expiresAt)) {
      await db.logAccessAttempt(license.id, hwid, "expired", requestSource as string);
      return res.status(200).json({
        authorized: false,
        message: "License has expired",
      });
    }

    // If not activated yet, bind HWID and activate
    if (!license.activated) {
      await db.bindHwidToLicense(license.id, hwid);
      await db.logAccessAttempt(license.id, hwid, "success", requestSource as string);
      return res.status(200).json({
        authorized: true,
        message: "License activated successfully",
        licenseKey: license.key,
        expiresAt: license.expiresAt?.toISOString(),
        boundHwid: hwid,
      });
    }

    // Check if HWID matches
    if (license.boundHwid !== hwid) {
      await db.logAccessAttempt(license.id, hwid, "invalid_hwid", requestSource as string);
      return res.status(200).json({
        authorized: false,
        message: "HWID does not match the bound hardware",
      });
    }

    // All checks passed
    await db.logAccessAttempt(license.id, hwid, "success", requestSource as string);
    return res.status(200).json({
      authorized: true,
      message: "License is valid",
      licenseKey: license.key,
      expiresAt: license.expiresAt?.toISOString(),
      boundHwid: license.boundHwid,
    });
  } catch (error) {
    console.error("[REST API Error]", error);
    return res.status(500).json({
      authorized: false,
      message: "Internal server error",
    });
  }
});

export default router;
