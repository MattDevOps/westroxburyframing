"use client";

import { useMemo, useState, useEffect } from "react";

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

type Component = {
  id: string;
  category: string;
  priceCodeId?: string;
  vendorItemId?: string;
  description?: string;
  quantity: number;
  discount?: number; // dollars
};

type PriceCode = {
  id: string;
  code: string;
  name: string;
  category: string;
  formula: string;
};

type VendorCatalogItem = {
  id: string;
  itemNumber: string;
  description: string | null;
  category: string;
  vendor: { name: string; code: string };
};

export default function OrderForm() {
  const [phone, setPhone] = useState("");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);

  const [itemType, setItemType] = useState("art");
  const [width, setW] = useState<number>(0);
  const [height, setH] = useState<number>(0);

  // Phase 2C: Component-based pricing
  const [useComponents, setUseComponents] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);
  const [priceCodes, setPriceCodes] = useState<PriceCode[]>([]);
  const [catalogItems, setCatalogItems] = useState<VendorCatalogItem[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [calculatedPricing, setCalculatedPricing] = useState<{
    subtotal: number;
    tax: number;
    total: number;
    lineItems: Array<{ description: string; lineTotal: number }>;
  } | null>(null);

  // Legacy specs (for backward compatibility)
  const [frameCode, setFrameCode] = useState("");
  const [frameVendor, setFrameVendor] = useState("");
  const [mat1Code, setMat1Code] = useState("");
  const [mat2Code, setMat2Code] = useState("");
  const [glassType, setGlassType] = useState("");
  const [mountType, setMountType] = useState("");
  const [backingType, setBackingType] = useState("");
  const [spacers, setSpacers] = useState(false);
  const [specialtyType, setSpecialtyType] = useState("");

  // Pricing (manual or calculated)
  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Load price codes and vendors on mount
  useEffect(() => {
    async function load() {
      try {
        const [pcRes, vendorsRes] = await Promise.all([
          fetch("/staff/api/price-codes?active=true"),
          fetch("/staff/api/vendors"),
        ]);
        if (pcRes.ok) {
          const pcData = await pcRes.json();
          setPriceCodes(pcData.priceCodes || []);
        }
        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json();
          const allItems: VendorCatalogItem[] = [];
          for (const vendor of vendorsData.vendors || []) {
            const itemsRes = await fetch(`/staff/api/vendors/${vendor.id}/catalog`);
            if (itemsRes.ok) {
              const itemsData = await itemsRes.json();
              allItems.push(...(itemsData.items || []));
            }
          }
          setCatalogItems(allItems);
        }
      } catch (e) {
        console.error("Failed to load pricing data:", e);
      }
    }
    load();
  }, []);

  // Calculate pricing when components change
  useEffect(() => {
    if (useComponents && components.length > 0 && width > 0 && height > 0) {
      calculatePricing();
    } else {
      setCalculatedPricing(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useComponents, components, width, height]);

  async function calculatePricing() {
    if (components.length === 0 || width <= 0 || height <= 0) return;

    setLoadingPricing(true);
    try {
      const res = await fetch("/staff/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          width,
          height,
          components: components.map((c) => ({
            category: c.category,
            priceCodeId: c.priceCodeId || undefined,
            vendorItemId: c.vendorItemId || undefined,
            description: c.description || undefined,
            quantity: c.quantity,
          })),
          taxRate: 0.0625, // MA tax
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCalculatedPricing(data);
        setSubtotal(data.subtotal / 100);
        setTax(data.tax / 100);
      }
    } catch (e) {
      console.error("Pricing calculation failed:", e);
    } finally {
      setLoadingPricing(false);
    }
  }

  function addComponent(category: string) {
    const newComp: Component = {
      id: `temp-${Date.now()}-${Math.random()}`,
      category,
      quantity: 1,
    };
    setComponents([...components, newComp]);
  }

  function removeComponent(id: string) {
    setComponents(components.filter((c) => c.id !== id));
  }

  function updateComponent(id: string, updates: Partial<Component>) {
    setComponents(components.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  const discountAmountDollars = useMemo(() => {
    if (discountType === "percent") return subtotal * discountValue / 100;
    if (discountType === "fixed") return discountValue;
    return 0;
  }, [discountType, discountValue, subtotal]);

  const afterDiscount = useMemo(() => Math.max(0, subtotal - discountAmountDollars), [subtotal, discountAmountDollars]);
  const total = useMemo(() => afterDiscount + tax, [afterDiscount, tax]);

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

    if (cOut.existing && cOut.message) {
      setInfo(cOut.message);
    }

    // Build order payload
    const orderPayload: any = {
      customer_id: cOut.customer.id,
      intake_channel: "walk_in",
      item_type: itemType,
      width,
      height,
      units: "in",
      status: asEstimate ? "estimate" : "new_design",
      discount_type: discountType,
      discount_value: discountValue,
      tax_rate: 0.0625,
    };

    if (useComponents && components.length > 0) {
      // Phase 2C: Use component-based pricing
      orderPayload.components = components.map((c, idx) => ({
        category: c.category,
        position: idx,
        priceCodeId: c.priceCodeId || undefined,
        vendorItemId: c.vendorItemId || undefined,
        description: c.description || undefined,
        quantity: c.quantity,
        discount: c.discount || 0,
      }));
    } else {
      // Legacy: Use manual pricing with specs
      orderPayload.pricing = {
        subtotal_cents: Math.round(subtotal * 100),
        tax_cents: Math.round(tax * 100),
        total_cents: Math.round(total * 100),
      };
      orderPayload.specs = {
        frame_code: frameCode || null,
        frame_vendor: frameVendor || null,
        mat_1_code: mat1Code || null,
        mat_2_code: mat2Code || null,
        glass_type: glassType || null,
        mount_type: mountType || null,
        backing_type: backingType || null,
        spacers,
        specialty_type: specialtyType || null,
      };
    }

    const oRes = await fetch("/staff/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const oOut = await oRes.json();
    if (!oRes.ok) {
      setErr(oOut.error || "Order error");
      return;
    }

    window.location.href = `/staff/orders/${oOut.order.id}`;
  }

  const categoryOptions = [
    { value: "frame", label: "Frame / Moulding" },
    { value: "mat", label: "Mat" },
    { value: "glass", label: "Glass" },
    { value: "mounting", label: "Mounting" },
    { value: "hardware", label: "Hardware" },
    { value: "backing", label: "Backing" },
    { value: "extra", label: "Extra / Labor" },
  ];

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
              value={width || ""}
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
              value={height || ""}
              onChange={(e) => setH(Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {/* Pricing Mode Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Components & Pricing</div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useComponents}
              onChange={(e) => setUseComponents(e.target.checked)}
              className="rounded"
            />
            <span>Use automatic pricing (requires price codes)</span>
          </label>
        </div>

        {useComponents ? (
          /* Phase 2C: Component-based pricing */
          <div className="space-y-4">
            {/* Add Components */}
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => addComponent(cat.value)}
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  + {cat.label}
                </button>
              ))}
            </div>

            {/* Component List */}
            {components.length > 0 && (
              <div className="space-y-3">
                {components.map((comp, idx) => (
                  <div key={comp.id} className="rounded-xl border border-neutral-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium capitalize">{comp.category}</div>
                      <button
                        type="button"
                        onClick={() => removeComponent(comp.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Field label="Price Code">
                        <select
                          className="rounded-xl border p-2 text-sm"
                          value={comp.priceCodeId || ""}
                          onChange={(e) => updateComponent(comp.id, { priceCodeId: e.target.value || undefined })}
                        >
                          <option value="">Select price code...</option>
                          {priceCodes
                            .filter((pc) => pc.category === comp.category || comp.category === "frame" && pc.category === "moulding")
                            .map((pc) => (
                              <option key={pc.id} value={pc.id}>
                                {pc.code} - {pc.name}
                              </option>
                            ))}
                        </select>
                      </Field>

                      <Field label="Vendor Item (optional)">
                        <select
                          className="rounded-xl border p-2 text-sm"
                          value={comp.vendorItemId || ""}
                          onChange={(e) => updateComponent(comp.id, { vendorItemId: e.target.value || undefined })}
                        >
                          <option value="">Select item...</option>
                          {catalogItems
                            .filter((item) => item.category === comp.category || (comp.category === "frame" && item.category === "moulding"))
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.vendor.code} {item.itemNumber} - {item.description || item.itemNumber}
                              </option>
                            ))}
                        </select>
                      </Field>

                      <Field label="Description">
                        <input
                          className="rounded-xl border p-2 text-sm"
                          placeholder="Optional description"
                          value={comp.description || ""}
                          onChange={(e) => updateComponent(comp.id, { description: e.target.value || undefined })}
                        />
                      </Field>

                      <Field label="Quantity">
                        <input
                          type="number"
                          min={0.1}
                          step="0.1"
                          className="rounded-xl border p-2 text-sm"
                          value={comp.quantity}
                          onChange={(e) => updateComponent(comp.id, { quantity: Number(e.target.value) || 1 })}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculated Pricing Display */}
            {calculatedPricing && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <div className="font-semibold text-emerald-900">Calculated Pricing</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-emerald-700">Subtotal:</div>
                    <div className="font-semibold text-emerald-900">${(calculatedPricing.subtotal / 100).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-emerald-700">Tax:</div>
                    <div className="font-semibold text-emerald-900">${(calculatedPricing.tax / 100).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-emerald-700">Total:</div>
                    <div className="font-semibold text-emerald-900 text-lg">${(calculatedPricing.total / 100).toFixed(2)}</div>
                  </div>
                </div>
                {loadingPricing && <div className="text-xs text-emerald-700">Calculating...</div>}
              </div>
            )}
          </div>
        ) : (
          /* Legacy: Manual specs entry */
          <div className="space-y-2">
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
        )}
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <div className="text-lg font-semibold">Pricing</div>
        {!useComponents && (
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
        )}

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

        {useComponents && calculatedPricing && (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-neutral-600">Subtotal:</div>
                <div className="font-semibold text-neutral-900">${(calculatedPricing.subtotal / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-neutral-600">Tax:</div>
                <div className="font-semibold text-neutral-900">${(calculatedPricing.tax / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-neutral-600">Total:</div>
                <div className="font-semibold text-neutral-900 text-lg">${(calculatedPricing.total / 100).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
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
