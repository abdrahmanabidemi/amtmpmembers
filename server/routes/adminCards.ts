import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { idCards, members, memberAccounts } from "../db/schema.js";
import { requireAdmin } from "../auth/middleware.js";
import { issueMemberIdCard, revokeMemberIdCard, generateQrDataUri } from "../services/idCard.js";

export const adminCardsRouter = Router();

adminCardsRouter.use(requireAdmin);

/**
 * List all issued and historical ID cards
 */
adminCardsRouter.get("/", async (_req, res, next) => {
  try {
    const db = await getDb();

    const rows = await (db as any)
      .select({
        id: idCards.id,
        memberId: idCards.memberId,
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        passportPhotoRef: members.passportPhotoRef,
        email: memberAccounts.email,
        phone: memberAccounts.phone,
        cardToken: idCards.cardToken,
        verificationCode: idCards.verificationCode,
        status: idCards.status,
        issuedAt: idCards.issuedAt,
        revokedAt: idCards.revokedAt,
      })
      .from(idCards)
      .innerJoin(members, eq(idCards.memberId, members.id))
      .innerJoin(memberAccounts, eq(members.memberAccountId, memberAccounts.id))
      .orderBy(desc(idCards.issuedAt));

    return res.json({
      success: true,
      count: rows.length,
      cards: rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * List eligible approved members for ID card issuance
 */
adminCardsRouter.get("/eligible", async (_req, res, next) => {
  try {
    const db = await getDb();
    const rows = await (db as any)
      .select({
        id: members.id,
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        passportPhotoRef: members.passportPhotoRef,
        memberStatus: members.memberStatus,
      })
      .from(members)
      .where(eq(members.memberStatus, "active"))
      .orderBy(desc(members.createdAt));

    return res.json({
      success: true,
      members: rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Issue or Replace ID Card for a Member
 * Supports both POST /issue/:memberId and POST /issue (body: { memberId })
 */
adminCardsRouter.post(["/issue", "/issue/:memberId"], async (req, res, next) => {
  try {
    const rawId = req.params.memberId || req.body.memberId;
    if (!rawId || isNaN(parseInt(rawId, 10))) {
      return res.status(400).json({ success: false, error: "Please specify a valid member ID." });
    }

    const cleanMemberId = parseInt(rawId, 10);
    const db = await getDb();

    // Verify member is active and approved
    const memRows = await (db as any)
      .select()
      .from(members)
      .where(eq(members.id, cleanMemberId))
      .limit(1);

    if (!memRows || memRows.length === 0) {
      return res.status(404).json({ success: false, error: "Member not found." });
    }

    const member = memRows[0];
    if (member.memberStatus !== "active" || !member.registrationNumber) {
      return res.status(400).json({
        success: false,
        error: "Cannot issue ID card. Member must be active with an assigned AMTMP registration number.",
      });
    }

    // Issue card (automatically revoking any previous active card)
    const card = await issueMemberIdCard(db, member.id);

    // Generate QR code data URI pointing to the verification endpoint
    const verificationUrl = `/verify/${card.cardToken}`;
    const qrDataUri = await generateQrDataUri(verificationUrl);

    return res.status(201).json({
      success: true,
      message: `ID Card issued successfully for ${member.fullName}.`,
      card: {
        id: card.id,
        memberId: member.id,
        fullName: member.fullName,
        registrationNumber: member.registrationNumber,
        verificationCode: card.verificationCode,
        cardToken: card.cardToken,
        status: card.status,
        issuedAt: card.issuedAt,
        qrDataUri,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Revoke an ID Card
 */
adminCardsRouter.post("/:id/revoke", async (req, res, next) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    if (isNaN(cardId)) {
      return res.status(400).json({ success: false, error: "Invalid card ID." });
    }

    const db = await getDb();
    const revoked = await revokeMemberIdCard(db, cardId);

    if (!revoked) {
      return res.status(404).json({ success: false, error: "Card record not found." });
    }

    return res.json({
      success: true,
      message: `Card ${revoked.verificationCode} has been revoked. Any verification attempt will now report as invalid.`,
      card: revoked,
    });
  } catch (err) {
    next(err);
  }
});
