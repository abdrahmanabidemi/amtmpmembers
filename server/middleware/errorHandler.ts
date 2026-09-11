import type { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;

  // Log details on the server console for diagnostics without exposing to client
  console.error(`[Server Error] ${statusCode}:`, err.message || err);

  if (statusCode === 400) {
    return res.status(400).json({
      success: false,
      error: err.message || "The information provided was invalid. Please check and try again.",
    });
  }

  if (statusCode === 401) {
    return res.status(401).json({
      success: false,
      error: "Your session has expired. Please log in again.",
    });
  }

  if (statusCode === 403) {
    return res.status(403).json({
      success: false,
      error: "You do not have permission to perform this action.",
    });
  }

  // Generic 500 internal server error - never leak internal stack traces or database info
  return res.status(500).json({
    success: false,
    error: "An unexpected error occurred while processing your request. Please try again or contact AMTMP support.",
  });
}
