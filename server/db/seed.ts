import { eq } from "drizzle-orm";
import { getDb } from "./index.js";
import { administrators, memberAccounts, members, registrationSequences } from "./schema.js";
import { hashPassword } from "../auth/passwords.js";

export async function seedInitialData() {
  const db = await getDb();

  // 1. Seed initial Lead Administrator
  const adminEmail = "admin@amtmp.org";
  const existingAdmins = await (db as any)
    .select()
    .from(administrators)
    .where(eq(administrators.email, adminEmail))
    .limit(1);

  if (!existingAdmins || existingAdmins.length === 0) {
    const adminPasswordHash = await hashPassword("AdminPassword2026!");
    await (db as any).insert(administrators).values({
      name: "AMTMP Lead Administrator",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      accountStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("[Seed] Created default administrator: admin@amtmp.org / AdminPassword2026!");
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
