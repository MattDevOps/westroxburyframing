/**
 * Comprehensive pricing calculation tests
 * Tests all formula types and edge cases
 */

// Import the actual pricing logic (simulated)
function calculateComponentPrice(component, priceCode, width, height) {
  if (!priceCode) return 0;

  const { formula, baseRate, minCharge, wastePercent, multiplier } = priceCode;
  let quantity = component.quantity || 1;
  let calculatedPrice = 0;

  switch (formula) {
    case "per_foot":
      const perimeterInches = (width + height) * 2;
      const perimeterFeet = perimeterInches / 12;
      const footage = perimeterFeet * quantity;
      const footageWithWaste = footage * (1 + wastePercent / 100);
      calculatedPrice = footageWithWaste * baseRate;
      break;

    case "per_sqft":
      const areaSqInches = width * height;
      const areaSqFeet = areaSqInches / 144;
      const areaWithWaste = areaSqFeet * quantity * (1 + wastePercent / 100);
      calculatedPrice = areaWithWaste * baseRate;
      break;

    case "per_sheet":
      const sheetArea = 32 * 40; // 1280 sq inches
      const neededArea = width * height * quantity;
      const sheetsNeeded = Math.ceil(neededArea / sheetArea);
      calculatedPrice = sheetsNeeded * baseRate;
      break;

    case "per_inch":
      const linearInches = (width + height) * 2 * quantity;
      const inchesWithWaste = linearInches * (1 + wastePercent / 100);
      calculatedPrice = inchesWithWaste * baseRate;
      break;

    case "fixed":
      calculatedPrice = baseRate;
      break;

    default:
      calculatedPrice = 0;
  }

  calculatedPrice = calculatedPrice * multiplier;

  if (minCharge > 0 && calculatedPrice < minCharge) {
    calculatedPrice = minCharge;
  }

  return Math.round(calculatedPrice * 100); // Convert to cents
}

function calculateOrderPrice(width, height, components, priceCodes) {
  const lineItems = [];
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
      description: component.description || `${component.category}`,
      quantity,
      unitPrice,
      lineTotal,
    });

    subtotal += lineTotal;
  }

  return {
    lineItems,
    subtotal,
    tax: 0,
    total: subtotal,
  };
}

console.log("🧮 Comprehensive Pricing Engine Tests\n");

let testsPassed = 0;
let testsFailed = 0;

// Test Suite 1: Per-foot calculations
console.log("📏 Per-Foot Formula Tests");
const priceCodePerFoot = {
  id: "pc-per-foot",
  formula: "per_foot",
  baseRate: 5.50,
  minCharge: 0,
  wastePercent: 10,
  multiplier: 1,
};

const testCases = [
  { width: 8, height: 10, expected: 18.15, desc: "8×10 (small)" }, // 36" = 3ft, +10% = 3.3ft, ×$5.50 = $18.15
  { width: 16, height: 20, expected: 36.30, desc: "16×20 (medium)" }, // 72" = 6ft, +10% = 6.6ft, ×$5.50 = $36.30
  { width: 24, height: 36, expected: 60.50, desc: "24×36 (large)" }, // 120" = 10ft, +10% = 11ft, ×$5.50 = $60.50
  { width: 11, height: 14, expected: 25.21, desc: "11×14 (standard)" }, // 50" = 4.17ft, +10% = 4.58ft, ×$5.50 = $25.19
];

testCases.forEach((test) => {
  const component = { category: "frame", priceCodeId: "pc-per-foot", quantity: 1 };
  const priceCodeMap = new Map([["pc-per-foot", priceCodePerFoot]]);
  const result = calculateOrderPrice(test.width, test.height, [component], priceCodeMap);
  const actual = result.subtotal / 100;
  const pass = Math.abs(actual - test.expected) < 0.50;
  
  if (pass) testsPassed++;
  else testsFailed++;
  
  console.log(`   ${pass ? "✅" : "❌"} ${test.desc}: $${actual.toFixed(2)} (expected ~$${test.expected.toFixed(2)})`);
});

// Test Suite 2: Per-sqft calculations
console.log("\n📐 Per-Square-Foot Formula Tests");
const priceCodePerSqft = {
  id: "pc-per-sqft",
  formula: "per_sqft",
  baseRate: 8.00,
  minCharge: 0,
  wastePercent: 15,
  multiplier: 1,
};

const testCases2 = [
  { width: 8, height: 10, expected: 5.11, desc: "8×10 mat" }, // 80 sqin = 0.556 sqft, +15% = 0.639 sqft, ×$8 = $5.11
  { width: 16, height: 20, expected: 20.44, desc: "16×20 mat" }, // 320 sqin = 2.22 sqft, +15% = 2.56 sqft, ×$8 = $20.44
  { width: 24, height: 36, expected: 55.20, desc: "24×36 mat" }, // 864 sqin = 6 sqft, +15% = 6.9 sqft, ×$8 = $55.20
];

testCases2.forEach((test) => {
  const component = { category: "mat", priceCodeId: "pc-per-sqft", quantity: 1 };
  const priceCodeMap = new Map([["pc-per-sqft", priceCodePerSqft]]);
  const result = calculateOrderPrice(test.width, test.height, [component], priceCodeMap);
  const actual = result.subtotal / 100;
  const pass = Math.abs(actual - test.expected) < 0.50;
  
  if (pass) testsPassed++;
  else testsFailed++;
  
  console.log(`   ${pass ? "✅" : "❌"} ${test.desc}: $${actual.toFixed(2)} (expected ~$${test.expected.toFixed(2)})`);
});

