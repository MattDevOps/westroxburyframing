"use client";

import { useMemo, useState } from "react";
import { Check, ArrowLeft, ArrowRight, User, Maximize, Layers, Eye, Frame as FrameIcon, Receipt } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS: { num: Step; title: string; icon: any }[] = [
  { num: 1, title: "Customer", icon: User },
  { num: 2, title: "Size & Frame", icon: Maximize },
  { num: 3, title: "Mats", icon: Layers },
  { num: 4, title: "Glass", icon: Eye },
  { num: 5, title: "Mount", icon: FrameIcon },
  { num: 6, title: "Price", icon: Receipt },
];

const GLASS_OPTIONS = [
  { value: "regular", label: "Regular Clear", desc: "Standard picture glass" },
  { value: "non-glare", label: "Non-Glare", desc: "Reduces reflections" },
  { value: "uv", label: "UV Protection", desc: "Blocks fading sunlight" },
  { value: "museum", label: "Museum Glass", desc: "Best of both — anti-glare + UV" },
  { value: "acrylic", label: "Acrylic / Plexi", desc: "Lightweight, shatter-resistant" },
  { value: "optium", label: "Optium Museum Acrylic", desc: "Premium acrylic, no reflections" },
  { value: "none", label: "No Glass", desc: "Canvas or open-face" },
];

const MOUNT_OPTIONS = [
  { value: "dry", label: "Dry Mount", desc: "Heat-pressed flat to backing — for posters & photos" },
  { value: "float", label: "Float Mount", desc: "Art appears to float, edges visible" },
  { value: "stretch", label: "Canvas Stretching", desc: "Stretched over wood bars" },
  { value: "museum", label: "Museum Mount", desc: "Archival hinging — for valuable originals" },
  { value: "hinge", label: "Hinge Mount", desc: "Reversible archival mount" },
  { value: "shadow", label: "Shadow Box", desc: "Deep frame for objects, jerseys, medals" },
  { value: "none", label: "Standard / None", desc: "No special mounting" },
];

const ITEM_TYPES = [
  { value: "art", label: "Art / Print" },
  { value: "photo", label: "Photo" },
  { value: "diploma", label: "Diploma" },
  { value: "jersey", label: "Jersey" },
  { value: "memorabilia", label: "Memorabilia" },
  { value: "canvas", label: "Canvas" },
  { value: "object", label: "Object / Shadowbox" },
  { value: "medals", label: "Medals" },
  { value: "map", label: "Map" },
  { value: "restoration", label: "Restoration" },
];

