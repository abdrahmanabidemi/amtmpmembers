import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Administrators Table
 * Stores credentials and administrative metadata for AMTMP system admins.
 */
export const administrators = pgTable(
  "administrators",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    accountStatus: text("account_status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    adminEmailIdx: uniqueIndex("admin_email_idx").on(table.email),
  })
);

/**
 * Member Accounts Table
 * Handles applicant and member login credentials, contact info, and status lifecycle.
 */
export const memberAccounts = pgTable(
  "member_accounts",
  {
    id: serial("id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").unique(),
    passwordHash: text("password_hash").notNull(),
    membershipStatus: text("membership_status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected' | 'inactive'
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    memberEmailIdx: uniqueIndex("member_account_email_idx").on(table.email),
    memberPhoneIdx: uniqueIndex("member_account_phone_idx").on(table.phone),
  })
);

/**
 * Members Table
 * Represents approved/registered AMTMP members holding formal profile and registration number.
 */
export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    memberAccountId: integer("member_account_id")
      .references(() => memberAccounts.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    registrationNumber: text("registration_number").unique(), // Null until approved
    fullName: text("full_name").notNull(),
    passportPhotoRef: text("passport_photo_ref"),
    approvalDate: timestamp("approval_date", { withTimezone: true }),
    memberStatus: text("member_status").notNull().default("active"), // 'active' | 'inactive' | 'suspended' | 'deceased'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    memberAccountRefIdx: uniqueIndex("member_account_ref_idx").on(table.memberAccountId),
    memberRegNumIdx: uniqueIndex("member_reg_num_idx").on(table.registrationNumber),
  })
);

/**
 * Sessions Table
 * Secure server-side session store tracking authentication tokens for Admins & Member Accounts.
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // Cryptographically random session token (hex/base64)
  userType: text("user_type").notNull(), // 'admin' | 'member_account'
  userId: integer("user_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Registration Sequences Table
 * Concurrency-safe atomic counter for AMTMP registration numbers: AMTMP-YY-XXXX.
 */
export const registrationSequences = pgTable("registration_sequences", {
  year: integer("year").primaryKey(),
  lastSequence: integer("last_sequence").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * ID Cards Table
 * Tracks official physical membership ID cards issued to approved AMTMP members.
 */
export const idCards = pgTable(
  "id_cards",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .references(() => members.id, { onDelete: "cascade" })
      .notNull(),
    cardToken: text("card_token").notNull().unique(), // Secure unguessable token for QR verification
    verificationCode: text("verification_code").notNull().unique(), // Human-readable e.g. V-8F4K-92XQ-71
    status: text("status").notNull().default("active"), // 'active' | 'revoked'
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    cardTokenIdx: uniqueIndex("card_token_idx").on(table.cardToken),
    cardVerificationCodeIdx: uniqueIndex("card_verification_code_idx").on(table.verificationCode),
  })
);

/**
 * Monthly Dues Table
 * Lightweight monthly dues ledger tracking payments for active approved AMTMP members.
 */
export const monthlyDues = pgTable(
  "monthly_dues",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .references(() => members.id, { onDelete: "cascade" })
      .notNull(),
    month: integer("month").notNull(), // 1 to 12
    year: integer("year").notNull(),
    amount: integer("amount").notNull().default(5000), // Standard association monthly dues in Naira/currency unit
    paymentStatus: text("payment_status").notNull().default("unpaid"), // 'paid' | 'unpaid'
    paymentDate: timestamp("payment_date", { withTimezone: true }),
    notes: text("notes"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    memberMonthYearIdx: uniqueIndex("member_month_year_idx").on(table.memberId, table.month, table.year),
  })
);

// Type exports
export type Administrator = typeof administrators.$inferSelect;
export type NewAdministrator = typeof administrators.$inferInsert;

export type MemberAccount = typeof memberAccounts.$inferSelect;
export type NewMemberAccount = typeof memberAccounts.$inferInsert;

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type SessionRecord = typeof sessions.$inferSelect;
export type NewSessionRecord = typeof sessions.$inferInsert;

export type IdCard = typeof idCards.$inferSelect;
export type NewIdCard = typeof idCards.$inferInsert;

export type MonthlyDue = typeof monthlyDues.$inferSelect;
export type NewMonthlyDue = typeof monthlyDues.$inferInsert;
