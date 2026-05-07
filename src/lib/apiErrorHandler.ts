/**
 * Standardized error handling for API routes
 */

import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error("[API Error]:", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        statusCode: error.statusCode,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === "production" 
      ? "An unexpected error occurred" 
      : error.message;

    return NextResponse.json(
      {
        error: message,
        statusCode: 500,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      statusCode: 500,
    },
    { status: 500 }
  );
}

export function validateRequired(data: Record<string, any>, fields: string[]): void {
  const missing: string[] = [];
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(", ")}`,
      400,
      "VALIDATION_ERROR",
      { missingFields: missing }
    );
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  // Basic phone validation - digits only, 10+ digits
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}
