import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { members, idCards } from "../db/schema.js";
import { requireMember } from "../auth/middleware.js";
import { generateQrDataUri } from "../services/idCard.js";

export const memberCardsRouter = Router();

memberCardsRouter.use(requireMember);

/**
 * Get the Logged-in Member's Official ID Card
 * Only accessible after administrator has explicitly issued the card.
 */
memberCardsRouter.get("/", async (req, res, next) => {
  try {
    const accountId = req.user!.id;
    const db = await getDb();

    // 1. Get member record
    const memRows = await (db as any)
      .select()
      .from(members)
      .where(eq(members.memberAccountId, accountId))
      .limit(1);

    if (!memRows || memRows.length === 0) {
      return res.json({
        success: true,
        hasCard: false,
        card: null,
        message: "Your application is still under review. No member record exists yet.",
      });
    }

    const member = memRows[0];

    // 2. Query active issued card for this member
    const cardRows = await (db as any)
      .select()
      .from(idCards)
      .where(and(eq(idCards.memberId, member.id), eq(idCards.status, "active")))
      .orderBy(desc(idCards.issuedAt))
      .limit(1);

    if (!cardRows || cardRows.length === 0) {
      return res.json({
        success: true,
        hasCard: false,
        card: null,
        message: "Your membership card has not yet been issued by AMTMP.",
      });
    }

    const card = cardRows[0];
    const verificationUrl = `/verify/${card.cardToken}`;
    const qrDataUri = await generateQrDataUri(verificationUrl);

    return res.json({
      success: true,
      hasCard: true,
      card: {
        id: card.id,
        fullName: member.fullName,
        registrationNumber: member.registrationNumber,
        passportPhotoRef: member.passportPhotoRef,
        verificationCode: card.verificationCode,
        cardToken: card.cardToken,
        issuedAt: card.issuedAt,
        status: card.status,
        qrDataUri,
        associationName: "ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS",
      },
      member: {
        id: member.id,
        fullName: member.fullName,
        registrationNumber: member.registrationNumber,
        passportPhotoRef: member.passportPhotoRef,
        status: member.memberStatus,
      },
      qrCodeDataUrl: qrDataUri,
    });
  } catch (err) {
    next(err);
  }
});
