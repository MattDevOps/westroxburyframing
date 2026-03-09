"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";

declare global {
  interface Window {
    Calendly?: any;
  }
}

function loadCalendlyScript() {
  return new Promise<void>((resolve) => {
    if (document.getElementById("calendly-widget")) return resolve();

    const s = document.createElement("script");
    s.id = "calendly-widget";
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

export default function CalendlyButton({ label = "Book an appointment" }: { label?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadCalendlyScript().then(() => setReady(true));
  }, []);

  return (
    <button
      className="rounded-xl bg-white text-black px-4 py-2 text-sm hover:bg-neutral-200 disabled:opacity-60"
      disabled={!ready || !SITE.calendlyUrl.includes("calendly.com")}
      onClick={() => {
        if (!window.Calendly) return;
        window.Calendly.initPopupWidget({ url: SITE.calendlyUrl });
      }}
    >
      {label}
    </button>
  );
}
