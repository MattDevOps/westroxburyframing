"use client";

import { useMemo, useState } from "react";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-800">{label}</label>
      {children}
      {hint ? <div className="text-xs text-neutral-500">{hint}</div> : null}
    </div>
  );
}

export default function OrderForm() {
  const [phone, setPhone] = useState("");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);

  const [itemType, setItemType] = useState("art");
  const [width, setW] = useState<number>(0);
  const [height, setH] = useState<number>(0);

  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const [err, setErr] = useState<string | null>(null);

  async function createOrder() {
    setErr(null);

    // Create/Upsert customer
    const cRes = await fetch("/staff/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        first_name: firstName,
        last_name: lastName,
        email,
        preferred_contact: "email",
        marketing_opt_in: optIn,
      }),
    });

    const cOut = await cRes.json();
    if (!cRes.ok) {
      setErr(cOut.error || "Customer error");
      return;
    }

    const oRes = await fetch("/staff/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: cOut.customer.id,
        intake_channel: "walk_in",
        item_type: itemType,
        width,
        height,
        units: "in",
        pricing: {
          subtotal_cents: Math.round(subtotal * 100),
          tax_cents: Math.round(tax * 100),
          total_cents: Math.round(total * 100),
        },
        specs: {},
      }),
    });

    const oOut = await oRes.json();
    if (!oRes.ok) {
      setErr(oOut.error || "Order error");
      return;
    }

    window.location.href = `/staff/orders/${oOut.order.id}`;
  }

  return (
    <div className="rounded-2xl border border-neutral-200 p-6 space-y-6 bg-white">
      {/* Customer */}
      <div className="space-y-2">
        <div className="text-lg font-semibold">Customer</div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Phone (required)" hint="Used as the unique customer lookup key">
            <input
              className="rounded-xl border p-3"
              placeholder="e.g. 6175551234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Field label="Email (optional)" hint="Required if opting into marketing emails">
            <input
              className="rounded-xl border p-3"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="First name">
            <input
              className="rounded-xl border p-3"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirst(e.target.value)}
            />
          </Field>

          <Field label="Last name">
            <input
              className="rounded-xl border p-3"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLast(e.target.value)}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm mt-2">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
          Add to email list (opt-in)
        </label>
      </div>

      {/* Item */}
      <div className="space-y-2">
        <div className="text-lg font-semibold">Item</div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Item type" hint="What are we framing?">
            <select
              className="rounded-xl border p-3"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
            >
              <option value="art">Art / Print</option>
              <option value="photo">Photo</option>
              <option value="diploma">Diploma / Certificate</option>
              <option value="object">Object / Shadowbox</option>
              <option value="memorabilia">Memorabilia / Jersey</option>
            </select>
          </Field>

          <Field label="Width (inches)" hint="Visible art size (not frame outer size)">
            <input
              className="rounded-xl border p-3"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Width"
              value={width}
              onChange={(e) => setW(Number(e.target.value))}
            />
          </Field>

          <Field label="Height (inches)" hint="Visible art size (not frame outer size)">
            <input
              className="rounded-xl border p-3"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Height"
              value={height}
              onChange={(e) => setH(Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <div className="text-lg font-semibold">Pricing</div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Subtotal ($)" hint="Before tax">
            <input
              className="rounded-xl border p-3"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Subtotal"
              value={subtotal}
              onChange={(e) => setSubtotal(Number(e.target.value))}
            />
          </Field>

          <Field label="Tax ($)" hint="MA sales tax (or your manual calc)">
            <input
              className="rounded-xl border p-3"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Tax"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
            />
          </Field>

          <Field label="Total ($)" hint="Subtotal + tax">
            <input className="rounded-xl border p-3 bg-neutral-50" readOnly value={total.toFixed(2)} />
          </Field>
        </div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <button className="rounded-xl bg-black px-5 py-3 text-white" onClick={createOrder}>
        Create Order
      </button>
    </div>
  );
}
