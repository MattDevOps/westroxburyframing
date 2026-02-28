/**
 * Validation utilities for the intake wizard
 */

export interface ValidationError {
  field: string;
  message: string;
}

export function validateStep1(data: {
  customerId: string | null;
  artworkType: string;
  width: number;
  height: number;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.customerId) {
    errors.push({ field: "customer", message: "Please select or create a customer" });
  }

  if (!data.artworkType || data.artworkType.trim() === "") {
    errors.push({ field: "artworkType", message: "Please select an artwork type" });
  }

  if (!data.width || data.width <= 0) {
    errors.push({ field: "width", message: "Width must be greater than 0" });
  }

  if (!data.height || data.height <= 0) {
    errors.push({ field: "height", message: "Height must be greater than 0" });
  }

  // Reasonable size limits (e.g., max 200 inches)
  if (data.width > 200) {
    errors.push({ field: "width", message: "Width seems too large. Please verify the measurement." });
  }

  if (data.height > 200) {
    errors.push({ field: "height", message: "Height seems too large. Please verify the measurement." });
  }

  return errors;
}

export function validateStep2(data: { frames: Array<{ priceCodeId?: string; vendorItemId?: string }> }): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.frames.length === 0) {
    errors.push({ field: "frames", message: "Please select at least one frame" });
  }

  return errors;
}

export function validateStep3(data: {
  glassType: string | null;
  mats: Array<{ priceCodeId: string }>;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.glassType) {
    errors.push({ field: "glassType", message: "Please select a glass type" });
  }

  return errors;
}

export function validateStep5(data: {
  pricing: { subtotal: number; total: number } | null;
  depositPercent: number;
  expectedCompletionDays: number;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.pricing) {
    errors.push({ field: "pricing", message: "Pricing calculation failed. Please go back and check your selections." });
  }

  if (data.depositPercent < 0 || data.depositPercent > 100) {
    errors.push({ field: "depositPercent", message: "Deposit percentage must be between 0 and 100" });
  }

  if (data.expectedCompletionDays < 1 || data.expectedCompletionDays > 365) {
    errors.push({ field: "expectedCompletionDays", message: "Expected completion days must be between 1 and 365" });
  }

  return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return "";
  if (errors.length === 1) return errors[0].message;
  return `Please fix the following:\n${errors.map((e) => `• ${e.message}`).join("\n")}`;
}
