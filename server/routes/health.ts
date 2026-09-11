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

  return res.json({
    status: "healthy",
    system: "Association of Medical and Traditional Medicine Practitioners",
    abbreviation: "AMTMP",
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: dbStatus,
  });
});
