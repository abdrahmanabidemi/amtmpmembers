import { getDb } from "./index.js";
import { seedInitialData } from "./seed.js";

async function main() {
  console.log("[Migration] Initializing database schema...");
  await getDb();
  console.log("[Migration] Database schema ready.");
  console.log("[Migration] Seeding initial baseline data...");
  await seedInitialData();
  console.log("[Migration] Done!");
}

main().catch((err) => {
  console.error("[Migration Error]:", err);
  process.exit(1);
});
