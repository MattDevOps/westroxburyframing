// Market-anchored quote pricing — DRAFT v1.
//
// This is the single source of truth for the staff Quote Calculator and the
// printed quote card (docs/pricing/quote-card.md). It is a TOP-DOWN model:
// start from a base positioned ~10-15% under Big Picture Framing, then stack
// the upgrades and prep the job actually needs. (The Vendors / Price Codes
// system is the separate BOTTOM-UP, cost-from-wholesale model.)
//
// Every number here is a draft — edit freely. When you have wholesale costs,
// they feed the optional floor check in the calculator, not this table.

export type SizeBand = {
  id: string;
  label: string;
  maxUI: number; // upper bound, united inches (width + height)
  base: number; // standard moulding + regular glass + single mat + fitting
};

export const SIZE_BANDS: SizeBand[] = [
  { id: "xs", label: "up to 20 UI — e.g. 8x10", maxUI: 20, base: 90 },
  { id: "s", label: "up to 30 UI — e.g. 11x14", maxUI: 30, base: 115 },
  { id: "m", label: "up to 40 UI — e.g. 16x20", maxUI: 40, base: 135 },
  { id: "l", label: "up to 50 UI — e.g. 18x24", maxUI: 50, base: 160 },
  { id: "xl", label: "up to 65 UI — e.g. 24x36", maxUI: 65, base: 250 },
];

export const MINIMUM_JOB = 45;
export const OVERSIZE_NOTE = "66+ united inches — price per UI, quote by hand.";

// Competitor anchor used for the "you're X% under market" readout.
export const MARKET_ANCHOR = { label: "Big Picture (avg ~$155)", typical: 155 };

// Default profit-floor multiple applied to material cost when staff enter one.
export const DEFAULT_FLOOR_MULTIPLE = 3;

export type Option = { id: string; label: string; price: number; note?: string };

// Single-select groups (replace the base assumption)
export const MOULDING_GRADES: Option[] = [
  { id: "economy", label: "Economy", price: -15 },
  { id: "standard", label: "Standard", price: 0 },
  { id: "premium", label: "Premium hardwood / wide", price: 40 },
  { id: "designer", label: "Designer / closed-corner / gilt", price: 0, note: "quote by hand" },
];

export const GLAZING: Option[] = [
  { id: "regular", label: "Regular glass", price: 0 },
  { id: "uv", label: "Conservation / UV (99% UV block)", price: 45 },
  { id: "museum", label: "Museum / anti-reflective", price: 120 },
  { id: "acrylic", label: "Acrylic (large or shippable)", price: 35 },
];

export const MOUNTING: Option[] = [
  { id: "standard", label: "Standard backing", price: 0 },
  { id: "conservation", label: "Conservation / hinged (acid-free)", price: 30 },
  { id: "drymount", label: "Dry mount / flatten", price: 30 },
  { id: "float", label: "Float mount", price: 40 },
];

// Multi-select groups (each checked option adds its price)
export const MAT_ADDONS: Option[] = [
  { id: "double", label: "Double mat", price: 25 },
  { id: "fabric", label: "Fabric / suede / specialty mat", price: 45 },
  { id: "vgroove", label: "V-groove", price: 20 },
];
export const EXTRA_OPENING_PRICE = 12; // per opening beyond the first
export const EXTRA_OPENING_DESIGN_FEE = 10; // one-time when more than one opening

export const HANDLING: Option[] = [
  { id: "shadowbox", label: "Shadowbox / 3D object", price: 85 },
  { id: "jersey", label: "Jersey / memorabilia mount", price: 130 },
  { id: "spacers", label: "Spacers / float glass off art", price: 25 },
];

// Condition & prep — the "before I can frame it right" work.
export const PREP: Option[] = [
  { id: "clean", label: "Light surface cleaning", price: 40 },
  { id: "restretch", label: "Tighten / re-stretch existing canvas", price: 50 },
  { id: "stretch", label: "Stretch raw canvas (small)", price: 70 },
  { id: "stretchlg", label: "Stretch raw canvas (large)", price: 120 },
  { id: "repair", label: "Tear / surface repair", price: 50, note: "from — assess case by case" },
  { id: "flatten", label: "Flatten rolled art", price: 35 },
];

