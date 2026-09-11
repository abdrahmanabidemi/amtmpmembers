import { Router } from "express";
import { and, eq, ilike, or, isNotNull } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { members, memberAccounts } from "../db/schema.js";

export const publicMembersRouter = Router();

/**
 * Public Member Search
 * Read-only endpoint allowing the public to verify active, approved AMTMP practitioners.
 * Strictly filters out pending, rejected, or inactive accounts and exposes ONLY public fields.
 */
publicMembersRouter.get("/search", async (req, res, next) => {
  try {
    const rawQuery = req.query.q;

    if (!rawQuery || typeof rawQuery !== "string") {
      return res.status(400).json({
        success: false,
        error: "Please enter a practitioner name or AMTMP registration number to search.",
      });
    }

    const searchTerm = rawQuery.trim();

    if (searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Please enter at least 2 characters to search.",
      });
    }

    const db = await getDb();
    const searchPattern = `%${searchTerm}%`;

    // Query members joined with member_accounts
    // Strictly require:
    // 1. member_accounts.membership_status = 'approved'
    // 2. members.member_status = 'active'
    // 3. members.registration_number IS NOT NULL
    // 4. fullName matches OR registrationNumber matches (case-insensitive)
    const matchedRows = await (db as any)
      .select({
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        memberStatus: members.memberStatus,
      })
      .from(members)
      .innerJoin(memberAccounts, eq(members.memberAccountId, memberAccounts.id))
      .where(
        and(
          eq(memberAccounts.membershipStatus, "approved"),
          eq(members.memberStatus, "active"),
          isNotNull(members.registrationNumber),
          or(
            ilike(members.fullName, searchPattern),
            ilike(members.registrationNumber, searchPattern)
          )
        )
      )
      .limit(50);

    return res.json({
      success: true,
      query: searchTerm,
      count: matchedRows.length,
      members: matchedRows, // ONLY public fields: fullName, registrationNumber, memberStatus
    });
  } catch (err) {
    next(err);
  }
});
