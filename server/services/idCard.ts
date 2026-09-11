import crypto from "crypto";
import QRCode from "qrcode";
import { eq, and } from "drizzle-orm";
import { idCards } from "../db/schema.js";
import type { AppDatabase } from "../db/index.js";

/**
 * Generates an unpredictable 32-byte cryptographic token for QR verification URL.
 */
export function generateCardToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Generates a human-readable card verification code.
 * Example format: V-8F4K-92XQ-71
 */
export function generateVerificationCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Omitting ambiguous 0, 1, I, O
  const getRandomPart = (len: number) => {
    let res = "";
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      res += chars[bytes[i] % chars.length];
    }
    return res;
  };

  return `V-${getRandomPart(4)}-${getRandomPart(4)}-${getRandomPart(2)}`;
}

/**
 * Generates a base64 Data URI containing the QR code image.
 */
export async function generateQrDataUri(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 220,
    margin: 1,
    color: {
      dark: "#0e623a",
      light: "#ffffff",
    },
  });
}

/**
 * Issues or reissues an ID card for an approved member.
 * Automatically marks any existing active cards for this member as revoked.
 */
export async function issueMemberIdCard(db: AppDatabase, memberId: number) {
  // 1. Revoke any currently active cards for this member
  await (db as any)
    .update(idCards)
    .set({
      status: "revoked",
      revokedAt: new Date(),
    })
    .where(and(eq(idCards.memberId, memberId), eq(idCards.status, "active")));

  // 2. Generate unique token and code
  const cardToken = generateCardToken();
  const verificationCode = generateVerificationCode();

  // 3. Insert new active card record
  const inserted = await (db as any)
    .insert(idCards)
    .values({
      memberId,
      cardToken,
      verificationCode,
      status: "active",
      issuedAt: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return inserted[0];
}

/**
 * Explicitly revokes an issued card.
 */
export async function revokeMemberIdCard(db: AppDatabase, cardId: number) {
  const updated = await (db as any)
    .update(idCards)
    .set({
      status: "revoked",
      revokedAt: new Date(),
    })
    .where(eq(idCards.id, cardId))
    .returning();

  return updated[0] || null;
}
