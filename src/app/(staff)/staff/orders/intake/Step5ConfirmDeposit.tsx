"use client";

import { useState, useEffect } from "react";
import { CheckCircle, DollarSign, Calendar, FileText, Percent, CreditCard, User, AlertTriangle } from "lucide-react";
import type { IntakeData } from "./page";

interface Step5Props {
  data: IntakeData;
  updateData: (updates: Partial<IntakeData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export default function Step5ConfirmDeposit({
  data,
  updateData,
  onSubmit,
  onBack,
  loading,
}: Step5Props) {
  const [showDiscount, setShowDiscount] = useState(false);
  const [costData, setCostData] = useState<{ totalCost: number; profitMargin: number } | null>(null);
  const [loadingCost, setLoadingCost] = useState(false);

  // Calculate cost and profit margin
  useEffect(() => {
    if (data.pricing && data.width > 0 && data.height > 0) {
      calculateCost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.pricing, data.frames, data.mats, data.glassType, data.mountingType, data.addOns, data.width, data.height, data.units]);

  const calculateCost = async () => {
    if (!data.pricing) return;
    
    setLoadingCost(true);
    try {
      // Build components array with vendor items
      const components: any[] = [];
      
      data.frames.forEach((frame) => {
        if (frame.vendorItemId) {
          components.push({
            category: "frame",
            vendorItemId: frame.vendorItemId,
            quantity: 1,
          });
        }
      });
      
      data.mats.forEach((mat) => {
        if (mat.vendorItemId) {
          components.push({
            category: "mat",
            vendorItemId: mat.vendorItemId,
            quantity: 1,
          });
        }
      });
      
      if (components.length === 0) {
        // No vendor items, can't calculate cost
        setCostData(null);
        return;
      }
      
      // Fetch vendor items to get costs
      const vendorItemIds = components.map(c => c.vendorItemId).filter(Boolean) as string[];
      const res = await fetch(`/staff/api/vendor-items?ids=${vendorItemIds.join(",")}`);
      if (!res.ok) {
        setCostData(null);
        return;
      }
      
      const { items } = await res.json() as { items: Array<{ id: string; costPerUnit: number | string; unitType: string }> };
      const vendorItemMap = new Map(items.map((item) => [item.id, item]));
      
      // Calculate cost
      const widthInches = data.units === "cm" ? data.width / 2.54 : data.width;
      const heightInches = data.units === "cm" ? data.height / 2.54 : data.height;
      
      let totalCost = 0;
      for (const component of components) {
        const vendorItem = vendorItemMap.get(component.vendorItemId || "");
        if (!vendorItem || !vendorItem.costPerUnit) continue;
        
        const costPerUnit = Number(vendorItem.costPerUnit);
        const quantity = component.quantity || 1;
        const unitType = vendorItem.unitType;
        
        if (unitType === "foot" && widthInches && heightInches) {
          const perimeterInches = (widthInches + heightInches) * 2;
          const perimeterFeet = perimeterInches / 12;
          totalCost += perimeterFeet * quantity * costPerUnit;
        } else if ((unitType === "sqft" || unitType === "sheet") && widthInches && heightInches) {
          const areaSqInches = widthInches * heightInches;
          const areaSqFeet = areaSqInches / 144;
          if (unitType === "sheet") {
            const sheetArea = 32 * 40;
            const sheetsNeeded = Math.ceil((areaSqInches * quantity) / sheetArea);
            totalCost += sheetsNeeded * costPerUnit;
          } else {
            totalCost += areaSqFeet * quantity * costPerUnit;
          }
        } else {
          totalCost += quantity * costPerUnit;
        }
      }
      
      // Convert to cents
      const totalCostCents = Math.round(totalCost * 100);
      const finalSubtotal =
        data.discountType === "percent"
          ? Math.round(data.pricing.subtotal * (1 - data.discountValue / 100))
          : data.discountType === "fixed"
          ? Math.max(0, data.pricing.subtotal - Math.round(data.discountValue * 100))
          : data.pricing.subtotal;
      const finalTax = Math.round(finalSubtotal * 0.0625);
      const finalTotal = finalSubtotal + finalTax;
      
      const profit = finalTotal - totalCostCents;
      const profitMargin = finalTotal > 0 ? (profit / finalTotal) * 100 : 0;
      
      setCostData({ totalCost: totalCostCents, profitMargin });
    } catch (error) {
      console.error("Failed to calculate cost:", error);
      setCostData(null);
    } finally {
      setLoadingCost(false);
    }
  };

  if (!data.pricing) {
    return (
      <div className="text-center py-8 text-neutral-500">
        Please complete previous steps first.
      </div>
    );
  }

  const finalSubtotal =
    data.discountType === "percent"
      ? Math.round(data.pricing.subtotal * (1 - data.discountValue / 100))
      : data.discountType === "fixed"
      ? Math.max(0, data.pricing.subtotal - Math.round(data.discountValue * 100))
      : data.pricing.subtotal;

  const finalTax = Math.round(finalSubtotal * 0.0625); // 6.25% MA tax
  const finalTotal = finalSubtotal + finalTax;
  const depositAmount = Math.round((finalTotal * data.depositPercent) / 100);
  const balanceDue = finalTotal - depositAmount;

  // Calculate completion date
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + data.expectedCompletionDays);

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Step 5: Confirm & Deposit</h2>
        <p className="text-base text-neutral-600">
          Review the order summary and set deposit amount
        </p>
      </div>

      {/* Customer Summary */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          Customer
        </h3>
        <div className="space-y-2 text-base">
          <div className="font-semibold text-lg">
            {data.customer?.firstName} {data.customer?.lastName}
          </div>
          {data.customer?.phone && (
            <div className="text-neutral-600">
              📞 {data.customer.phone}
            </div>
          )}
          {data.customer?.email && (
            <div className="text-neutral-600">
              ✉️ {data.customer.email}
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Order Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-base">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Artwork Type</div>
            <div className="font-semibold">{data.artworkType}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">Size</div>
            <div className="font-semibold">{data.width} × {data.height} {data.units}</div>
          </div>
          {data.itemDescription && (
            <div className="col-span-2 md:col-span-1">
              <div className="text-sm text-neutral-500 mb-1">Description</div>
              <div className="font-semibold">{data.itemDescription}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-neutral-500 mb-1">Frames</div>
            <div className="font-semibold">{data.frames.length}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">Mats</div>
            <div className="font-semibold">{data.mats.length || "None"}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">Glass</div>
            <div className="font-semibold">{data.glassType ? "Selected" : "None"}</div>
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Pricing
        </h3>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-base">
            <span className="text-neutral-600">Subtotal:</span>
            <span className="font-semibold text-lg">${(data.pricing.subtotal / 100).toFixed(2)}</span>
          </div>

          {/* Discount */}
          {data.discountType !== "none" && (
            <div className="flex justify-between text-base text-red-600 bg-red-50 p-3 rounded-xl">
              <span className="font-semibold">Discount:</span>
              <span className="font-bold">
                -$
                {data.discountType === "percent"
                  ? ((data.pricing.subtotal * data.discountValue) / 100 / 100).toFixed(2)
                  : data.discountValue.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-base">
            <span className="text-neutral-600">Subtotal (after discount):</span>
            <span className="font-semibold text-lg">${(finalSubtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-neutral-600">Tax (6.25%):</span>
            <span className="font-semibold text-lg">${(finalTax / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold border-t-2 border-neutral-200 pt-3">
            <span className="flex items-center gap-2">Total:</span>
            <span className="text-green-600">${(finalTotal / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Cost & Profit Margin */}
        {loadingCost ? (
          <div className="text-sm text-neutral-500 mt-4">Calculating cost...</div>
        ) : costData ? (
          <div className="mt-6 space-y-3 border-t-2 border-neutral-200 pt-4">
            <div className="flex justify-between text-base">
              <span className="text-neutral-600">Estimated Cost:</span>
              <span className="font-semibold">${(costData.totalCost / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-neutral-600">Estimated Profit:</span>
              <span className="font-semibold text-green-600">
                ${((finalTotal - costData.totalCost) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-neutral-700">Profit Margin:</span>
              <span className={costData.profitMargin < 60 ? "text-red-600" : "text-green-600"}>
                {costData.profitMargin.toFixed(1)}%
              </span>
            </div>
            {costData.profitMargin < 60 && (
              <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-red-800 mb-1">⚠️ Low Profit Margin Warning</div>
                  <div className="text-sm text-red-700">
                    Profit margin is below 60% ({costData.profitMargin.toFixed(1)}%). 
                    Consider adjusting pricing or reviewing costs before submitting this order.
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-sm text-neutral-500">
            Cost calculation unavailable (vendor items not selected for all components)
          </div>
        )}

        {/* Discount Toggle */}
        <div className="border-t-2 border-neutral-200 pt-6">
          <button
            onClick={() => setShowDiscount(!showDiscount)}
            className="flex items-center gap-2 text-base text-blue-600 hover:text-blue-700 font-semibold"
          >
            <Percent className="w-5 h-5" />
            {showDiscount ? "Hide" : "Apply"} Discount
          </button>

          {showDiscount && (
            <div className="mt-4 space-y-4 bg-neutral-50 p-5 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Discount Type
                </label>
                <select
                  value={data.discountType}
                  onChange={(e) =>
                    updateData({
                      discountType: e.target.value as "none" | "percent" | "fixed",
                      discountValue: 0,
                    })
                  }
                  className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="none">No Discount</option>
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              {data.discountType !== "none" && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {data.discountType === "percent" ? "Discount %" : "Discount Amount ($)"}
                  </label>
                  <input
                    type="number"
                    value={data.discountValue}
                    onChange={(e) =>
                      updateData({ discountValue: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    max={data.discountType === "percent" ? 100 : undefined}
                    step={data.discountType === "percent" ? 1 : 0.01}
                    className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deposit */}
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-green-600" />
          Deposit
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-neutral-700 mb-3">
              Deposit Percentage
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={data.depositPercent}
                onChange={(e) =>
                  updateData({ depositPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })
                }
                min="0"
                max="100"
                className="flex-1 rounded-xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <span className="text-xl text-neutral-600 font-semibold">%</span>
            </div>
          </div>
          <div className="space-y-3 border-t-2 border-green-200 pt-4">
            <div className="flex justify-between text-base">
              <span className="text-neutral-600 font-semibold">Deposit Amount:</span>
              <span className="font-bold text-xl text-green-600">${(depositAmount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-neutral-600 font-semibold">Balance Due:</span>
              <span className="font-bold text-xl">${(balanceDue / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Date */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          Expected Completion
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-neutral-700 mb-3">
              Days to Complete
            </label>
            <input
              type="number"
              value={data.expectedCompletionDays}
              onChange={(e) =>
                updateData({ expectedCompletionDays: Math.max(1, parseInt(e.target.value) || 10) })
              }
              min="1"
              className="w-full rounded-xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="text-base text-neutral-600 bg-blue-50 p-4 rounded-xl">
            <span className="font-semibold">Expected ready:</span> {completionDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Notes
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-neutral-700 mb-2">
              Internal Notes (staff only)
            </label>
            <textarea
              value={data.notesInternal || ""}
              onChange={(e) => updateData({ notesInternal: e.target.value || null })}
              rows={3}
              className="w-full rounded-xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Internal notes..."
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-neutral-700 mb-2">
              Customer Notes (visible to customer)
            </label>
            <textarea
              value={data.notesCustomer || ""}
              onChange={(e) => updateData({ notesCustomer: e.target.value || null })}
              rows={3}
              className="w-full rounded-xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notes for customer..."
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-6 border-t-2 border-neutral-200">
        <button
          onClick={onBack}
          disabled={loading}
          className="rounded-2xl border-2 border-neutral-300 px-6 sm:px-8 py-3 sm:py-4 text-neutral-700 text-sm sm:text-base font-bold hover:bg-neutral-50 disabled:opacity-50 transition-all min-w-[120px] sm:min-w-[150px] touch-manipulation active:scale-95"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="rounded-2xl bg-green-600 px-6 sm:px-10 py-4 sm:py-5 text-white text-base sm:text-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 min-w-full sm:min-w-[250px] justify-center touch-manipulation active:scale-95"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              Submit Order
            </>
          )}
        </button>
      </div>
    </div>
  );
}
