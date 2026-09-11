import rateLimit from "express-rate-limit";

/**
 * Rate limiter for authentication routes (login / credential verification)
 * Helps mitigate automated credential-stuffing and brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many login attempts. For security reasons, please try again in a few minutes.",
  },
});
