export function nextOrderNumber(last?: string) {
  const n = last?.split("-")[1] ? parseInt(last.split("-")[1], 10) : 0;
  const next = (n + 1).toString().padStart(6, "0");
  return `WRX-${next}`;
}

export function normalizePhone(phone: string) {
  return phone.trim().replace(/[^\d+]/g, "");
}

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}
