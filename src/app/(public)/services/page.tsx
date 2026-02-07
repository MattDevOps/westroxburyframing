"use client";

import { motion } from "framer-motion";

const SERVICES = [
  { title: "Custom & Handmade Frames", body: "Choose from hundreds of different styles, finishes (wood and aluminum), colors, and designs to suit your needs." },
  { title: "Matting", body: "Preservation/Conservation of many types, styles, and frame designs." },
  { title: "Mounting", body: "Dry mounting, floating mounting, and shadow boxing, among others." },
  { title: "Insurance Repair & Replace", body: "Repair art and frames covered by insurance — we will repair or replace." },
  { title: "UV Light Protection", body: "We offer various types of glass to suit your art and long-time preservation — from quality picture clear to non-glare to UV protection and the ultimate museum glass." },
  { title: "Glazing", body: "Specializing in a number of types of glazing, including: Premium Clear, Non Glare, Acrylic/Plexi/UV, Optium Museum Acrylic, Conservation UV Protection, Mirrors, Museum Glass." },
  { title: "Acrylic Boxes", body: "Protect fragile valuables, artwork, and keepsakes with sturdy construction." },
  { title: "Stretching Of Paintings", body: "Paintings stretched to fit frames; repair of damaged paintings." },
  { title: "Repair & Restoration", body: "We take old, damaged, or faded photographs and bring them back to life with careful restoration so they look clean, clear, and flawless again." },
  { title: "Canvas Stretching", body: "We can fit your canvas pictures onto a new frame." },
  { title: "Budget Framing", body: "Our experts will work to determine the best framing solution for you and keep it within your budget." },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Our <span className="text-gold">Services</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We have been serving Boston and its surrounding communities for over 40 years, specializing in both residential and corporate accounts. We also have a focus on restorations and repairs of all types.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground mb-12"
          >
            What We <span className="text-gold">Offer</span>
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card p-8 rounded-sm border border-border hover:border-gold/30 transition-colors"
              >
                <h3 className="font-serif text-xl text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
