import { Router } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { config } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let dbStatus = "connected";
  try {
    const db = await getDb();
    if (typeof (db as any).execute === "function") {
      await (db as any).execute(sql`SELECT 1`);
    }
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const envKeys = Object.keys(process.env).filter(
    (k) => k.includes("NETLIFY") || k.includes("DB") || k.includes("POSTGRES") || k.includes("ADMIN")
  );

  return res.json({
    status: "healthy",
    system: "Association of Medical and Traditional Medicine Practitioners",
    abbreviation: "AMTMP",
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: dbStatus,
    diagnostics: {
      hasDatabaseUrl: Boolean(config.databaseUrl && config.databaseUrl.trim().length > 0),
      hasAdminInitialPassword: Boolean(config.adminInitialPassword && config.adminInitialPassword.trim().length > 0),
      detectedEnvKeys: envKeys,
    },
  });
});
