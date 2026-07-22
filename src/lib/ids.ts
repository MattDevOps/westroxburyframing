export function nextOrderNumber(last?: string) {
  const n = last?.split("-")[1] ? parseInt(last.split("-")[1], 10) : 0;
  const next = (n + 1).toString().padStart(6, "0");
  return `WRX-${next}`;
}

/**
 * Next invoice number, unpadded (INV-1, INV-2, ...).
 * Takes ALL existing invoice numbers and picks the numeric max, because
 * without zero-padding a lexicographic "last" is wrong (INV-9 > INV-10).
 * Handles legacy padded numbers (INV-000003) transparently.
 */
export function nextInvoiceNumber(existing: Array<string | null | undefined>) {
  let max = 0;
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
