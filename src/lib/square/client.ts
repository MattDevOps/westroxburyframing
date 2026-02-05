const BASE =
  process.env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

// Pin a version so behavior doesn't change unexpectedly.
const SQUARE_VERSION = process.env.SQUARE_VERSION || "2025-03-19";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(ms: number) {
  // full jitter: random between 0 and ms
  return Math.floor(Math.random() * ms);
}

function isRetryableStatus(status: number) {
  // Square guidance: treat 429 as rate limit and retry after delay.
  // 5xx can be transient; retry a few times.
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function parseRetryAfterSeconds(res: Response): number | null {
  const h = res.headers.get("retry-after");
  if (!h) return null;
  const n = Number(h);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function summarizeSquareErrors(json: any): string | null {
  const errors = json?.errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;

  // Square error objects: category, code, detail, field, etc. :contentReference[oaicite:2]{index=2}
  const parts = errors
    .map((e: any) => {
      const field = e?.field ? ` field=${e.field}` : "";
      const detail = e?.detail ? `: ${e.detail}` : "";
      const code = e?.code || "UNKNOWN";
      const category = e?.category || "ERROR";
      return `${category}/${code}${field}${detail}`;
    })
    .filter(Boolean);

  return parts.length ? parts.join(" | ") : null;
}

export async function squareFetch(path: string, init: RequestInit = {}) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error("Missing SQUARE_ACCESS_TOKEN");

  const url = `${BASE}${path}`;

  // capture request body for debugging (string only; avoid logging huge blobs)
  const reqBody = typeof init.body === "string" ? init.body : undefined;

  const maxAttempts = 4; // 1 initial + 3 retries
  let attempt = 0;

  while (true) {
    attempt++;

    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": SQUARE_VERSION,
        ...(init.headers || {}),
      },
    });

    const requestId =
      res.headers.get("x-request-id") ||
      res.headers.get("x-squaretrace-id") ||
      res.headers.get("x-correlation-id") ||
      undefined;

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // leave json null
    }

    if (res.ok) return json;

    const detail =
      summarizeSquareErrors(json) ||
      json?.message ||
      text ||
      `Square error (${res.status})`;

    // Authentication errors: do not retry; fix token/env/scopes. :contentReference[oaicite:3]{index=3}
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Square ${res.status} ${path}: ${detail}` +
          (requestId ? ` | request_id=${requestId}` : "")
      );
    }

    // Non-retryable client errors (400–499 except 429)
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      throw new Error(
        `Square ${res.status} ${path}: ${detail}` +
          (requestId ? ` | request_id=${requestId}` : "") +
          (reqBody ? ` | body=${reqBody}` : "")
      );
    }

    // Retryable statuses (429 / 5xx)
    if (isRetryableStatus(res.status) && attempt < maxAttempts) {
      // Prefer Retry-After on 429 if provided, otherwise exponential backoff with jitter.
      const retryAfter = parseRetryAfterSeconds(res);
      const baseDelayMs = retryAfter != null
        ? retryAfter * 1000
        : Math.min(2000 * 2 ** (attempt - 1), 15000); // cap at 15s

      const delayMs = retryAfter != null ? baseDelayMs : jitter(baseDelayMs);

      console.warn(
        `Square retry ${attempt}/${maxAttempts - 1} for ${path} status=${res.status}` +
          (requestId ? ` request_id=${requestId}` : "") +
          ` delayMs=${delayMs} detail=${detail}`
      );

      await sleep(delayMs);
      continue;
    }

    // Out of retries or not retryable
    throw new Error(
      `Square ${res.status} ${path}: ${detail}` +
        (requestId ? ` | request_id=${requestId}` : "") +
        (reqBody ? ` | body=${reqBody}` : "")
    );
  }
}
