/**
 * Edge case validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate dimensions (width and height)
 */
export function validateDimensions(width: number | null | undefined, height: number | null | undefined, units: "in" | "cm" = "in"): ValidationResult {
  const errors: string[] = [];

  if (width === null || width === undefined || isNaN(width)) {
    errors.push("Width is required");
  } else if (width <= 0) {
    errors.push("Width must be greater than 0");
  } else if (width > 1000) {
    errors.push(`Width is unusually large (${width} ${units}). Please verify.`);
  }

  if (height === null || height === undefined || isNaN(height)) {
    errors.push("Height is required");
  } else if (height <= 0) {
    errors.push("Height must be greater than 0");
  } else if (height > 1000) {
    errors.push(`Height is unusually large (${height} ${units}). Please verify.`);
  }

  // Check for reasonable aspect ratio (not too extreme)
  if (width && height && width > 0 && height > 0) {
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    if (aspectRatio > 20) {
      errors.push("Dimensions have an extreme aspect ratio. Please verify width and height are correct.");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate pricing amounts
 */
export function validatePricing(subtotal: number, tax: number, total: number): ValidationResult {
  const errors: string[] = [];

  if (subtotal < 0) {
    errors.push("Subtotal cannot be negative");
  }

  if (tax < 0) {
    errors.push("Tax cannot be negative");
  }

  const expectedTotal = subtotal + tax;
  const difference = Math.abs(total - expectedTotal);
  
  // Allow small rounding differences (1 cent)
  if (difference > 1) {
    errors.push(`Total (${total}) does not match subtotal + tax (${expectedTotal}). Difference: ${difference}`);
  }

  if (total < 0) {
    errors.push("Total cannot be negative");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate discount
 */
export function validateDiscount(type: "none" | "percent" | "fixed", value: number, subtotal: number): ValidationResult {
  const errors: string[] = [];

  if (type === "percent") {
    if (value < 0 || value > 100) {
      errors.push("Discount percentage must be between 0 and 100");
    }
  } else if (type === "fixed") {
    if (value < 0) {
      errors.push("Discount amount cannot be negative");
    }
    if (value > subtotal) {
      errors.push("Discount amount cannot exceed subtotal");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate customer data
 */
export function validateCustomer(data: {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push("First name is required");
  } else if (data.firstName.trim().length > 100) {
    errors.push("First name is too long (max 100 characters)");
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push("Last name is required");
  } else if (data.lastName.trim().length > 100) {
    errors.push("Last name is too long (max 100 characters)");
  }

  if (!data.phone && !data.email) {
    errors.push("Phone or email is required");
  }

  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 10) {
      errors.push("Phone number must have at least 10 digits");
    }
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email address format");
    }
    if (data.email.length > 255) {
      errors.push("Email address is too long (max 255 characters)");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate order components
 */
export function validateComponents(components: Array<{ category: string; quantity: number; priceCodeId?: string; vendorItemId?: string }>): ValidationResult {
  const errors: string[] = [];

  if (components.length === 0) {
    errors.push("At least one component is required");
  }

  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    
    if (!comp.category) {
      errors.push(`Component ${i + 1}: Category is required`);
    }

    if (!comp.priceCodeId && !comp.vendorItemId) {
      errors.push(`Component ${i + 1}: Either price code or vendor item is required`);
    }

    if (comp.quantity <= 0) {
      errors.push(`Component ${i + 1}: Quantity must be greater than 0`);
    }

    if (comp.quantity > 1000) {
      errors.push(`Component ${i + 1}: Quantity is unusually large. Please verify.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
