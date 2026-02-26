/**
 * Pricing Engine - Calculate frame job prices based on size, components, and price codes
 */

export type PricingComponent = {
  category: string; // frame, mat, glass, mounting, hardware, etc.
  priceCodeId?: string;
  vendorItemId?: string;
  description?: string;
  quantity?: number;
  width?: number; // inches
  height?: number; // inches
  unitType?: string; // foot, sheet, sqft, each
};

export type PriceCode = {
  id: string;
  code: string;
  category: string;
  formula: string; // "per_foot", "per_sqft", "per_sheet", "fixed", "per_inch"
  baseRate: number;
  minCharge: number;
  wastePercent: number;
  multiplier: number;
};

export type PricingLineItem = {
  category: string;
  description: string;
  quantity: number;
  unitType: string;
  unitPrice: number; // cents
  lineTotal: number; // cents
};

export type PricingResult = {
  lineItems: PricingLineItem[];
  subtotal: number; // cents
  tax: number; // cents (calculated separately, not included here)
  total: number; // cents
};

/**
 * Calculate price for a single component
 */
function calculateComponentPrice(
  component: PricingComponent,
  priceCode: PriceCode | null,
  width: number,
  height: number
): number {
  if (!priceCode) {
    // No price code = manual pricing, return 0 (will be set manually)
    return 0;
  }

  const { formula, baseRate, minCharge, wastePercent, multiplier } = priceCode;
  let quantity = component.quantity || 1;
  let calculatedPrice = 0;

  switch (formula) {
    case "per_foot":
      // For moulding: perimeter in feet
      const perimeterInches = (width + height) * 2;
      const perimeterFeet = perimeterInches / 12;
      const footage = perimeterFeet * quantity;
      const footageWithWaste = footage * (1 + wastePercent / 100);
      calculatedPrice = footageWithWaste * baseRate;
      break;

    case "per_sqft":
      // For mats, glass: area in square feet
      const areaSqInches = width * height;
      const areaSqFeet = areaSqInches / 144;
      const areaWithWaste = areaSqFeet * quantity * (1 + wastePercent / 100);
      calculatedPrice = areaWithWaste * baseRate;
      break;

    case "per_sheet":
      // For matboard sheets (standard 32x40 sheet)
      const sheetArea = 32 * 40; // 1280 sq inches
      const neededArea = width * height * quantity;
      const sheetsNeeded = Math.ceil(neededArea / sheetArea);
      calculatedPrice = sheetsNeeded * baseRate;
      break;

    case "per_inch":
      // Per linear inch (for narrow items)
      const linearInches = (width + height) * 2 * quantity;
      const inchesWithWaste = linearInches * (1 + wastePercent / 100);
      calculatedPrice = inchesWithWaste * baseRate;
      break;

    case "fixed":
      // Fixed price per unit (quantity handled in lineTotal calculation)
      calculatedPrice = baseRate;
      break;

    default:
      calculatedPrice = 0;
  }

  // Apply multiplier
  calculatedPrice = calculatedPrice * multiplier;

  // Apply minimum charge
  if (minCharge > 0 && calculatedPrice < minCharge) {
    calculatedPrice = minCharge;
  }

  // Convert to cents and round
  return Math.round(calculatedPrice * 100);
}

/**
 * Calculate total price for an order
 */
export function calculateOrderPrice(
  width: number,
  height: number,
  components: PricingComponent[],
  priceCodes: Map<string, PriceCode>
): PricingResult {
  const lineItems: PricingLineItem[] = [];
  let subtotal = 0;

  for (const component of components) {
    const priceCode = component.priceCodeId
      ? priceCodes.get(component.priceCodeId)
      : null;

    const quantity = component.quantity || 1;
    const unitPrice = calculateComponentPrice(component, priceCode, width, height);
    const lineTotal = unitPrice * quantity;

    lineItems.push({
      category: component.category,
      description: component.description || `${component.category} (${component.priceCodeId || "manual"})`,
      quantity,
      unitType: component.unitType || "each",
      unitPrice,
      lineTotal,
    });

    subtotal += lineTotal;
  }

  return {
    lineItems,
    subtotal,
    tax: 0, // Tax calculated separately based on location
    total: subtotal,
  };
}

/**
 * Calculate footage for moulding (rounded to nearest half foot)
 */
export function calculateMouldingFootage(width: number, height: number, quantity: number = 1): number {
  const perimeterInches = (width + height) * 2;
  const perimeterFeet = perimeterInches / 12;
  const totalFeet = perimeterFeet * quantity;
  // Round to nearest 0.5 foot
  return Math.round(totalFeet * 2) / 2;
}

/**
 * Calculate square footage for mats/glass
 */
export function calculateSquareFootage(width: number, height: number, quantity: number = 1): number {
  const areaSqInches = width * height;
  const areaSqFeet = areaSqInches / 144;
  return areaSqFeet * quantity;
}
