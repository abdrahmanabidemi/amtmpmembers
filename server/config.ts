import dotenv from "dotenv";

dotenv.config();

export function resolveDatabaseUrl(): string {
  const directCandidates = [
    process.env.NETLIFY_DB_URL,
    process.env.DATABASE_URL,
    process.env.NETLIFY_DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRESQL_URL,
    process.env.DB_URL,
  ];

  for (const candidate of directCandidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  // Check any environment variable containing DB_URL or DATABASE_URL that looks like a postgres URI
  for (const [key, value] of Object.entries(process.env)) {
    if (
      (key.includes("DB_URL") || key.includes("DATABASE_URL") || key.includes("POSTGRES")) &&
      typeof value === "string" &&
      value.startsWith("postgres")
    ) {
      return value.trim();
    }
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
