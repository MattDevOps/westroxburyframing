"use client";

import { useEffect } from "react";
import { SITE } from "@/lib/site";

export default function AppointmentPage() {
  useEffect(() => {
    if (document.getElementById("calendly-inline")) return;

    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    s.id = "calendly-inline";
    document.body.appendChild(s);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-white">Book an appointment</h1>
      <p className="mt-2 text-neutral-400">
        Choose a time for a custom framing consultation.
      </p>

      <div
        className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/30 p-2"
        style={{ minHeight: 720 }}
      >
        <div
          className="calendly-inline-widget"
          data-url={SITE.calendlyUrl}
          style={{ minHeight: 720 }}
        />
      </div>
    </div>
  );
}
