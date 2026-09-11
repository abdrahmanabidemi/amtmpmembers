import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema.js";
import { config } from "../config.js";

const { Pool } = pg;

export type AppDatabase = ReturnType<typeof drizzleNodePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

let dbInstance: AppDatabase | null = null;
let pgliteInstance: PGlite | null = null;
let poolInstance: pg.Pool | null = null;

export async function getDb(): Promise<AppDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (config.databaseUrl && config.databaseUrl.trim().length > 0) {
    poolInstance = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
      max: config.isProduction ? 1 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    // Ensure all tables and constraints exist on target database
    await initPostgresSchema(poolInstance);
    dbInstance = drizzleNodePg(poolInstance, { schema });
    return dbInstance;
  }

  // Fallback to embedded PGlite for self-contained testing and zero-setup local dev
  if (!pgliteInstance) {
    pgliteInstance = new PGlite();
    // Initialize schema tables if running on PGlite
    await initPostgresSchema(pgliteInstance);
  }
  dbInstance = drizzlePglite(pgliteInstance, { schema });
  return dbInstance;
}

export async function initPostgresSchema(client: { query?: (...args: any[]) => Promise<any>; exec?: (sql: string) => Promise<any> }) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS administrators (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      account_status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS member_accounts (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      membership_status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      member_account_id INTEGER NOT NULL UNIQUE REFERENCES member_accounts(id) ON DELETE CASCADE,
      registration_number TEXT UNIQUE,
      full_name TEXT NOT NULL,
      passport_photo_ref TEXT,
      approval_date TIMESTAMPTZ,
      member_status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_type TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS registration_sequences (
      year INTEGER PRIMARY KEY,
      last_sequence INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS id_cards (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      card_token TEXT NOT NULL UNIQUE,
      verification_code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS monthly_dues (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      amount INTEGER NOT NULL DEFAULT 5000,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_date TIMESTAMPTZ,
      notes TEXT,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (member_id, month, year)
    );
  `;

  if (typeof client.exec === "function") {
    await client.exec(ddl);
  } else if (typeof client.query === "function") {
    await client.query(ddl);
  }
}

// Alias for backward compatibility
export const initPgliteSchema = initPostgresSchema;

export { schema };
