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

  // Specs
  const [frameCode, setFrameCode] = useState("");
  const [frameVendor, setFrameVendor] = useState("");
  const [mat1Code, setMat1Code] = useState("");
  const [mat2Code, setMat2Code] = useState("");
  const [glassType, setGlassType] = useState("");
  const [mountType, setMountType] = useState("");
  const [backingType, setBackingType] = useState("");
  const [spacers, setSpacers] = useState(false);
  const [specialtyType, setSpecialtyType] = useState("");

  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const discountAmountDollars = useMemo(() => {
    if (discountType === "percent") return subtotal * discountValue / 100;
    if (discountType === "fixed") return discountValue;
    return 0;
  }, [discountType, discountValue, subtotal]);

  const afterDiscount = useMemo(() => Math.max(0, subtotal - discountAmountDollars), [subtotal, discountAmountDollars]);

  const total = useMemo(() => afterDiscount + tax, [afterDiscount, tax]);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function createOrder(asEstimate = false) {
    setErr(null);
    setInfo(null);

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

    // Show notice if an existing customer was matched
    if (cOut.existing && cOut.message) {
      setInfo(cOut.message);
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
        status: asEstimate ? "estimate" : "new_design",
        discount_type: discountType,
        discount_value: discountValue,
        pricing: {
          subtotal_cents: Math.round(subtotal * 100),
          tax_cents: Math.round(tax * 100),
          total_cents: Math.round(total * 100),
        },
        specs: {
          frame_code: frameCode || null,
          frame_vendor: frameVendor || null,
          mat_1_code: mat1Code || null,
          mat_2_code: mat2Code || null,
          glass_type: glassType || null,
          mount_type: mountType || null,
          backing_type: backingType || null,
          spacers,
          specialty_type: specialtyType || null,
        },
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
          <Field label="Phone" hint="Phone or email required — used to look up existing customers">
            <input
              className="rounded-xl border p-3"
              placeholder="e.g. 6175551234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Field label="Email" hint="Phone or email required — used to look up existing customers">
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

      {/* Specs */}
      <div className="space-y-2">
        <div className="text-lg font-semibold">Frame Specs</div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Frame Code" hint="Moulding code / SKU">
            <input className="rounded-xl border p-3" placeholder="e.g. LJ-2028" value={frameCode} onChange={(e) => setFrameCode(e.target.value)} />
          </Field>
          <Field label="Frame Vendor" hint="Larson-Juhl, Roma, etc.">
            <input className="rounded-xl border p-3" placeholder="Vendor" value={frameVendor} onChange={(e) => setFrameVendor(e.target.value)} />
          </Field>
          <Field label="Mat 1 Code">
            <input className="rounded-xl border p-3" placeholder="Primary mat" value={mat1Code} onChange={(e) => setMat1Code(e.target.value)} />
          </Field>
          <Field label="Mat 2 Code">
            <input className="rounded-xl border p-3" placeholder="Secondary mat (optional)" value={mat2Code} onChange={(e) => setMat2Code(e.target.value)} />
          </Field>
          <Field label="Glass Type">
            <select className="rounded-xl border p-3" value={glassType} onChange={(e) => setGlassType(e.target.value)}>
              <option value="">Select glass...</option>
              <option value="regular">Regular Clear</option>
              <option value="non-glare">Non-Glare</option>
              <option value="uv">UV Protection</option>
              <option value="museum">Museum Glass</option>
              <option value="acrylic">Acrylic / Plexi</option>
              <option value="optium">Optium Museum Acrylic</option>
              <option value="none">None</option>
            </select>
          </Field>
          <Field label="Mount Type">
            <select className="rounded-xl border p-3" value={mountType} onChange={(e) => setMountType(e.target.value)}>
              <option value="">Select mount...</option>
              <option value="dry">Dry Mount</option>
              <option value="float">Float Mount</option>
              <option value="hinge">Hinge Mount</option>
              <option value="shadow">Shadow Box</option>
              <option value="stretch">Canvas Stretch</option>
              <option value="none">None</option>
            </select>
          </Field>
          <Field label="Backing Type">
            <input className="rounded-xl border p-3" placeholder="Foam core, coroplast, etc." value={backingType} onChange={(e) => setBackingType(e.target.value)} />
          </Field>
          <Field label="Specialty Type">
            <input className="rounded-xl border p-3" placeholder="Conservation, archival, etc." value={specialtyType} onChange={(e) => setSpecialtyType(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" checked={spacers} onChange={(e) => setSpacers(e.target.checked)} />
            <span className="text-sm font-medium text-neutral-800">Spacers</span>
          </div>
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

          <Field label="Total ($)" hint="After discount + tax">
            <input className="rounded-xl border p-3 bg-neutral-50 font-semibold" readOnly value={total.toFixed(2)} />
          </Field>
        </div>

        {/* Discount */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="text-sm font-semibold text-neutral-800 mb-3">Discount (optional)</div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Discount Type">
              <select
                className="rounded-xl border p-3"
                value={discountType}
                onChange={(e) => { setDiscountType(e.target.value as any); setDiscountValue(0); }}
              >
                <option value="none">No discount</option>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </Field>

            {discountType !== "none" && (
              <Field label={discountType === "percent" ? "Discount (%)" : "Discount ($)"}>
                <input
                  type="number"
                  step={discountType === "percent" ? "1" : "0.01"}
                  min={0}
                  className="rounded-xl border p-3"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
              </Field>
            )}

            {discountAmountDollars > 0 && (
              <div className="flex items-end pb-1">
                <div className="text-sm text-red-600 font-medium">
                  Saves: ${discountAmountDollars.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {info && (
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
          ℹ️ {info}
        </div>
      )}

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="flex gap-3">
        <button className="rounded-xl bg-black px-5 py-3 text-white" onClick={() => createOrder(false)}>
          Create Order
        </button>
        <button
          className="rounded-xl border border-red-300 px-5 py-3 text-red-700 bg-red-50 hover:bg-red-100"
          onClick={() => createOrder(true)}
        >
          Save as Estimate
        </button>
      </div>
    </div>
  );
}
