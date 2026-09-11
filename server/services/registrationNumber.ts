import { eq, sql } from "drizzle-orm";
import { registrationSequences } from "../db/schema.js";
import type { AppDatabase } from "../db/index.js";

export const REGISTRATION_PREFIX = "AMTMP";
export const SEQUENCE_PAD_LENGTH = 4;

/**
 * Centralized formatter for AMTMP registration numbers.
 * Allows display format updates in future without altering underlying member database records.
 *
 * Example:
 * formatRegistrationNumber(26, 1) => "AMTMP-26-0001"
 */
export function formatRegistrationNumber(yearTwoDigit: number, sequenceNumber: number): string {
  const paddedYear = String(yearTwoDigit).padStart(2, "0").slice(-2);
  const paddedSeq = String(sequenceNumber).padStart(SEQUENCE_PAD_LENGTH, "0");
  return `${REGISTRATION_PREFIX}-${paddedYear}-${paddedSeq}`;
}

/**
 * Validates whether a given string matches the AMTMP registration number specification.
 */
export function isValidRegistrationNumberFormat(regNumber: string): boolean {
  const regex = /^AMTMP-\d{2}-\d{4,}$/;
  return regex.test(regNumber);
}

/**
 * Parses an AMTMP registration number into its components.
 */
export function parseRegistrationNumber(regNumber: string): { prefix: string; year: number; sequence: number } | null {
  const match = regNumber.match(/^([A-Z]+)-(\d{2})-(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}

/**
 * Concurrency-safe atomic generation of the next sequential AMTMP registration number.
 * Ensures numbers are never generated via COUNT(members) + 1 and never duplicated.
 */
export async function generateNextRegistrationNumber(
  db: AppDatabase,
  targetYear?: number
): Promise<{ registrationNumber: string; year: number; sequence: number }> {
  // Use last 2 digits of current year (e.g. 2026 -> 26)
  const fullYear = targetYear ?? new Date().getFullYear();
  const yearTwoDigit = fullYear % 100;

  // Perform atomic upsert / increment on registration_sequences table
  const updatedRows = await (db as any)
    .insert(registrationSequences)
    .values({
      year: yearTwoDigit,
      lastSequence: 1,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: registrationSequences.year,
      set: {
        lastSequence: sql`${registrationSequences.lastSequence} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({
      year: registrationSequences.year,
      lastSequence: registrationSequences.lastSequence,
    });

  const row = updatedRows[0];
  const formatted = formatRegistrationNumber(row.year, row.lastSequence);

  return {
    registrationNumber: formatted,
    year: row.year,
    sequence: row.lastSequence,
  };
}