export function unitedInches(width: number, height: number): number {
  return Math.round(width + height);
}

export function bandForUI(ui: number): SizeBand | null {
  return SIZE_BANDS.find((b) => ui <= b.maxUI) ?? null;
}

export type QuoteSelection = {
  bandId: string | null;
  mouldingId: string;
  glazingId: string;
  mountingId: string;
  matAddonIds: string[];
  openings: number; // total mat openings (1 = single)
  handlingIds: string[];
  prepIds: string[];
};

export type LineItem = { label: string; amount: number };

export type QuoteResult = {
  lines: LineItem[];
  base: number; // base + moulding/glass/mat/mount/handling (the framing job)
  prepTotal: number; // condition & prep work
  total: number;
  hitMinimum: boolean;
};

function opt(group: Option[], id: string): Option | undefined {
  return group.find((o) => o.id === id);
}

export function calcQuote(sel: QuoteSelection): QuoteResult {
  const lines: LineItem[] = [];
  const band = sel.bandId ? SIZE_BANDS.find((b) => b.id === sel.bandId) : null;

  let base = 0;
  if (band) {
    base += band.base;
    lines.push({ label: `Base (${band.label})`, amount: band.base });
  }

  const moulding = opt(MOULDING_GRADES, sel.mouldingId);
  if (moulding && moulding.price !== 0) {
    base += moulding.price;
    lines.push({ label: `Moulding: ${moulding.label}`, amount: moulding.price });
  }

  const glazing = opt(GLAZING, sel.glazingId);
  if (glazing && glazing.price !== 0) {
    base += glazing.price;
    lines.push({ label: `Glass: ${glazing.label}`, amount: glazing.price });
  }

  for (const id of sel.matAddonIds) {
    const m = opt(MAT_ADDONS, id);
    if (m) {
      base += m.price;
      lines.push({ label: `Mat: ${m.label}`, amount: m.price });
    }
  }

  const extraOpenings = Math.max(0, (sel.openings || 1) - 1);
  if (extraOpenings > 0) {
    const amount = extraOpenings * EXTRA_OPENING_PRICE + EXTRA_OPENING_DESIGN_FEE;
    base += amount;
    lines.push({
      label: `Multi-opening: ${extraOpenings} extra @ $${EXTRA_OPENING_PRICE} + $${EXTRA_OPENING_DESIGN_FEE} design`,
      amount,
    });
  }

  const mounting = opt(MOUNTING, sel.mountingId);
  if (mounting && mounting.price !== 0) {
    base += mounting.price;
    lines.push({ label: `Mounting: ${mounting.label}`, amount: mounting.price });
  }

  for (const id of sel.handlingIds) {
    const h = opt(HANDLING, id);
    if (h) {
      base += h.price;
      lines.push({ label: `Handling: ${h.label}`, amount: h.price });
    }
  }

  let prepTotal = 0;
  for (const id of sel.prepIds) {
    const p = opt(PREP, id);
    if (p) {
      prepTotal += p.price;
      lines.push({ label: `Prep: ${p.label}`, amount: p.price });
    }
  }

  let total = base + prepTotal;
  let hitMinimum = false;
  if (band && total < MINIMUM_JOB) {
    total = MINIMUM_JOB;
    hitMinimum = true;
  }

  return { lines, base, prepTotal, total, hitMinimum };
}

// Auto-builds the counter explanation from the quote.
export function counterScript(r: QuoteResult, prepLabels: string[]): string {
  if (r.prepTotal > 0) {
    const work =
      prepLabels.length > 1
        ? prepLabels.slice(0, -1).join(", ") + " and " + prepLabels[prepLabels.length - 1]
        : prepLabels[0] || "some prep work";
    return (
      `For a piece this size I'm usually around $${r.base}, and that already beats Big Picture ` +
      `and the shops downtown. But before I can frame it right it needs ${work.toLowerCase()} — ` +
      `that's another $${r.prepTotal}, so $${r.total} done properly. I can do the quick version for ` +
      `$${r.base}, but it won't come out as nice, and I don't put my name on work like that. ` +
      `Done right it'll be perfect — that's how I'd want it if it were mine.`
    );
  }
  return (
    `For a piece like this I'm at $${r.total} — and that already beats Big Picture and the ` +
    `shops downtown. Built right, built to last.`
  );
}
