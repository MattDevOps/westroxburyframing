"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What should I bring to my consultation?",
    a: "Bring the artwork, photo, or item you'd like framed. If it's too large, bring a photo of it with approximate dimensions. If you have ideas about frame styles or colors, feel free to bring reference images.",
  },
  {
    q: "How long does a consultation take?",
    a: "Most consultations take about 15–30 minutes. We'll discuss your piece, help you choose the right frame, mat, and glass, and give you a price on the spot.",
  },
  {
    q: "Do I need an appointment?",
    a: "Walk-ins are always welcome! Appointments just guarantee dedicated time with our framing expert, especially helpful for complex projects like shadowboxes or multi-piece arrangements.",
  },
  {
    q: "How long does framing take?",
    a: "Most standard custom framing orders are ready within 5–7 business days. Rush same-day service is available for an additional fee. We'll let you know the timeline when you place your order.",
  },
  {
    q: "Is there parking?",
    a: "Yes! Free street parking is available directly in front of our shop on Centre Street, with additional parking in the municipal lot behind the building.",
  },
  {
    q: "What types of items can you frame?",
    a: "Almost anything! Art prints, photographs, diplomas, certificates, sports jerseys, military memorabilia, flags, 3D objects, mirrors, canvases, and more. If you're unsure, bring it in and we'll figure it out together.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-foreground font-medium text-sm pr-4">{q}</span>
        <ChevronDown
          size={18}
          className={`text-gold shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4 text-muted-foreground text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Book a <span className="text-gold">Consultation</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Schedule a complimentary framing consultation with us. You can meet with us in person at our shop or talk over the phone about your artwork, photos, memorabilia, or project ideas.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-2 text-sm">
            Use the calendar below to pick a day and time. You&apos;ll be able to confirm whether you prefer an in-person or phone consultation in the booking form.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-sm border border-border bg-card overflow-hidden p-3 md:p-4">
            <iframe
              title="Book a free consultation with West Roxbury Framing"
              src="https://calendly.com/jake-westroxburyframing/30min"
              className="w-full h-[780px] border-0"
            />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            If the calendar does not load, book directly at{" "}
            <a href="https://calendly.com/jake-westroxburyframing/30min" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-light underline">
              calendly.com/jake-westroxburyframing/30min
            </a>
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24 bg-secondary">
        <div className="max-w-3xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground mb-8 text-center"
          >
            Frequently Asked <span className="text-gold">Questions</span>
          </motion.h2>
          <div className="bg-card rounded-sm border border-border p-6">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
