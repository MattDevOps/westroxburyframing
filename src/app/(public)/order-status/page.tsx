"use client";

import { useState } from "react";
import { ORDER_STATUS_LABEL } from "@/lib/orderStatus";

const STATUS_COLORS: Record<string, string> = {
  estimate: "bg-purple-100 text-purple-800 border-purple-300",
  new_design: "bg-blue-100 text-blue-800 border-blue-300",
  awaiting_materials: "bg-amber-100 text-amber-800 border-amber-300",
  in_production: "bg-indigo-100 text-indigo-800 border-indigo-300",
  quality_check: "bg-cyan-100 text-cyan-800 border-cyan-300",
  ready_for_pickup: "bg-emerald-100 text-emerald-800 border-emerald-300",
  picked_up: "bg-teal-100 text-teal-800 border-teal-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-neutral-100 text-neutral-800 border-neutral-300",
  on_hold: "bg-orange-100 text-orange-800 border-orange-300",
};

export default function OrderStatusPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookupOrder() {
    if (!orderNumber.trim()) {
      setError("Please enter an order number");
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch(`/api/public/order-status?orderNumber=${encodeURIComponent(orderNumber.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order not found");
      }

      setOrder(data.order);
    } catch (e: any) {
      setError(e.message || "Failed to lookup order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Order Status</h1>
          <p className="text-neutral-600">Track your framing order</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {/* Search Form */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Order Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupOrder()}
                placeholder="Enter your order number"
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={lookupOrder}
                disabled={loading}
                className="rounded-xl bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Looking up..." : "Lookup"}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Order Details */}
          {order && (
            <div className="space-y-6 border-t border-neutral-200 pt-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">Order #{order.orderNumber}</h2>
                    <p className="text-sm text-neutral-600 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
                      STATUS_COLORS[order.status] || STATUS_COLORS.new_design
                    }`}
                  >
                    {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] || order.status}
                  </span>
                </div>

                {order.customer && (
                  <div className="text-sm text-neutral-600">
                    <p>
                      <span className="font-medium">Customer:</span> {order.customer.firstName} {order.customer.lastName}
                    </p>
                    {order.customer.email && (
                      <p>
                        <span className="font-medium">Email:</span> {order.customer.email}
                      </p>
                    )}
                    {order.customer.phone && (
                      <p>
                        <span className="font-medium">Phone:</span> {order.customer.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Item Type:</span>
                    <span className="text-neutral-900 font-medium">{order.itemType || "Custom Framing"}</span>
                  </div>
                  {order.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Due Date:</span>
                      <span className="text-neutral-900 font-medium">
                        {new Date(order.dueDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total:</span>
                    <span className="text-neutral-900 font-semibold text-lg">
                      ${(order.totalAmount / 100).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {order.paidInFull ? (
                    <div className="flex justify-between text-emerald-700">
                      <span>Payment Status:</span>
                      <span className="font-medium">Paid in Full</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-amber-700">
                      <span>Payment Status:</span>
                      <span className="font-medium">Balance Due</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Message */}
              <div className="rounded-xl border border-neutral-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  {order.status === "ready_for_pickup" && (
                    <>Your order is ready for pickup! Please visit us during business hours to collect your framing.</>
                  )}
                  {order.status === "in_production" && (
                    <>Your order is currently being framed. We'll notify you when it's ready for pickup.</>
                  )}
                  {order.status === "awaiting_materials" && (
                    <>We're waiting for materials to arrive. Your order will begin production soon.</>
                  )}
                  {order.status === "quality_check" && (
                    <>Your order is undergoing final quality checks before being ready for pickup.</>
                  )}
                  {order.status === "new_design" && (
                    <>Your order has been received and is in the design queue.</>
                  )}
                  {order.status === "estimate" && (
                    <>This is an estimate. Please contact us to proceed with the order.</>
                  )}
                  {order.status === "on_hold" && (
                    <>This order is currently on hold. Please contact us for more information.</>
                  )}
                  {order.status === "completed" || order.status === "picked_up" && (
                    <>Thank you for your order! We hope you love your framing.</>
                  )}
                  {!["ready_for_pickup", "in_production", "awaiting_materials", "quality_check", "new_design", "estimate", "on_hold", "completed", "picked_up"].includes(order.status) && (
                    <>Your order status: {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] || order.status}</>
                  )}
                </p>
              </div>

              {/* Contact Info */}
              <div className="text-center pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Questions about your order?{" "}
                  <a href="/contact" className="text-blue-600 hover:underline font-medium">
                    Contact us
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
