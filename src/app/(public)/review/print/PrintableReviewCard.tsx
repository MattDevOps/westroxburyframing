"use client";

import { QRCodeSVG } from "qrcode.react";

const REVIEW_URL = "https://www.westroxburyframing.com/review";

export default function PrintableReviewCard() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 pt-24">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden mb-8 text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-neutral-900">
          Printable Review Card
        </h1>
        <p className="text-neutral-600 text-sm">
          Print this page and place it at the counter. The card has a QR code
          that takes customers directly to your review page.
        </p>
        <button
          onClick={() => window.print()}
          className="px-8 py-3 bg-amber-600 text-white font-semibold uppercase text-sm rounded hover:bg-amber-700 transition-colors"
        >
          Print Cards
        </button>
      </div>

      <div className="print:m-0">
        <div className="w-[4.25in] border-2 border-dashed border-neutral-300 print:border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-700 mb-1">
            Family-Owned Since 1981
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 mb-1 font-serif">
            West Roxbury Framing
          </h2>
          <p className="text-neutral-500 text-xs mb-4">
            1741 Centre St, West Roxbury, MA 02132
          </p>

          <div className="flex justify-center mb-4">
            <QRCodeSVG
              value={REVIEW_URL}
              size={140}
              level="M"
              includeMargin={false}
            />
          </div>

          <p className="text-sm font-semibold text-neutral-800 mb-1">
            Loved your framing?
          </p>
          <p className="text-xs text-neutral-500 mb-2">
            Scan the QR code to leave us a quick Google review.
          </p>
          <div className="flex justify-center gap-0.5">
            {[...Array(5)].map((_, j) => (
              <span key={j} className="text-amber-500 text-lg">
                ★
              </span>
            ))}
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            Thank you for supporting a local small business!
          </p>
        </div>
      </div>
    </div>
  );
}
