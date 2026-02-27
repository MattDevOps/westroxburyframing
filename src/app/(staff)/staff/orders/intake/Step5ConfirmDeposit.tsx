"use client";

import { useState } from "react";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Step 5: Confirm & Deposit</h2>
        <p className="text-sm text-neutral-600">
          Review the order summary and set deposit amount
        </p>
      </div>

      {/* Customer Summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Customer</h3>
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">Name:</span> {data.customer?.firstName}{" "}
            {data.customer?.lastName}
          </div>
          {data.customer?.phone && (
            <div>
              <span className="font-medium">Phone:</span> {data.customer.phone}
            </div>
          )}
          {data.customer?.email && (
            <div>
              <span className="font-medium">Email:</span> {data.customer.email}
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Artwork Type:</span> {data.artworkType}
          </div>
          <div>
            <span className="font-medium">Size:</span> {data.width} × {data.height} {data.units}
          </div>
          {data.itemDescription && (
            <div>
              <span className="font-medium">Description:</span> {data.itemDescription}
            </div>
          )}
          <div>
            <span className="font-medium">Frames:</span> {data.frames.length}
          </div>
          <div>
            <span className="font-medium">Mats:</span> {data.mats.length || "None"}
          </div>
          <div>
            <span className="font-medium">Glass:</span> {data.glassType ? "Selected" : "None"}
          </div>
          {data.mountingType && (
            <div>
              <span className="font-medium">Mounting:</span> {data.mountingType}
            </div>
          )}
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pricing</h3>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Subtotal:</span>
            <span className="font-medium">${(data.pricing.subtotal / 100).toFixed(2)}</span>
          </div>

          {/* Discount */}
          {data.discountType !== "none" && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount:</span>
              <span>
                -$
                {data.discountType === "percent"
                  ? ((data.pricing.subtotal * data.discountValue) / 100 / 100).toFixed(2)
                  : data.discountValue.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Subtotal (after discount):</span>
            <span className="font-medium">${(finalSubtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Tax (6.25%):</span>
            <span className="font-medium">${(finalTax / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-neutral-200 pt-2">
            <span>Total:</span>
            <span>${(finalTotal / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Discount Toggle */}
        <div className="border-t border-neutral-200 pt-4">
          <button
            onClick={() => setShowDiscount(!showDiscount)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showDiscount ? "Hide" : "Apply"} Discount
          </button>

          {showDiscount && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
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
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="none">No Discount</option>
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              {data.discountType !== "none" && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
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
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deposit */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Deposit</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Deposit Percentage
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={data.depositPercent}
                onChange={(e) =>
                  updateData({ depositPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })
                }
                min="0"
                max="100"
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <span className="text-sm text-neutral-600 self-center">%</span>
            </div>
          </div>
          <div className="space-y-1 text-sm border-t border-neutral-200 pt-3">
            <div className="flex justify-between">
              <span className="text-neutral-600">Deposit Amount:</span>
              <span className="font-medium">${(depositAmount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Balance Due:</span>
              <span className="font-medium">${(balanceDue / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Date */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Expected Completion</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Days to Complete
            </label>
            <input
              type="number"
              value={data.expectedCompletionDays}
              onChange={(e) =>
                updateData({ expectedCompletionDays: Math.max(1, parseInt(e.target.value) || 10) })
              }
              min="1"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="text-sm text-neutral-600">
            Expected ready: {completionDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Notes</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Internal Notes (staff only)
            </label>
            <textarea
              value={data.notesInternal || ""}
              onChange={(e) => updateData({ notesInternal: e.target.value || null })}
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Internal notes..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Customer Notes (visible to customer)
            </label>
            <textarea
              value={data.notesCustomer || ""}
              onChange={(e) => updateData({ notesCustomer: e.target.value || null })}
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Notes for customer..."
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-neutral-200">
        <button
          onClick={onBack}
          disabled={loading}
          className="rounded-xl border border-neutral-300 px-6 py-3 text-neutral-700 font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl bg-black px-6 py-3 text-white font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Order..." : "Submit Order"}
        </button>
      </div>
    </div>
  );
}
