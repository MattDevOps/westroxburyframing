"use client";

import { motion } from "framer-motion";

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
    </div>
  );
}
