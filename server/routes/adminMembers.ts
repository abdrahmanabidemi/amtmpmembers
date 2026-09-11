import { Router } from "express";
import { eq, or, ilike, and, desc } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { members, memberAccounts, idCards } from "../db/schema.js";
import { requireAdmin } from "../auth/middleware.js";
import { generateNextRegistrationNumber } from "../services/registrationNumber.js";
import { hashPassword } from "../auth/passwords.js";
import { photoUpload, validateImageMagicBytes } from "../services/fileUpload.js";

export const adminMembersRouter = Router();

adminMembersRouter.use(requireAdmin);

/**
 * List Members with search and status filtering
 */
adminMembersRouter.get("/", async (req, res, next) => {
  try {
    const search = ((req.query.q as string) || (req.query.search as string) || "").trim();
    const statusFilter = (req.query.status as string) || "all";

    const db = await getDb();

    let query = (db as any)
      .select({
        id: members.id,
        memberAccountId: members.memberAccountId,
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        memberStatus: members.memberStatus,
        approvalDate: members.approvalDate,
        passportPhotoRef: members.passportPhotoRef,
        email: memberAccounts.email,
        phone: memberAccounts.phone,
        createdAt: members.createdAt,
      })
      .from(members)
      .innerJoin(memberAccounts, eq(members.memberAccountId, memberAccounts.id));

    const conditions = [];

    if (statusFilter !== "all") {
      conditions.push(eq(members.memberStatus, statusFilter));
    }

    if (search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(members.fullName, term),
          ilike(members.registrationNumber, term),
          ilike(memberAccounts.email, term),
          ilike(memberAccounts.phone, term)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(members.createdAt));

    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "20", 10)));
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const pagedRows = rows.slice(offset, offset + limit);

    return res.json({
      success: true,
      count: total,
      members: pagedRows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Get Single Member Details
 */
adminMembersRouter.get("/:id", async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) {
      return res.status(400).json({ success: false, error: "Invalid member ID." });
    }

    const db = await getDb();
    const rows = await (db as any)
      .select({
        id: members.id,
        memberAccountId: members.memberAccountId,
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        memberStatus: members.memberStatus,
        approvalDate: members.approvalDate,
        passportPhotoRef: members.passportPhotoRef,
        email: memberAccounts.email,
        phone: memberAccounts.phone,
        createdAt: members.createdAt,
      })
      .from(members)
      .innerJoin(memberAccounts, eq(members.memberAccountId, memberAccounts.id))
      .where(eq(members.id, memberId))
      .limit(1);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Member not found." });
    }

    const member = rows[0];

    // Fetch active ID card if any
    const cards = await (db as any)
      .select()
      .from(idCards)
      .where(eq(idCards.memberId, member.id))
      .orderBy(desc(idCards.createdAt));

    return res.json({
      success: true,
      member,
      cards,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Admin Manual Member Creation
 * Directly creates an approved active member and immediately generates their AMTMP registration number.
 */
adminMembersRouter.post("/", async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, error: "Please provide a valid full name." });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: "Please provide a valid email address." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanName = fullName.trim();

    const db = await getDb();

    // Prevent duplicate email
    const existingEmail = await (db as any)
      .select()
      .from(memberAccounts)
      .where(eq(memberAccounts.email, cleanEmail))
      .limit(1);

    if (existingEmail.length > 0) {
      return res.status(400).json({ success: false, error: "An account with this email address already exists." });
    }

    // Prevent duplicate phone if provided
    if (cleanPhone) {
      const existingPhone = await (db as any)
        .select()
        .from(memberAccounts)
        .where(eq(memberAccounts.phone, cleanPhone))
        .limit(1);

      if (existingPhone.length > 0) {
        return res.status(400).json({ success: false, error: "An account with this phone number already exists." });
      }
    }

    // Default password if not provided
    const rawPassword = password && password.length >= 8 ? password : "AmtmpMember2026!";
    const passwordHash = await hashPassword(rawPassword);

    // 1. Create approved member account
    const accRows = await (db as any)
      .insert(memberAccounts)
      .values({
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        membershipStatus: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const account = accRows[0];

    // 2. Concurrency-safe atomic generation of AMTMP registration number
    const regNumResult = await generateNextRegistrationNumber(db);
    const regNumber = regNumResult.registrationNumber;

    // 3. Create active member profile
    const memRows = await (db as any)
      .insert(members)
      .values({
        memberAccountId: account.id,
        fullName: cleanName,
        registrationNumber: regNumber,
        approvalDate: new Date(),
        memberStatus: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const member = memRows[0];

    return res.status(201).json({
      success: true,
      message: `Member created successfully with registration number ${regNumber}.`,
      member: {
        id: member.id,
        fullName: member.fullName,
        registrationNumber: member.registrationNumber,
        email: account.email,
        phone: account.phone,
        memberStatus: member.memberStatus,
        approvalDate: member.approvalDate,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Edit Member Profile
 */
adminMembersRouter.put("/:id", async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) {
      return res.status(400).json({ success: false, error: "Invalid member ID." });
    }

    const { fullName, phone, memberStatus } = req.body;
    const db = await getDb();

    const memRows = await (db as any)
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!memRows || memRows.length === 0) {
      return res.status(404).json({ success: false, error: "Member not found." });
    }

    const member = memRows[0];

    // Update members table
    const updateMemberData: any = { updatedAt: new Date() };
    if (fullName && typeof fullName === "string" && fullName.trim().length >= 2) {
      updateMemberData.fullName = fullName.trim();
    }
    if (memberStatus && ["active", "inactive", "suspended", "deceased"].includes(memberStatus)) {
      updateMemberData.memberStatus = memberStatus;
    }

    await (db as any).update(members).set(updateMemberData).where(eq(members.id, memberId));

    // Update member_accounts table
    const updateAccountData: any = { updatedAt: new Date() };
    if (updateMemberData.fullName) {
      updateAccountData.fullName = updateMemberData.fullName;
    }
    if (phone !== undefined) {
      updateAccountData.phone = phone ? String(phone).trim() : null;
    }

    await (db as any)
      .update(memberAccounts)
      .set(updateAccountData)
      .where(eq(memberAccounts.id, member.memberAccountId));

    return res.json({
      success: true,
      message: "Member profile updated successfully.",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Deactivate Member
 * Prefers deactivation over permanent deletion, preserving historical registration records.
 */
adminMembersRouter.post("/:id/deactivate", async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) {
      return res.status(400).json({ success: false, error: "Invalid member ID." });
    }

    const db = await getDb();
    const updated = await (db as any)
      .update(members)
      .set({
        memberStatus: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, error: "Member not found." });
    }

    return res.json({
      success: true,
      message: `Member ${updated[0].fullName} deactivated. Historical registration number ${updated[0].registrationNumber} is preserved.`,
      member: updated[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Upload Passport Photograph
 * Enforces <= 2 MB size and JPG/PNG validation.
 */
adminMembersRouter.post(
  "/:id/photo",
  (req, res, next) => {
    photoUpload.single("photo")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "File size exceeds 2 MB limit. Please upload an image under 2 MB.",
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message || "Invalid image upload. Only JPG and PNG are accepted.",
        });
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      const memberId = parseInt(req.params.id, 10);
      if (isNaN(memberId)) {
        return res.status(400).json({ success: false, error: "Invalid member ID." });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: "Please select an image file to upload." });
      }

      // Verify binary magic bytes on disk
      const isValid = validateImageMagicBytes(req.file.path);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid or corrupted image format. Please upload a genuine JPG or PNG photo.",
        });
      }

      const db = await getDb();
      const photoRef = `/uploads/passports/${req.file.filename}`;

      const updated = await (db as any)
        .update(members)
        .set({
          passportPhotoRef: photoRef,
          updatedAt: new Date(),
        })
        .where(eq(members.id, memberId))
        .returning();

      if (!updated || updated.length === 0) {
        return res.status(404).json({ success: false, error: "Member not found." });
      }

      return res.json({
        success: true,
        message: "Passport photograph uploaded successfully.",
        passportPhotoRef: photoRef,
      });
    } catch (err: any) {
      next(err);
    }
  }
);
