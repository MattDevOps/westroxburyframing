export function nextOrderNumber(last?: string) {
  const n = last?.split("-")[1] ? parseInt(last.split("-")[1], 10) : 0;
  const next = (n + 1).toString().padStart(6, "0");
  return `WRX-${next}`;
}

/**
 * Next invoice number: 6 digits starting at 100001 (INV-100001, INV-100002, ...)
 * so numbers never lead with a zero. Takes ALL existing invoice numbers and
 * picks the numeric max rather than a lexicographic "last", which is safe
 * across legacy formats (INV-000003, INV-3) and beyond 999999.
 */
const INVOICE_NUMBER_BASE = 100000;

export function nextInvoiceNumber(existing: Array<string | null | undefined>) {
  let max = INVOICE_NUMBER_BASE;
  for (const num of existing) {
    const n = num?.split("-")[1] ? parseInt(num.split("-")[1], 10) : 0;
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `INV-${max + 1}`;
}

export function normalizePhone(phone: string) {
  return phone.trim().replace(/[^\d+]/g, "");
}

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}
