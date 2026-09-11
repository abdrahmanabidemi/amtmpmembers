import { Router } from "express";
import { eq, or } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { memberAccounts, members } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../auth/passwords.js";
import { createSession, deleteSession, setSessionCookie, clearSessionCookie, extractSessionId } from "../auth/session.js";
import { requireMember } from "../auth/middleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { photoUpload, validateImageMagicBytes } from "../services/fileUpload.js";

export const memberAuthRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public Member Registration
 * Creates a new practitioner account with PENDING membership status.
 * Strictly does NOT generate an AMTMP registration number or create an active member record.
 */
memberAuthRouter.post("/register", authRateLimiter, async (req, res, next) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // 1. Full name validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Please enter your full name.",
      });
    }

    // 2. Email format validation
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address.",
      });
    }

    // 3. Phone format validation
    if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid phone number.",
      });
    }

    // 4. Password validation
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long.",
      });
    }

    // 5. Password confirmation matching
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "The passwords do not match. Please enter them again.",
      });
    }

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const db = await getDb();

    // 6. Duplicate checks with clear, friendly user messages
    const existingEmail = await (db as any)
      .select()
      .from(memberAccounts)
      .where(eq(memberAccounts.email, cleanEmail))
      .limit(1);

    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        error: "An account with this email address is already registered.",
      });
    }

    const existingPhone = await (db as any)
      .select()
      .from(memberAccounts)
      .where(eq(memberAccounts.phone, cleanPhone))
      .limit(1);

    if (existingPhone && existingPhone.length > 0) {
      return res.status(400).json({
        success: false,
        error: "An account with this phone number is already registered.",
      });
    }

    // 7. Secure password hashing
    const passwordHash = await hashPassword(password);

    // 8. Insert record with strictly PENDING status and NO registration number
    const insertedRows = await (db as any)
      .insert(memberAccounts)
      .values({
        fullName: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        membershipStatus: "pending",
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const newAccount = insertedRows[0];

    return res.status(201).json({
      success: true,
      message: "Registration Successful. Your application has been received and is currently being reviewed by AMTMP.",
      account: {
        id: newAccount.id,
        fullName: newAccount.fullName,
        email: newAccount.email,
        phone: newAccount.phone,
        membershipStatus: newAccount.membershipStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Member Login
 * Strictly authenticates registered member accounts. Never admits administrator accounts.
 */
memberAuthRouter.post("/login", authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide both your email address and password.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const db = await getDb();

    // Query member account by email
    const accountRows = await (db as any)
      .select()
      .from(memberAccounts)
      .where(eq(memberAccounts.email, cleanEmail))
      .limit(1);

    // Uniform invalid credential message prevents account enumeration
    if (!accountRows || accountRows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "The email or password is incorrect. Please try again.",
      });
    }

    const account = accountRows[0];

    const isValid = await verifyPassword(password, account.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "The email or password is incorrect. Please try again.",
      });
    }

    // Query associated member profile if already approved
    const memberRows = await (db as any)
      .select()
      .from(members)
      .where(eq(members.memberAccountId, account.id))
      .limit(1);

    const memberProfile = memberRows && memberRows.length > 0 ? memberRows[0] : null;

    // Create secure member session
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const session = await createSession(db, "member_account", account.id, ip, userAgent);

    setSessionCookie(res, session.sessionId);

    return res.json({
      success: true,
      message: "Member login successful.",
      memberAccount: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        membershipStatus: account.membershipStatus,
        rejectionReason: account.rejectionReason,
      },
      member: memberProfile
        ? {
            id: memberProfile.id,
            fullName: memberProfile.fullName,
            registrationNumber: memberProfile.registrationNumber,
            memberStatus: memberProfile.memberStatus,
            approvalDate: memberProfile.approvalDate,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Member Logout
 */
memberAuthRouter.post("/logout", async (req, res, next) => {
  try {
    const sessionId = extractSessionId(req);
    if (sessionId) {
      const db = await getDb();
      await deleteSession(db, sessionId);
    }
    clearSessionCookie(res);
    return res.json({
      success: true,
      message: "You have been logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Current Member Profile & Application Status
 */
memberAuthRouter.get("/me", requireMember, async (req, res, next) => {
  try {
    const db = await getDb();
    const accountId = req.user!.id;

    const accountRows = await (db as any)
      .select()
      .from(memberAccounts)
      .where(eq(memberAccounts.id, accountId))
      .limit(1);

    if (!accountRows || accountRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Member account not found.",
      });
    }

    const account = accountRows[0];

    const memberRows = await (db as any)
      .select()
      .from(members)
      .where(eq(members.memberAccountId, accountId))
      .limit(1);

    const profile = memberRows.length > 0 ? memberRows[0] : null;

    return res.json({
      success: true,
      account: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        membershipStatus: account.membershipStatus,
        rejectionReason: account.rejectionReason,
        userType: "member_account",
      },
      member: profile
        ? {
            id: profile.id,
            fullName: profile.fullName,
            registrationNumber: profile.registrationNumber,
            memberStatus: profile.memberStatus,
            approvalDate: profile.approvalDate,
            passportPhotoRef: profile.passportPhotoRef,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Member Self-Service Profile Update
 * Members may update ONLY their email address and phone number.
 * Members CANNOT alter their full name, AMTMP registration number, or membership status.
 */
memberAuthRouter.put("/profile", requireMember, async (req, res, next) => {
  try {
    const accountId = req.user!.id;
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: "Please provide either an email address or phone number to update.",
      });
    }

    const db = await getDb();

    // Check account exists
    const accountRows = await (db as any)
      .select()
      .from(memberAccounts)
      .where(eq(memberAccounts.id, accountId))
      .limit(1);

    if (!accountRows || accountRows.length === 0) {
      return res.status(404).json({ success: false, error: "Member account not found." });
    }

    const updates: Record<string, any> = { updatedAt: new Date() };

    // Validate email if provided
    if (email !== undefined) {
      if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid email address.",
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      // Check for duplicate on other accounts
      const existingEmail = await (db as any)
        .select()
        .from(memberAccounts)
        .where(eq(memberAccounts.email, cleanEmail))
        .limit(1);

      if (existingEmail.length > 0 && existingEmail[0].id !== accountId) {
        return res.status(400).json({
          success: false,
          error: "An account with this email address is already registered.",
        });
      }

      updates.email = cleanEmail;
    }

    // Validate phone if provided
    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.trim().length < 7) {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid phone number (at least 7 digits).",
        });
      }

      const cleanPhone = phone.trim();
      const existingPhone = await (db as any)
        .select()
        .from(memberAccounts)
        .where(eq(memberAccounts.phone, cleanPhone))
        .limit(1);

      if (existingPhone.length > 0 && existingPhone[0].id !== accountId) {
        return res.status(400).json({
          success: false,
          error: "An account with this phone number is already registered.",
        });
      }

      updates.phone = cleanPhone;
    }

    const updatedAccountRows = await (db as any)
      .update(memberAccounts)
      .set(updates)
      .where(eq(memberAccounts.id, accountId))
      .returning();

    const updatedAccount = updatedAccountRows[0];

    return res.json({
      success: true,
      message: "Contact information updated successfully.",
      account: {
        id: updatedAccount.id,
        fullName: updatedAccount.fullName,
        email: updatedAccount.email,
        phone: updatedAccount.phone,
        membershipStatus: updatedAccount.membershipStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Member Self-Service Passport Photo Upload / Replacement
 * Only approved members can upload/replace their own passport photograph.
 * Enforces <= 2 MB size and binary magic bytes validation.
 */
memberAuthRouter.post(
  "/photo",
  requireMember,
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
      const accountId = req.user!.id;
      const db = await getDb();

      // Verify that this member is approved and active
      const memberRows = await (db as any)
        .select()
        .from(members)
        .where(eq(members.memberAccountId, accountId))
        .limit(1);

      if (!memberRows || memberRows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "Passport photographs can only be uploaded by approved association members.",
        });
      }

      const member = memberRows[0];
      if (member.memberStatus !== "active") {
        return res.status(403).json({
          success: false,
          error: "Your membership is not currently active.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Please select an image file to upload.",
        });
      }

      // Verify binary magic bytes on disk
      const isValid = validateImageMagicBytes(req.file.path);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid or corrupted image format. Please upload a genuine JPG or PNG photo.",
        });
      }

      const photoRef = `/uploads/passports/${req.file.filename}`;

      await (db as any)
        .update(members)
        .set({
          passportPhotoRef: photoRef,
          updatedAt: new Date(),
        })
        .where(eq(members.id, member.id));

      return res.json({
        success: true,
        message: "Passport photograph uploaded successfully.",
        passportPhotoRef: photoRef,
      });
    } catch (err) {
      next(err);
    }
  }
);
