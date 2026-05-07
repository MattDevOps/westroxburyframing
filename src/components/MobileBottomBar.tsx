"use client";

import { Phone, MapPin, Calendar } from "lucide-react";

export default function MobileBottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border">
      <div className="grid grid-cols-3 divide-x divide-border">
        <a
          href="tel:16173273890"
          className="flex flex-col items-center gap-1 py-3 text-gold hover:bg-card transition-colors"
        >
          <Phone size={20} />
          <span className="text-xs font-semibold tracking-wide uppercase">Call</span>
        </a>
        <a
          href="https://maps.google.com/?q=1741+Centre+St+West+Roxbury+MA+02132"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 py-3 text-gold hover:bg-card transition-colors"
        >
          <MapPin size={20} />
          <span className="text-xs font-semibold tracking-wide uppercase">Directions</span>
        </a>
        <a
          href="/book"
          className="flex flex-col items-center gap-1 py-3 text-gold hover:bg-card transition-colors"
        >
          <Calendar size={20} />
          <span className="text-xs font-semibold tracking-wide uppercase">Book</span>
        </a>
      </div>
    </div>
  );
}
