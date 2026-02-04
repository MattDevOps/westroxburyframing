const BASE =
  process.env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

const SQUARE_VERSION = process.env.SQUARE_VERSION || "2024-01-18";

export async function squareFetch(path: string, init: RequestInit = {}) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error("Missing SQUARE_ACCESS_TOKEN");

  const reqBody =
    typeof init.body === "string"
      ? init.body
      : init.body
      ? JSON.stringify(init.body)
      : undefined;

  const { body, ...restInit } = init;

  const res = await fetch(`${BASE}${path}`, {
    ...restInit,
    body: reqBody,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Square-Version": SQUARE_VERSION,
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const sqErrors = json?.errors
      ?.map((e: any) => e?.detail || e?.code)
      .filter(Boolean);

    const detail =
      (sqErrors?.length ? sqErrors.join(" | ") : null) ||
      json?.message ||
      text ||
      `Square error (${res.status})`;

    throw new Error(
      `Square ${res.status} ${path}: ${detail}${reqBody ? " | body=" + reqBody : ""}`
    );
  }

  return json;
}
