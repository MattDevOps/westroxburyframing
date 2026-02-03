"use client";

import { useState } from "react";

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
        marketing_opt_in: optIn
      })
    });
    const cOut = await cRes.json();
    if (!cRes.ok) { setErr(cOut.error || "Customer error"); return; }

    const total = subtotal + tax;

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
          total_cents: Math.round(total * 100)
        },
        specs: {}
      })
    });
    const oOut = await oRes.json();
    if (!oRes.ok) { setErr(oOut.error || "Order error"); return; }

    window.location.href = `/staff/orders/${oOut.order.id}`;
  }

  return (
    <div className="rounded-2xl border border-neutral-200 p-6 space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-xl border p-3" placeholder="Phone (required)" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="rounded-xl border p-3" placeholder="First name" value={firstName} onChange={e=>setFirst(e.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Last name" value={lastName} onChange={e=>setLast(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={optIn} onChange={e=>setOptIn(e.target.checked)} />
        Add to email list (opt-in)
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <select className="rounded-xl border p-3" value={itemType} onChange={e=>setItemType(e.target.value)}>
          <option value="art">Art</option>
          <option value="photo">Photo</option>
          <option value="diploma">Diploma</option>
          <option value="object">Object</option>
          <option value="memorabilia">Memorabilia</option>
        </select>
        <input className="rounded-xl border p-3" type="number" placeholder="Width (in)" value={width} onChange={e=>setW(Number(e.target.value))} />
        <input className="rounded-xl border p-3" type="number" placeholder="Height (in)" value={height} onChange={e=>setH(Number(e.target.value))} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input className="rounded-xl border p-3" type="number" placeholder="Subtotal ($)" value={subtotal} onChange={e=>setSubtotal(Number(e.target.value))} />
        <input className="rounded-xl border p-3" type="number" placeholder="Tax ($)" value={tax} onChange={e=>setTax(Number(e.target.value))} />
        <input className="rounded-xl border p-3 bg-neutral-50" readOnly value={(subtotal + tax).toFixed(2)} />
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <button className="rounded-xl bg-black px-5 py-3 text-white" onClick={createOrder}>
        Create Order
      </button>
    </div>
  );
}
