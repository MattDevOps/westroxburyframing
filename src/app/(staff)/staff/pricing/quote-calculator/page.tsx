"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SIZE_BANDS,
  MOULDING_GRADES,
  GLAZING,
  MOUNTING,
  MAT_ADDONS,
  HANDLING,
  PREP,
  MINIMUM_JOB,
  OVERSIZE_NOTE,
  MARKET_ANCHOR,
  DEFAULT_FLOOR_MULTIPLE,
  unitedInches,
  bandForUI,
  calcQuote,
  counterScript,
  type Option,
} from "@/lib/quotePricing";

function money(n: number): string {
  return `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(0)}`;
}

export default function QuoteCalculatorPage() {
  const [width, setWidth] = useState("16");
  const [height, setHeight] = useState("20");
  const [mouldingId, setMouldingId] = useState("standard");
  const [glazingId, setGlazingId] = useState("regular");
  const [mountingId, setMountingId] = useState("standard");
  const [matAddonIds, setMatAddonIds] = useState<string[]>([]);
  const [openings, setOpenings] = useState("1");
  const [handlingIds, setHandlingIds] = useState<string[]>([]);
  const [prepIds, setPrepIds] = useState<string[]>([]);
  const [competitorQuote, setCompetitorQuote] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const [copied, setCopied] = useState(false);

  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const ui = w > 0 && h > 0 ? unitedInches(w, h) : 0;
  const band = ui > 0 ? bandForUI(ui) : null;
  const oversize = ui > 0 && !band;

  const result = useMemo(
    () =>
      calcQuote({
        bandId: band?.id ?? null,
        mouldingId,
        glazingId,
        mountingId,
        matAddonIds,
        openings: parseInt(openings) || 1,
        handlingIds,
        prepIds,
      }),
    [band?.id, mouldingId, glazingId, mountingId, matAddonIds, openings, handlingIds, prepIds],
  );

  const prepLabels = PREP.filter((p) => prepIds.includes(p.id)).map((p) => p.label);
  const script = counterScript(result, prepLabels);

  const compQuote = parseFloat(competitorQuote) || 0;
  const underPct =
    compQuote > 0 && result.total > 0
      ? Math.round(((compQuote - result.total) / compQuote) * 100)
      : null;

  const cost = parseFloat(materialCost) || 0;
  const floor = cost > 0 ? cost * DEFAULT_FLOOR_MULTIPLE : 0;
  const belowFloor = floor > 0 && result.total < floor;

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quote Calculator</h1>
          <p className="text-neutral-600 text-sm mt-1">
            Market-anchored quote — positioned under Big Picture, with prep work added on.{" "}
            <span className="text-amber-700">Draft v1 pricing.</span>
          </p>
        </div>
        <Link href="/staff/pricing" className="text-sm text-neutral-500 hover:text-neutral-900 underline">
          ← Back to Pricing
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Inputs ───────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Size */}
          <Section title="Size">
            <div className="flex items-end gap-3">
              <NumField label="Width (in)" value={width} onChange={setWidth} />
              <span className="pb-2 text-neutral-400">×</span>
              <NumField label="Height (in)" value={height} onChange={setHeight} />
              <div className="pb-1 text-sm text-neutral-600">
                {ui > 0 && (
                  <>
                    = <span className="font-semibold text-neutral-900">{ui} UI</span>
                    {band && <span className="text-neutral-500"> · base {money(band.base)}</span>}
                    {oversize && <span className="text-amber-700"> · oversize</span>}
                  </>
                )}
              </div>
            </div>
            {oversize && <p className="mt-2 text-sm text-amber-700">{OVERSIZE_NOTE}</p>}
          </Section>

          <SelectSection title="Moulding grade" options={MOULDING_GRADES} value={mouldingId} onChange={setMouldingId} />
          <SelectSection title="Glass / glazing" options={GLAZING} value={glazingId} onChange={setGlazingId} />
          <SelectSection title="Mounting" options={MOUNTING} value={mountingId} onChange={setMountingId} />

          {/* Mats */}
          <Section title="Matting">
            <div className="space-y-2">
              {MAT_ADDONS.map((m) => (
                <CheckRow key={m.id} opt={m} checked={matAddonIds.includes(m.id)} onToggle={() => toggle(matAddonIds, setMatAddonIds, m.id)} />
              ))}
              <div className="flex items-center gap-2 pt-1">
                <label className="text-sm text-neutral-700">Total mat openings</label>
                <input
                  type="number"
                  min={1}
                  value={openings}
                  onChange={(e) => setOpenings(e.target.value)}
                  className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                />
                <span className="text-xs text-neutral-500">extra openings add $12 each + $10 design</span>
              </div>
            </div>
          </Section>

          <CheckSection title="Special handling" options={HANDLING} selected={handlingIds} onToggle={(id) => toggle(handlingIds, setHandlingIds, id)} />
          <CheckSection title="Condition & prep work" options={PREP} selected={prepIds} onToggle={(id) => toggle(prepIds, setPrepIds, id)} />

          {/* Sanity checks */}
          <Section title="Sanity checks (optional)">
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Competitor's quote $" value={competitorQuote} onChange={setCompetitorQuote} placeholder="e.g. 175" />
              <NumField label="Your material cost $" value={materialCost} onChange={setMaterialCost} placeholder="e.g. 35" />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Competitor quote shows how far under market you are. Material cost sets a profit floor (cost × {DEFAULT_FLOOR_MULTIPLE}).
            </p>
          </Section>
        </div>

        {/* ── Result ───────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-4 self-start space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Quote</div>

            {result.lines.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">Enter a size to start.</p>
            ) : (
              <>
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {result.lines.map((l, i) => (
                      <tr key={i} className="border-b border-neutral-100 last:border-0">
                        <td className="py-1.5 text-neutral-700">{l.label}</td>
                        <td className="py-1.5 text-right tabular-nums text-neutral-900">{money(l.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 space-y-1 text-sm">
                  <Row label="Framing" value={money(result.base)} />
                  {result.prepTotal > 0 && <Row label="Prep work" value={money(result.prepTotal)} />}
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-200 flex items-baseline justify-between">
                  <span className="text-base font-semibold text-neutral-900">Total</span>
                  <span className="text-3xl font-bold text-neutral-900 tabular-nums">{money(result.total)}</span>
                </div>
                {result.hitMinimum && (
                  <p className="mt-1 text-xs text-amber-700">Bumped to ${MINIMUM_JOB} shop minimum.</p>
                )}

                {/* Market position */}
                <div className="mt-4 rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm">
                  {underPct !== null ? (
                    <span className={underPct >= 0 ? "text-green-700" : "text-red-700"}>
                      {underPct >= 0 ? `${underPct}% under` : `${Math.abs(underPct)}% OVER`} their ${compQuote.toFixed(0)} quote.
                    </span>
                  ) : (
                    <span className="text-neutral-600">Market anchor: {MARKET_ANCHOR.label}.</span>
                  )}
                  {belowFloor && (
                    <div className="mt-1 text-red-700 font-medium">
                      ⚠ Below profit floor (${floor.toFixed(0)} = cost × {DEFAULT_FLOOR_MULTIPLE}). Don&apos;t go lower.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Counter script */}
          {result.lines.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-500 uppercase tracking-wide">What to say</div>
                <button onClick={copyScript} className="text-xs text-neutral-500 hover:text-neutral-900 underline">
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">{script}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small UI helpers ───────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="text-sm font-medium text-neutral-900 mb-3">{title}</div>
      {children}
    </div>
  );
}

function SelectSection({ title, options, value, onChange }: { title: string; options: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <Section title={title}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
            {o.price !== 0 ? ` (${o.price > 0 ? "+" : ""}$${o.price})` : ""}
            {o.note ? ` — ${o.note}` : ""}
          </option>
        ))}
      </select>
    </Section>
  );
}

function CheckSection({ title, options, selected, onToggle }: { title: string; options: Option[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <Section title={title}>
      <div className="space-y-2">
        {options.map((o) => (
          <CheckRow key={o.id} opt={o} checked={selected.includes(o.id)} onToggle={() => onToggle(o.id)} />
        ))}
      </div>
    </Section>
  );
}

function CheckRow({ opt, checked, onToggle }: { opt: Option; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onToggle} className="rounded border-neutral-300" />
      <span className="flex-1">{opt.label}</span>
      <span className="text-neutral-500 tabular-nums">
        +${opt.price}
        {opt.note ? <span className="text-xs text-neutral-400"> {opt.note}</span> : null}
      </span>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-600">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function NumField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-neutral-600">{label}</span>
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
    </label>
  );
}
