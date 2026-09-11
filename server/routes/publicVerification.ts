import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { idCards, members } from "../db/schema.js";

export const publicVerificationRouter = Router();

/**
 * Public QR Code Verification Endpoint
 * Validates the unpredictable 32-byte token embedded in the physical card's QR code.
 */
publicVerificationRouter.get("/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token || token.trim().length < 8) {
      return res.status(400).json({ success: false, error: "Invalid verification token." });
    }

    const cleanToken = token.trim();
    const db = await getDb();

    // Query card with member details
    const rows = await (db as any)
      .select({
        cardId: idCards.id,
        status: idCards.status,
        issuedAt: idCards.issuedAt,
        revokedAt: idCards.revokedAt,
        verificationCode: idCards.verificationCode,
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        passportPhotoRef: members.passportPhotoRef,
        memberStatus: members.memberStatus,
      })
      .from(idCards)
      .innerJoin(members, eq(idCards.memberId, members.id))
      .where(eq(idCards.cardToken, cleanToken))
      .limit(1);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: "Invalid AMTMP ID card. No matching card record found.",
      });
    }

    const card = rows[0];

    // If revoked, return explicit invalid notice
    if (card.status === "revoked" || card.memberStatus !== "active") {
      return res.json({
        success: true,
        valid: false,
        status: "revoked",
        message: "This AMTMP ID card is no longer valid.",
        verificationCode: card.verificationCode,
        associationName: "Association of Medical and Traditional Medicine Practitioners",
      });
    }

    // Return verified public details (strictly omitting private information)
    return res.json({
      success: true,
      valid: true,
      status: "active",
      message: "Verified Official AMTMP Membership Card",
      associationName: "Association of Medical and Traditional Medicine Practitioners",
      fullName: card.fullName,
      registrationNumber: card.registrationNumber,
      verificationCode: card.verificationCode,
      issuedAt: card.issuedAt,
      passportPhotoRef: card.passportPhotoRef,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Public Manual Verification Code Lookup Endpoint
 * Validates formatted codes printed on cards (e.g. V-8F4K-92XQ-71).
 */
publicVerificationRouter.get("/code/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code || code.trim().length < 5) {
      return res.status(400).json({ success: false, error: "Please enter a valid verification code." });
    }

    const cleanCode = code.trim().toUpperCase();
    const db = await getDb();

    const rows = await (db as any)
      .select({
        cardId: idCards.id,
        status: idCards.status,
        issuedAt: idCards.issuedAt,
        revokedAt: idCards.revokedAt,
        verificationCode: idCards.verificationCode,
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        passportPhotoRef: members.passportPhotoRef,
        memberStatus: members.memberStatus,
      })
      .from(idCards)
      .innerJoin(members, eq(idCards.memberId, members.id))
      .where(eq(idCards.verificationCode, cleanCode))
      .limit(1);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: "No AMTMP ID card was found matching this verification code.",
      });
    }

    const card = rows[0];

    if (card.status === "revoked" || card.memberStatus !== "active") {
      return res.json({
        success: true,
        valid: false,
        status: "revoked",
        message: "This AMTMP ID card is no longer valid.",
        verificationCode: card.verificationCode,
        associationName: "Association of Medical and Traditional Medicine Practitioners",
      });
    }

    return res.json({
      success: true,
      valid: true,
      status: "active",
      message: "Verified Official AMTMP Membership Card",
      associationName: "Association of Medical and Traditional Medicine Practitioners",
      fullName: card.fullName,
      registrationNumber: card.registrationNumber,
      verificationCode: card.verificationCode,
      issuedAt: card.issuedAt,
      passportPhotoRef: card.passportPhotoRef,
    });
  } catch (err) {
    next(err);
  }
});
