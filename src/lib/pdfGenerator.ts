/**
 * Enhanced PDF generation utilities
 */

export interface PDFOptions {
  title?: string;
  type?: "order" | "invoice" | "proposal" | "report";
  blind?: boolean;
  format?: "standard" | "compact" | "detailed";
  includeBranding?: boolean;
}

export function generatePDFHTML(content: string, options: PDFOptions = {}): string {
  const {
    title = "Document",
    type = "order",
    blind = false,
    format = "standard",
    includeBranding = true,
  } = options;

  const branding = includeBranding
    ? `
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333;">
      <h1 style="font-size: 32px; font-weight: 700; margin: 0; color: #1a1a1a;">West Roxbury Framing</h1>
      <p style="font-size: 12px; color: #666; margin-top: 8px;">
        1741 Centre Street, West Roxbury, MA 02132<br />
        Phone: 617-327-3890 | Email: jake@westroxburyframing.com
      </p>
    </div>
  `
    : "";

  const compactStyles = format === "compact" ? `
    body { font-size: 10px; padding: 20px; }
    h1 { font-size: 20px; }
    h2 { font-size: 14px; }
    h3 { font-size: 12px; }
    table { font-size: 10px; }
    .header { margin-bottom: 20px; }
  ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} — West Roxbury Framing</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #222;
      padding: 40px;
      line-height: 1.6;
    }
    ${compactStyles}
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    .header-left h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #1a1a1a;
    }
    .header-right {
      text-align: right;
      font-size: 11px;
      color: #666;
    }
    .content {
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table th {
      background: #f5f5f5;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid #ddd;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      font-weight: 600;
    }
    table td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
      font-size: 12px;
    }
    table .amount {
      text-align: right;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-table td {
      padding: 6px 12px;
      font-size: 12px;
    }
    .totals-table td:first-child {
      text-align: right;
      color: #666;
    }
    .totals-table td:last-child {
      text-align: right;
      font-weight: 600;
    }
    .totals-table .total-row {
      border-top: 2px solid #222;
      font-size: 16px;
      font-weight: 700;
    }
    .totals-table .total-row td {
      padding-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 10px;
      color: #999;
    }
    @media print {
      body { padding: 20px; }
      @page {
        margin: 0.5in;
        size: letter;
      }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${branding}
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>West Roxbury Framing — Professional Custom Framing Services</p>
  </div>
</body>
</html>`;
}

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
