import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import multer from "multer";
import { getDb } from "../db/index.js";
import { members, memberAccounts, monthlyDues } from "../db/schema.js";
import { requireAdmin } from "../auth/middleware.js";
import { generateCsv, parseCsv } from "../services/csv.js";
import { generateNextRegistrationNumber } from "../services/registrationNumber.js";
import { hashPassword } from "../auth/passwords.js";

export const adminExportImportRouter = Router();

adminExportImportRouter.use(requireAdmin);

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB CSV limit

/**
 * Export Active Members as Excel-compatible CSV
 */
adminExportImportRouter.get("/members", async (_req, res, next) => {
  try {
    const db = await getDb();
    const rows = await (db as any)
      .select({
        registrationNumber: members.registrationNumber,
        fullName: members.fullName,
        email: memberAccounts.email,
        phone: memberAccounts.phone,
        memberStatus: members.memberStatus,
        approvalDate: members.approvalDate,
      })
      .from(members)
      .innerJoin(memberAccounts, eq(members.memberAccountId, memberAccounts.id))
      .orderBy(desc(members.createdAt));

    const columns = [
      { key: "registrationNumber", label: "AMTMP Registration Number" },
      { key: "fullName", label: "Full Legal Name" },
      { key: "email", label: "Email Address" },
      { key: "phone", label: "Phone Number" },
      { key: "memberStatus", label: "Membership Standing" },
      { key: "approvalDate", label: "Approval Date" },
    ];

    const formattedRows = rows.map((r: any) => ({
      ...r,
      approvalDate: r.approvalDate ? new Date(r.approvalDate).toISOString().split("T")[0] : "",
    }));

    const csvContent = generateCsv(columns, formattedRows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="AMTMP_Active_Members.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

/**
 * Export Applications as Excel-compatible CSV
 */
adminExportImportRouter.get("/applications", async (req, res, next) => {
  try {
    const statusFilter = (req.query.status as string) || "all";
    const db = await getDb();

    let query = (db as any).select().from(memberAccounts);
    if (statusFilter !== "all") {
      query = query.where(eq(memberAccounts.membershipStatus, statusFilter));
    }

    const rows = await query.orderBy(desc(memberAccounts.createdAt));

    const columns = [
      { key: "id", label: "Application ID" },
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email Address" },
      { key: "phone", label: "Phone Number" },
      { key: "membershipStatus", label: "Application Status" },
      { key: "rejectionReason", label: "Rejection Reason" },
      { key: "createdAt", label: "Submission Date" },
    ];

    const formattedRows = rows.map((r: any) => ({
      ...r,
      rejectionReason: r.rejectionReason || "",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
    }));

    const csvContent = generateCsv(columns, formattedRows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="AMTMP_Membership_Applications.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

/**
 * Export Monthly Dues as Excel-compatible CSV
 */
adminExportImportRouter.get("/dues", async (_req, res, next) => {
  try {
    const db = await getDb();
    const rows = await (db as any)
      .select({
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        email: memberAccounts.email,
        month: monthlyDues.month,
        year: monthlyDues.year,
        amount: monthlyDues.amount,
        paymentStatus: monthlyDues.paymentStatus,
        paymentDate: monthlyDues.paymentDate,
        notes: monthlyDues.notes,
      })
      .from(monthlyDues)
      .innerJoin(members, eq(monthlyDues.memberId, members.id))
      .innerJoin(memberAccounts, eq(members.memberAccountId, memberAccounts.id))
      .orderBy(desc(monthlyDues.year), desc(monthlyDues.month));

    const columns = [
      { key: "fullName", label: "Member Full Name" },
      { key: "registrationNumber", label: "Registration Number" },
      { key: "email", label: "Email Address" },
      { key: "period", label: "Billing Period (MM/YYYY)" },
      { key: "amount", label: "Amount (NGN)" },
      { key: "paymentStatus", label: "Status" },
      { key: "paymentDate", label: "Payment Date" },
      { key: "notes", label: "Administrative Notes" },
    ];

    const formattedRows = rows.map((r: any) => ({
      ...r,
      period: `${String(r.month).padStart(2, "0")}/${r.year}`,
      paymentDate: r.paymentDate ? new Date(r.paymentDate).toISOString().split("T")[0] : "",
      notes: r.notes || "",
    }));

    const csvContent = generateCsv(columns, formattedRows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="AMTMP_Monthly_Dues.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

/**
 * Import Members from CSV
 */
adminExportImportRouter.post("/members", upload.single("file"), async (req, res, next) => {
  try {
    let csvText = "";

    if (req.file) {
      csvText = req.file.buffer ? req.file.buffer.toString("utf8") : "";
    } else if (req.body.csvText) {
      csvText = String(req.body.csvText);
    } else {
      return res.status(400).json({ success: false, error: "Please upload a CSV file or provide csvText." });
    }

    if (!csvText.trim()) {
      return res.status(400).json({ success: false, error: "The provided CSV file is empty." });
    }

    const records = parseCsv(csvText);
    if (records.length === 0) {
      return res.status(400).json({ success: false, error: "No data records found in CSV file." });
    }

    const db = await getDb();

    let totalProcessed = 0;
    let added = 0;
    let duplicatesSkipped = 0;
    let invalidRecords = 0;
    const errors: string[] = [];

    const defaultPasswordHash = await hashPassword("AmtmpMember2026!");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const record of records) {
      totalProcessed++;

      // Support flexible header variations (e.g. fullname, full name, name)
      const name =
        record["fullname"] ||
        record["fulllegalname"] ||
        record["name"] ||
        record["membername"] ||
        "";

      const email = record["email"] || record["emailaddress"] || "";
      const phone = record["phone"] || record["phonenumber"] || record["telephone"] || "";

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim();

      // Validate required fields
      if (!cleanName || cleanName.length < 2 || !cleanEmail || !emailRegex.test(cleanEmail)) {
        invalidRecords++;
        errors.push(`Row ${totalProcessed}: Missing or invalid name/email (${cleanName || "No name"}, ${cleanEmail || "No email"}).`);
        continue;
      }

      // Duplicate checks
      const existingEmail = await (db as any)
        .select()
        .from(memberAccounts)
        .where(eq(memberAccounts.email, cleanEmail))
        .limit(1);

      if (existingEmail.length > 0) {
        duplicatesSkipped++;
        continue;
      }

      if (cleanPhone) {
        const existingPhone = await (db as any)
          .select()
          .from(memberAccounts)
          .where(eq(memberAccounts.phone, cleanPhone))
          .limit(1);

        if (existingPhone.length > 0) {
          duplicatesSkipped++;
          continue;
        }
      }

      // Generate next registration number
      const regNumResult = await generateNextRegistrationNumber(db);
      const regNumber = regNumResult.registrationNumber;

      // Insert account
      const accRows = await (db as any)
        .insert(memberAccounts)
        .values({
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone || null,
          passwordHash: defaultPasswordHash,
          membershipStatus: "approved",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const account = accRows[0];

      // Insert member
      await (db as any).insert(members).values({
        memberAccountId: account.id,
        fullName: cleanName,
        registrationNumber: regNumber,
        approvalDate: new Date(),
        memberStatus: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      added++;
    }

    return res.json({
      success: true,
      message: `Import complete: ${totalProcessed} records processed, ${added} members added, ${duplicatesSkipped} duplicates skipped, ${invalidRecords} invalid records.`,
      summary: {
        totalProcessed,
        added,
        duplicatesSkipped,
        invalidRecords,
        errors: errors.slice(0, 5), // Return first 5 errors if any
      },
    });
  } catch (err) {
    next(err);
  }
});
