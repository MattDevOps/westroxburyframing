import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface GiftCertificatePdfInput {
  certificateNumber: string;
  redemptionCode: string;
  amountCents: number;
  recipientName: string;
  purchasedByName: string;
  message?: string | null;
  issuedAt: Date;
}

const BRAND_GOLD = rgb(0.722, 0.525, 0.043);
const BRAND_BLACK = rgb(0.102, 0.102, 0.102);
const SOFT_GREY = rgb(0.45, 0.45, 0.45);
const PAGE_W = 612;
const PAGE_H = 396;

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function drawCentered(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  opts: { y: number; size: number; font: any; color?: any }
) {
  const w = opts.font.widthOfTextAtSize(text, opts.size);
  page.drawText(text, {
    x: (PAGE_W - w) / 2,
    y: opts.y,
    size: opts.size,
    font: opts.font,
    color: opts.color || BRAND_BLACK,
  });
}

export async function generateGiftCertificatePdf(input: GiftCertificatePdfInput): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`West Roxbury Framing Gift Certificate ${input.certificateNumber}`);
  pdf.setAuthor("West Roxbury Framing");
  pdf.setSubject("Gift Certificate");

  const page = pdf.addPage([PAGE_W, PAGE_H]);

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  // Outer gold border
  page.drawRectangle({
    x: 18, y: 18, width: PAGE_W - 36, height: PAGE_H - 36,
    borderColor: BRAND_GOLD, borderWidth: 2,
  });
  // Inner thin border
  page.drawRectangle({
    x: 26, y: 26, width: PAGE_W - 52, height: PAGE_H - 52,
    borderColor: BRAND_GOLD, borderWidth: 0.5,
  });

  // Brand title
  drawCentered(page, "West Roxbury Framing", { y: PAGE_H - 60, size: 22, font: serifBold });

  // Tagline
  drawCentered(page, "Custom Framing  ·  1741 Centre Street  ·  Boston, MA", {
    y: PAGE_H - 80, size: 9, font: serif, color: SOFT_GREY,
  });

  // Divider
  page.drawLine({
    start: { x: 110, y: PAGE_H - 95 },
    end: { x: PAGE_W - 110, y: PAGE_H - 95 },
    color: BRAND_GOLD, thickness: 0.7,
  });

  // "GIFT CERTIFICATE"
  drawCentered(page, "GIFT CERTIFICATE", { y: PAGE_H - 125, size: 14, font: serifBold, color: BRAND_GOLD });

  // Amount
  drawCentered(page, formatMoney(input.amountCents), {
    y: PAGE_H - 180, size: 56, font: serifBold,
  });

  // "Presented to"
  drawCentered(page, "Presented to", { y: PAGE_H - 215, size: 10, font: serif, color: SOFT_GREY });
  drawCentered(page, input.recipientName, { y: PAGE_H - 235, size: 18, font: serifBold });

  // "From"
  drawCentered(page, `From ${input.purchasedByName}`, {
    y: PAGE_H - 255, size: 11, font: serifItalic, color: SOFT_GREY,
  });

  // Optional message
  if (input.message && input.message.trim()) {
    // Wrap to ~60 chars
    const msg = input.message.trim().slice(0, 180);
    const wrapped: string[] = [];
    let line = "";
    for (const word of msg.split(/\s+/)) {
      if ((line + " " + word).trim().length > 70) {
        wrapped.push(line.trim());
        line = word;
      } else {
        line = (line + " " + word).trim();
      }
    }
    if (line) wrapped.push(line);
    const start = PAGE_H - 280;
    wrapped.slice(0, 2).forEach((ln, i) => {
      drawCentered(page, `"${ln}"`, {
        y: start - i * 14, size: 10, font: serifItalic, color: BRAND_BLACK,
      });
    });
  }

  // Footer block: code + cert # + date
  const footerY = 65;
  drawCentered(page, "Redemption Code", {
    y: footerY + 22, size: 8, font: serif, color: SOFT_GREY,
  });
  drawCentered(page, input.redemptionCode, {
    y: footerY + 6, size: 16, font: mono, color: BRAND_BLACK,
  });

  // Left foot: certificate number
  page.drawText(`Certificate: ${input.certificateNumber}`, {
    x: 50, y: 42, size: 8, font: serif, color: SOFT_GREY,
  });
  // Right foot: issued date
  const issued = `Issued ${formatDate(input.issuedAt)}`;
  page.drawText(issued, {
    x: PAGE_W - 50 - serif.widthOfTextAtSize(issued, 8),
    y: 42, size: 8, font: serif, color: SOFT_GREY,
  });

  // Bottom-most: usage note
  drawCentered(page, "Redeem at West Roxbury Framing  ·  (617) 327-3890  ·  westroxburyframing.com", {
    y: 32, size: 7.5, font: serif, color: SOFT_GREY,
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
