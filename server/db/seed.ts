import { eq } from "drizzle-orm";
import { getDb } from "./index.js";
import { administrators, memberAccounts, members, registrationSequences } from "./schema.js";
import { hashPassword } from "../auth/passwords.js";
import { config } from "../config.js";

export async function seedInitialData() {
  const db = await getDb();

  // 1. Seed initial Lead Administrator
  // Check if ANY administrator already exists in the system
  const allAdmins = await (db as any)
    .select({ id: administrators.id })
    .from(administrators)
    .limit(1);

  if (!allAdmins || allAdmins.length === 0) {
    const adminEmail = "admin@amtmp.org";
    const initialPassword = (config.adminInitialPassword || "").trim();

    if (!initialPassword) {
      if (config.isProduction) {
        throw new Error(
          "[Security Error] ADMIN_INITIAL_PASSWORD environment variable is required to create the initial administrator in production."
        );
      }
      console.warn(
        "[Security Warning] No administrator exists and ADMIN_INITIAL_PASSWORD is not set. Skipping administrator creation."
      );
    } else {
      if (initialPassword.length < 8) {
        throw new Error("[Security Error] ADMIN_INITIAL_PASSWORD must be at least 8 characters long.");
      }

      const adminPasswordHash = await hashPassword(initialPassword);
      await (db as any).insert(administrators).values({
        name: "AMTMP Lead Administrator",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        accountStatus: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[Seed] Created initial administrator: ${adminEmail} using ADMIN_INITIAL_PASSWORD`);
    }
  }

  // 2. Seed initial Approved Member Account
  const memberEmail = "member@amtmp.org";
  const existingMembers = await (db as any)
    .select()
    .from(memberAccounts)
    .where(eq(memberAccounts.email, memberEmail))
    .limit(1);

  if (!existingMembers || existingMembers.length === 0) {
    const memberPasswordHash = await hashPassword("MemberPassword2026!");
    const insertedAccount = await (db as any)
      .insert(memberAccounts)
      .values({
        fullName: "Dr. Adebayo Ogunleye",
        email: memberEmail,
        phone: "+2348012345678",
        passwordHash: memberPasswordHash,
        membershipStatus: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const accountId = insertedAccount[0].id;

    // Seed associated approved Member record with registration number
    await (db as any).insert(members).values({
      memberAccountId: accountId,
      fullName: "Dr. Adebayo Ogunleye",
      registrationNumber: "AMTMP-26-0001",
      approvalDate: new Date(),
      memberStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Initialize sequence tracker for 26
    await (db as any)
      .insert(registrationSequences)
      .values({
        year: 26,
        lastSequence: 1,
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    console.log("[Seed] Created default approved member: member@amtmp.org / MemberPassword2026!");
  }

  // 3. Seed sample Rejected Member Account for testing dashboard rejected state
  const rejectedEmail = "rejected@amtmp.org";
  const existingRejected = await (db as any)
    .select()
    .from(memberAccounts)
    .where(eq(memberAccounts.email, rejectedEmail))
    .limit(1);

  if (!existingRejected || existingRejected.length === 0) {
    const rejectedPwHash = await hashPassword("MemberPassword2026!");
    await (db as any).insert(memberAccounts).values({
      fullName: "Mr. Samuel Kalu",
      email: rejectedEmail,
      phone: "+2348098765432",
      passwordHash: rejectedPwHash,
      membershipStatus: "rejected",
      rejectionReason: "Incomplete practitioner documentation submitted. Please contact the AMTMP secretariat.",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("[Seed] Created sample rejected member: rejected@amtmp.org");
  }
}

// Allow direct CLI execution
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  seedInitialData()
    .then(() => {
      console.log("[Seed] Seeding completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Seed] Failed:", err);
      process.exit(1);
    });
}
