import dotenv from "dotenv";

dotenv.config();

export function resolveDatabaseUrl(): string {
  if (process.env.NETLIFY_DB_URL && process.env.NETLIFY_DB_URL.trim().length > 0) {
    return process.env.NETLIFY_DB_URL.trim();
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return process.env.DATABASE_URL.trim();
  }
  if (process.env.NETLIFY_DATABASE_URL && process.env.NETLIFY_DATABASE_URL.trim().length > 0) {
    return process.env.NETLIFY_DATABASE_URL.trim();
  }
  if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim().length > 0) {
    return process.env.POSTGRES_URL.trim();
  }

  return "";
}

export const config = {
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "5000", 10),
  get databaseUrl(): string {
    return resolveDatabaseUrl();
  },
  sessionSecret: process.env.SESSION_SECRET || "amtmp_fallback_dev_secret_32_chars_long_minimum",
  adminInitialPassword: process.env.ADMIN_INITIAL_PASSWORD || "",
  cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  sessionCookieName: "amtmp_session_id",
};
