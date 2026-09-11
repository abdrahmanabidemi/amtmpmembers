import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { config } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { adminAuthRouter } from "./routes/adminAuth.js";
import { memberAuthRouter } from "./routes/memberAuth.js";
import { publicMembersRouter } from "./routes/publicMembers.js";
import { adminApplicationsRouter } from "./routes/adminApplications.js";
import { adminMembersRouter } from "./routes/adminMembers.js";
import { adminCardsRouter } from "./routes/adminCards.js";
import { adminDuesRouter } from "./routes/adminDues.js";
import { adminExportImportRouter } from "./routes/adminExportImport.js";
import { publicVerificationRouter } from "./routes/publicVerification.js";
import { memberCardsRouter } from "./routes/memberCards.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  // Basic Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Vite SPA assets in development
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows static passport photo serving
    })
  );

  // Cross-Origin Resource Sharing with credential support
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  // Body and cookie parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Static uploads directory for passport photos
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // API Routes
  app.use("/api/health", healthRouter);
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/member/auth", memberAuthRouter);
  app.use("/api/members", publicMembersRouter);

  // Step 3 Admin Platforms
  app.use("/api/admin/applications", adminApplicationsRouter);
  app.use("/api/admin/members", adminMembersRouter);
  app.use("/api/admin/cards", adminCardsRouter);
  app.use("/api/admin/dues", adminDuesRouter);
  app.use("/api/admin/export", adminExportImportRouter);
  app.use("/api/admin/import", adminExportImportRouter);

  // Step 3 Public Verification & Member Cards
  app.use("/api/verify", publicVerificationRouter);
  app.use("/api/member/card", memberCardsRouter);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