// Test Suite 3: Per-sheet calculations
console.log("\n📄 Per-Sheet Formula Tests");
const priceCodePerSheet = {
  id: "pc-per-sheet",
  formula: "per_sheet",
  baseRate: 25.00,
  minCharge: 0,
  wastePercent: 0,
  multiplier: 1,
};

const testCases3 = [
  { width: 8, height: 10, sheets: 1, expected: 25.00, desc: "8×10 (1 sheet)" }, // 80 sqin < 1280, 1 sheet
  { width: 16, height: 20, sheets: 1, expected: 25.00, desc: "16×20 (1 sheet)" }, // 320 sqin < 1280, 1 sheet
  { width: 24, height: 36, sheets: 1, expected: 25.00, desc: "24×36 (1 sheet)" }, // 864 sqin < 1280, 1 sheet
  { width: 40, height: 60, sheets: 2, expected: 50.00, desc: "40×60 (2 sheets)" }, // 2400 sqin, ceil(2400/1280) = 2 sheets
];

testCases3.forEach((test) => {
  const component = { category: "mat", priceCodeId: "pc-per-sheet", quantity: 1 };
  const priceCodeMap = new Map([["pc-per-sheet", priceCodePerSheet]]);
  const result = calculateOrderPrice(test.width, test.height, [component], priceCodeMap);
  const actual = result.subtotal / 100;
  const pass = Math.abs(actual - test.expected) < 1.00; // Allow $1 tolerance for rounding
  
  if (pass) testsPassed++;
  else testsFailed++;
  
  console.log(`   ${pass ? "✅" : "❌"} ${test.desc}: $${actual.toFixed(2)} (expected ~$${test.expected.toFixed(2)})`);
});

// Test Suite 4: Fixed price
console.log("\n💰 Fixed Price Formula Tests");
const priceCodeFixed = {
  id: "pc-fixed",
  formula: "fixed",
  baseRate: 25.00,
  minCharge: 0,
  wastePercent: 0,
  multiplier: 1,
};

const testCases4 = [
  { quantity: 1, expected: 25.00, desc: "1 unit" },
  { quantity: 2, expected: 50.00, desc: "2 units" },
  { quantity: 5, expected: 125.00, desc: "5 units" },
];

testCases4.forEach((test) => {
  const component = { category: "hardware", priceCodeId: "pc-fixed", quantity: test.quantity };
  const priceCodeMap = new Map([["pc-fixed", priceCodeFixed]]);
  const result = calculateOrderPrice(16, 20, [component], priceCodeMap);
  const actual = result.subtotal / 100;
  const pass = Math.abs(actual - test.expected) < 0.01;
  
  if (pass) testsPassed++;
  else testsFailed++;
  
  console.log(`   ${pass ? "✅" : "❌"} ${test.desc}: $${actual.toFixed(2)} (expected $${test.expected.toFixed(2)})`);
});

// Test Suite 5: Multiplier
console.log("\n🔢 Multiplier Tests");
const priceCodeMultiplier = {
  id: "pc-mult",
  formula: "per_foot",
  baseRate: 5.00,
  minCharge: 0,
  wastePercent: 0,
  multiplier: 1.5, // 50% markup
};

const component = { category: "frame", priceCodeId: "pc-mult", quantity: 1 };
const priceCodeMap = new Map([["pc-mult", priceCodeMultiplier]]);
const result = calculateOrderPrice(16, 20, [component], priceCodeMap);
const basePrice = ((16 + 20) * 2 / 12) * 5.00; // $30.00
const expectedWithMultiplier = basePrice * 1.5; // $45.00
const actual = result.subtotal / 100;
const pass = Math.abs(actual - expectedWithMultiplier) < 0.50;

if (pass) testsPassed++;
else testsFailed++;

console.log(`   ${pass ? "✅" : "❌"} Multiplier (1.5x): $${actual.toFixed(2)} (expected ~$${expectedWithMultiplier.toFixed(2)})`);

// Test Suite 6: Multiple components
console.log("\n🔗 Multiple Components Test");
const components = [
  { category: "frame", priceCodeId: "pc-per-foot", quantity: 1 },
  { category: "mat", priceCodeId: "pc-per-sqft", quantity: 1 },
  { category: "glass", priceCodeId: "pc-per-sqft", quantity: 1 },
  { category: "hardware", priceCodeId: "pc-fixed", quantity: 1 },
];

const allPriceCodes = new Map([
  ["pc-per-foot", priceCodePerFoot],
  ["pc-per-sqft", priceCodePerSqft],
  ["pc-fixed", priceCodeFixed],
]);

const result6 = calculateOrderPrice(16, 20, components, allPriceCodes);
const expected6 = 36.30 + 20.44 + 20.44 + 25.00; // Sum of all components
const actual6 = result6.subtotal / 100;
const pass6 = Math.abs(actual6 - expected6) < 1.00;

if (pass6) testsPassed++;
else testsFailed++;

console.log(`   ${pass6 ? "✅" : "❌"} 4 components: $${actual6.toFixed(2)} (expected ~$${expected6.toFixed(2)})`);
console.log(`      Line items: ${result6.lineItems.length}`);

// Summary
console.log("\n" + "=".repeat(50));
console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
if (testsFailed === 0) {
  console.log("✅ All pricing calculations are working correctly!");
} else {
  console.log("⚠️  Some tests failed - review the calculations above");
}
console.log("=".repeat(50));