export default function EasyOrderForm() {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Customer
  const [phone, setPhone] = useState("");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");

  // Item / Size / Frame
  const [itemType, setItemType] = useState("");
  const [width, setW] = useState<string>("");
  const [height, setH] = useState<string>("");
  const [frameCode, setFrameCode] = useState("");
  const [frameVendor, setFrameVendor] = useState("");

  // Mats
  const [hasMats, setHasMats] = useState<boolean | null>(null);
  const [mat1Code, setMat1Code] = useState("");
  const [mat2Code, setMat2Code] = useState("");

  // Glass
  const [glassType, setGlassType] = useState("");

  // Mount
  const [mountType, setMountType] = useState("");

  // Price
  const [subtotal, setSubtotal] = useState<string>("");
  const [includeTax, setIncludeTax] = useState(true);
  const [notesInternal, setNotesInternal] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const subtotalNum = useMemo(() => Number(subtotal) || 0, [subtotal]);
  const taxNum = useMemo(() => (includeTax ? subtotalNum * 0.0625 : 0), [subtotalNum, includeTax]);
  const totalNum = useMemo(() => subtotalNum + taxNum, [subtotalNum, taxNum]);

  function canAdvance(): boolean {
    if (step === 1) return Boolean((phone.trim() || email.trim()) && firstName.trim());
    if (step === 2) return Number(width) > 0 && Number(height) > 0;
    if (step === 3) return hasMats !== null;
    if (step === 4) return Boolean(glassType);
    if (step === 5) return Boolean(mountType);
    if (step === 6) return subtotalNum > 0;
    return true;
  }

  function next() {
    setErr(null);
    if (!canAdvance()) {
      setErr("Please fill in the highlighted fields before continuing.");
      return;
    }
    if (step < 6) setStep((step + 1) as Step);
  }

  function prev() {
    setErr(null);
    if (step > 1) setStep((step - 1) as Step);
  }

  async function createOrder(asEstimate: boolean) {
    setErr(null);
    setInfo(null);
    setSubmitting(true);

    try {
      const cRes = await fetch("/staff/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          first_name: firstName,
          last_name: lastName,
          email,
          preferred_contact: email ? "email" : "phone",
          marketing_opt_in: false,
        }),
      });

      const cOut = await cRes.json();
      if (!cRes.ok) {
        setErr(cOut.error || "Could not save customer.");
        setSubmitting(false);
        return;
      }
      if (cOut.existing && cOut.message) setInfo(cOut.message);

      const orderPayload: any = {
        customer_id: cOut.customer.id,
        intake_channel: "walk_in",
        item_type: itemType || null,
        quantity: 1,
        width: Number(width),
        height: Number(height),
        units: "in",
        status: asEstimate ? "estimate" : "new_design",
        discount_type: "none",
        discount_value: 0,
        tax_rate: includeTax ? 0.0625 : 0,
        notes_internal: notesInternal.trim() || null,
        notes_customer: null,
        pricing: {
          subtotal_cents: Math.round(subtotalNum * 100),
          tax_cents: Math.round(taxNum * 100),
          total_cents: Math.round(totalNum * 100),
        },
        specs: {
          frame_code: frameCode || null,
          frame_vendor: frameVendor || null,
          mat_1_code: hasMats ? (mat1Code || null) : null,
          mat_2_code: hasMats ? (mat2Code || null) : null,
          glass_type: glassType || null,
          mount_type: mountType === "none" ? null : (mountType || null),
          backing_type: null,
          spacers: false,
          specialty_type: null,
        },
      };

      const oRes = await fetch("/staff/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const oOut = await oRes.json();
      if (!oRes.ok) {
        setErr(oOut.error || "Could not save order.");
        setSubmitting(false);
        return;
      }

      window.location.href = `/staff/orders/${oOut.order.id}`;
    } catch (e: any) {
      setErr(e?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, idx) => {
            const isDone = step > s.num;
            const isActive = step === s.num;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => { if (isDone) setStep(s.num); }}
                  disabled={!isDone}
                  className={`flex flex-col items-center gap-1 ${isDone ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-colors ${
                      isActive
                        ? "bg-amber-600 ring-4 ring-amber-200"
                        : isDone
                        ? "bg-emerald-600"
                        : "bg-neutral-300"
                    }`}
                  >
                    {isDone ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className={`text-xs font-medium ${isActive ? "text-amber-700" : isDone ? "text-emerald-700" : "text-neutral-500"}`}>
                    {s.title}
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${step > s.num ? "bg-emerald-600" : "bg-neutral-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-neutral-900 mb-1">
          Step {step} of 6 — {STEPS[step - 1].title}
        </h2>
        <p className="text-neutral-600 text-base mb-8">{stepHint(step)}</p>

        {/* STEP 1: Customer */}
        {step === 1 && (
          <div className="space-y-5">
            <BigField label="Customer's Phone Number" required>
              <input
                type="tel"
                inputMode="tel"
                autoFocus
                placeholder="617-555-1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-2xl rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
              />
            </BigField>

            <div className="grid md:grid-cols-2 gap-5">
              <BigField label="First Name" required>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirst(e.target.value)}
                  className="w-full text-xl rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
                />
              </BigField>
              <BigField label="Last Name">
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLast(e.target.value)}
                  className="w-full text-xl rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
                />
              </BigField>
            </div>

            <BigField label="Email (optional)" hint="So we can email a receipt and pickup notice">
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xl rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
              />
            </BigField>
          </div>
        )}

        {/* STEP 2: Size & Frame */}
        {step === 2 && (
          <div className="space-y-6">
            <BigField label="What is the customer bringing in?" hint="Pick the closest match — optional but helpful">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {ITEM_TYPES.map((t) => (
                  <SelectButton
                    key={t.value}
                    selected={itemType === t.value}
                    onClick={() => setItemType(itemType === t.value ? "" : t.value)}
                  >
                    {t.label}
                  </SelectButton>
                ))}
              </div>
            </BigField>

            <div>
              <div className="text-lg font-semibold text-neutral-900 mb-3">Artwork Size (inches)</div>
              <div className="grid grid-cols-2 gap-5">
                <BigField label="Width" required>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    placeholder="e.g. 16"
                    value={width}
                    onChange={(e) => setW(e.target.value)}
                    className="w-full text-3xl text-center rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
                  />
                </BigField>
                <BigField label="Height" required>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    placeholder="e.g. 20"
                    value={height}
                    onChange={(e) => setH(e.target.value)}
                    className="w-full text-3xl text-center rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
                  />
                </BigField>
              </div>
              <div className="text-sm text-neutral-500 mt-2">Measure the visible art — not the full frame.</div>
            </div>

            <div className="border-t pt-6">
              <div className="text-lg font-semibold text-neutral-900 mb-3">Frame / Moulding</div>
              <div className="grid md:grid-cols-2 gap-5">
                <BigField label="Frame Code (SKU)" hint="e.g. LJ-2028">
                  <input
                    type="text"
                    placeholder="Frame code"
                    value={frameCode}
                    onChange={(e) => setFrameCode(e.target.value)}
                    className="w-full text-xl rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
                  />
                </BigField>
                <BigField label="Frame Vendor" hint="Larson-Juhl, Roma, etc.">
                  <input
                    type="text"
                    placeholder="Vendor"
                    value={frameVendor}
                    onChange={(e) => setFrameVendor(e.target.value)}
                    className="w-full text-xl rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
                  />
                </BigField>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Mats */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <YesNoCard
                selected={hasMats === true}
                onClick={() => setHasMats(true)}
                title="Yes, with mats"
                desc="Add a mat border around the artwork"
              />
              <YesNoCard
                selected={hasMats === false}
                onClick={() => { setHasMats(false); setMat1Code(""); setMat2Code(""); }}
                title="No mats"
                desc="Frame the artwork directly"
              />
            </div>

            {hasMats === true && (
              <div className="space-y-5 border-t pt-6">
                <BigField label="Primary Mat Code" hint="The visible mat color/SKU">
                  <input
                    type="text"
                    placeholder="e.g. C9551"
                    value={mat1Code}
                    onChange={(e) => setMat1Code(e.target.value)}
                    className="w-full text-xl rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
                  />
                </BigField>
                <BigField label="Second Mat Code (optional)" hint="For double-mat designs">
                  <input
                    type="text"
                    placeholder="Optional second mat"
                    value={mat2Code}
                    onChange={(e) => setMat2Code(e.target.value)}
                    className="w-full text-xl rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
                  />
                </BigField>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Glass */}
        {step === 4 && (
          <div className="grid md:grid-cols-2 gap-4">
            {GLASS_OPTIONS.map((g) => (
              <BigOption
                key={g.value}
                selected={glassType === g.value}
                onClick={() => setGlassType(g.value)}
                title={g.label}
                desc={g.desc}
              />
            ))}
          </div>
        )}

        {/* STEP 5: Mount */}
        {step === 5 && (
          <div className="grid md:grid-cols-2 gap-4">
            {MOUNT_OPTIONS.map((m) => (
              <BigOption
                key={m.value}
                selected={mountType === m.value}
                onClick={() => setMountType(m.value)}
                title={m.label}
                desc={m.desc}
              />
            ))}
          </div>
        )}

        {/* STEP 6: Price + Notes */}
        {step === 6 && (
          <div className="space-y-6">
            <BigField label="Price (before tax)" required hint="Enter the agreed price for the job">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-neutral-400">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  className="w-full text-3xl rounded-xl border-2 border-neutral-300 p-4 pl-12 focus:border-amber-600 focus:outline-none"
                  autoFocus
                />
              </div>
            </BigField>

            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-neutral-200 cursor-pointer hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="w-6 h-6 accent-amber-600"
              />
              <span className="text-lg font-medium text-neutral-900">
                Add 6.25% MA sales tax
              </span>
            </label>

            <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-6 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="text-neutral-700">Subtotal</span>
                <span className="font-semibold">${subtotalNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-neutral-700">Tax</span>
                <span className="font-semibold">${taxNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl pt-2 border-t border-amber-300">
                <span className="font-bold text-neutral-900">Total</span>
                <span className="font-bold text-amber-800">${totalNum.toFixed(2)}</span>
              </div>
            </div>

            <BigField label="Notes (optional)" hint="Reminders for staff — won't be shown to the customer">
              <textarea
                placeholder="e.g. Rush job for Friday, customer prefers extra wide mat"
                value={notesInternal}
                onChange={(e) => setNotesInternal(e.target.value)}
                rows={3}
                className="w-full text-lg rounded-xl border-2 border-neutral-300 p-4 focus:border-amber-600 focus:outline-none"
              />
            </BigField>

            {/* Summary */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-5 text-sm space-y-1">
              <div className="font-semibold text-neutral-700 mb-2">Order Summary</div>
              <SummaryRow label="Customer" value={`${firstName} ${lastName}`.trim() || "—"} />
              <SummaryRow label="Phone" value={phone || "—"} />
              <SummaryRow label="Item" value={ITEM_TYPES.find(t => t.value === itemType)?.label || "—"} />
              <SummaryRow label="Size" value={width && height ? `${width} × ${height} in` : "—"} />
              <SummaryRow label="Frame" value={frameCode || "—"} />
              <SummaryRow label="Mats" value={hasMats ? (mat1Code || "Yes") + (mat2Code ? ` + ${mat2Code}` : "") : "No mats"} />
              <SummaryRow label="Glass" value={GLASS_OPTIONS.find(g => g.value === glassType)?.label || "—"} />
              <SummaryRow label="Mount" value={MOUNT_OPTIONS.find(m => m.value === mountType)?.label || "—"} />
            </div>
          </div>
        )}

        {info && (
          <div className="mt-6 rounded-xl border-2 border-blue-300 bg-blue-50 p-4 text-base text-blue-800">
            {info}
          </div>
        )}
        {err && (
          <div className="mt-6 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-base text-red-800">
            {err}
          </div>
        )}

        {/* Footer buttons */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
          <button
            type="button"
            onClick={prev}
            disabled={step === 1 || submitting}
            className="flex items-center gap-2 rounded-xl border-2 border-neutral-300 px-6 py-4 text-lg font-semibold text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance() || submitting}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-8 py-4 text-lg font-bold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => createOrder(true)}
                disabled={!canAdvance() || submitting}
                className="rounded-xl border-2 border-amber-600 px-6 py-4 text-lg font-semibold text-amber-700 bg-white hover:bg-amber-50 disabled:opacity-50"
              >
                Save as Estimate
              </button>
              <button
                type="button"
                onClick={() => createOrder(false)}
                disabled={!canAdvance() || submitting}
                className="rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Create Order"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function stepHint(step: Step): string {
  switch (step) {
    case 1: return "Who is this order for? Phone or email lets us look up returning customers.";
    case 2: return "How big is the artwork, and what frame are you using?";
    case 3: return "Will this piece have mats around it?";
    case 4: return "Pick the type of glass that goes in front.";
    case 5: return "How is the artwork being mounted inside the frame?";
    case 6: return "Set the price, add any notes, and create the order.";
  }
}

function BigField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-base font-semibold text-neutral-800 mb-2">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
      {hint && <div className="text-sm text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}

function SelectButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-3 py-3 text-base font-medium transition-all ${
        selected
          ? "border-amber-600 bg-amber-50 text-amber-900"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

function YesNoCard({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-6 text-left transition-all ${
        selected
          ? "border-amber-600 bg-amber-50 ring-4 ring-amber-100"
          : "border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            selected ? "border-amber-600 bg-amber-600" : "border-neutral-400"
          }`}
        >
          {selected && <Check className="w-4 h-4 text-white" />}
        </div>
        <div>
          <div className="text-xl font-bold text-neutral-900">{title}</div>
          <div className="text-sm text-neutral-600 mt-1">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function BigOption({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-5 text-left transition-all ${
        selected
          ? "border-amber-600 bg-amber-50 ring-2 ring-amber-200"
          : "border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            selected ? "border-amber-600 bg-amber-600" : "border-neutral-400"
          }`}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <div>
          <div className="text-lg font-bold text-neutral-900">{title}</div>
          <div className="text-sm text-neutral-600 mt-0.5">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900 font-medium text-right">{value}</span>
    </div>
  );
}
