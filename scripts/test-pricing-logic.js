/**
 * Test pricing calculation logic directly (no API/auth needed)
 */

// Simulate the pricing calculation logic
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
      // Fixed price per unit (quantity handled in lineTotal calculation)
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

// Test cases
console.log("🧮 Testing Pricing Calculation Logic\n");

// Test 1: Per-foot moulding calculation
console.log("Test 1: Per-foot moulding (16\" × 20\")");
const priceCode1 = {
  id: "pc1",
  formula: "per_foot",
  baseRate: 5.50,
  minCharge: 0,
  wastePercent: 10,
  multiplier: 1,
};

const component1 = {
  category: "frame",
  priceCodeId: "pc1",
  quantity: 1,
};

const priceCodeMap1 = new Map([["pc1", priceCode1]]);
const result1 = calculateOrderPrice(16, 20, [component1], priceCodeMap1);

const expectedFootage = ((16 + 20) * 2 / 12) * 1.1; // 6.6 feet with 10% waste
const expectedPrice = expectedFootage * 5.50; // $36.30
const actualPrice = result1.subtotal / 100;

console.log(`   Perimeter: ${(16 + 20) * 2}" = ${((16 + 20) * 2 / 12).toFixed(2)} feet`);
console.log(`   With 10% waste: ${expectedFootage.toFixed(2)} feet`);
console.log(`   Expected: $${expectedPrice.toFixed(2)}`);
console.log(`   Actual: $${actualPrice.toFixed(2)}`);
console.log(`   ${Math.abs(actualPrice - expectedPrice) < 0.50 ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 2: Per-sqft mat calculation
console.log("Test 2: Per-sqft mat (16\" × 20\")");
const priceCode2 = {
  id: "pc2",
  formula: "per_sqft",
  baseRate: 8.00,
  minCharge: 0,
  wastePercent: 15,
  multiplier: 1,
};

const component2 = {
  category: "mat",
  priceCodeId: "pc2",
  quantity: 1,
};

const priceCodeMap2 = new Map([["pc2", priceCode2]]);
const result2 = calculateOrderPrice(16, 20, [component2], priceCodeMap2);

const areaSqFt = (16 * 20) / 144; // 2.22 sqft
const areaWithWaste = areaSqFt * 1.15; // 2.55 sqft with 15% waste
const expectedPrice2 = areaWithWaste * 8.00; // $20.44
const actualPrice2 = result2.subtotal / 100;

console.log(`   Area: ${(16 * 20)} sq in = ${areaSqFt.toFixed(2)} sqft`);
console.log(`   With 15% waste: ${areaWithWaste.toFixed(2)} sqft`);
console.log(`   Expected: $${expectedPrice2.toFixed(2)}`);
console.log(`   Actual: $${actualPrice2.toFixed(2)}`);
console.log(`   ${Math.abs(actualPrice2 - expectedPrice2) < 0.50 ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 3: Fixed price
console.log("Test 3: Fixed price component");
const priceCode3 = {
  id: "pc3",
  formula: "fixed",
  baseRate: 25.00,
  minCharge: 0,
  wastePercent: 0,
  multiplier: 1,
};

const component3 = {
  category: "hardware",
  priceCodeId: "pc3",
  quantity: 2,
};

const priceCodeMap3 = new Map([["pc3", priceCode3]]);
const result3 = calculateOrderPrice(16, 20, [component3], priceCodeMap3);

const expectedPrice3 = 25.00 * 2; // $50.00
const actualPrice3 = result3.subtotal / 100;

console.log(`   Fixed price: $${priceCode3.baseRate} × ${component3.quantity}`);
console.log(`   Expected: $${expectedPrice3.toFixed(2)}`);
console.log(`   Actual: $${actualPrice3.toFixed(2)}`);
console.log(`   ${Math.abs(actualPrice3 - expectedPrice3) < 0.01 ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 4: Multiple components
console.log("Test 4: Multiple components (frame + mat + glass)");
const priceCode4 = {
  id: "pc4",
  formula: "per_sqft",
  baseRate: 12.00,
  minCharge: 0,
  wastePercent: 0,
  multiplier: 1,
};

const components4 = [
  { category: "frame", priceCodeId: "pc1", quantity: 1 },
  { category: "mat", priceCodeId: "pc2", quantity: 1 },
  { category: "glass", priceCodeId: "pc4", quantity: 1 },
];

const priceCodeMap4 = new Map([
  ["pc1", priceCode1],
  ["pc2", priceCode2],
  ["pc4", priceCode4],
]);

const result4 = calculateOrderPrice(16, 20, components4, priceCodeMap4);

console.log(`   Components: ${components4.length}`);
console.log(`   Line items: ${result4.lineItems.length}`);
console.log(`   Total: $${(result4.subtotal / 100).toFixed(2)}`);
console.log(`   ${result4.lineItems.length === 3 ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 5: Minimum charge
console.log("Test 5: Minimum charge enforcement");
const priceCode5 = {
  id: "pc5",
  formula: "per_foot",
  baseRate: 1.00,
  minCharge: 15.00,
  wastePercent: 0,
  multiplier: 1,
};

const component5 = {
  category: "frame",
  priceCodeId: "pc5",
  quantity: 1,
};

const priceCodeMap5 = new Map([["pc5", priceCode5]]);
const result5 = calculateOrderPrice(8, 10, [component5], priceCodeMap5); // Small order

const calculated = ((8 + 10) * 2 / 12) * 1.00; // $3.00
const actualPrice5 = result5.subtotal / 100;

console.log(`   Calculated price: $${calculated.toFixed(2)}`);
console.log(`   Minimum charge: $${priceCode5.minCharge.toFixed(2)}`);
console.log(`   Actual price: $${actualPrice5.toFixed(2)}`);
console.log(`   ${actualPrice5 >= priceCode5.minCharge ? "✅ PASS (min charge applied)" : "❌ FAIL"}\n`);

console.log("✅ All pricing logic tests completed!");
console.log("\n📝 Next: Test API endpoints with authentication");
