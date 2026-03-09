"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Pricing Management</h1>
        <p className="text-neutral-600 text-sm mt-1">Manage vendors, catalog items, and price codes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/staff/pricing/vendors"
          className="rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-sm transition"
        >
          <div className="text-lg font-semibold text-neutral-900 mb-2">Vendors</div>
          <p className="text-sm text-neutral-600">Manage suppliers and their catalog items</p>
        </Link>

        <Link
          href="/staff/pricing/price-codes"
          className="rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-sm transition"
        >
          <div className="text-lg font-semibold text-neutral-900 mb-2">Price Codes</div>
          <p className="text-sm text-neutral-600">Manage pricing formulas and schedules</p>
        </Link>

        <Link
          href="/staff/pricing/quick-price-check"
          className="rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-sm transition"
        >
          <div className="text-lg font-semibold text-neutral-900 mb-2">Quick Price Check</div>
          <p className="text-sm text-neutral-600">Instantly look up retail prices for moulding and catalog items</p>
        </Link>
      </div>
    </div>
  );
}
