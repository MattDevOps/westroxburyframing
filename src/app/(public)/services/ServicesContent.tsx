"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Frame, Layers, Maximize, Wrench, Shield, Sparkles, Scissors, Box, PaintBucket, Gem, DollarSign } from "lucide-react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const SERVICES = [
  {
    icon: Frame,
    title: "Custom Picture Framing",
    body: "Choose from hundreds of moulding profiles in wood, metal, and specialty finishes. Every frame is cut, joined, and assembled by hand in our West Roxbury shop to perfectly complement your artwork, photograph, or memorabilia. We handle everything from small 4×6 photos to oversized gallery pieces.",
  },
  {
    icon: Layers,
    title: "Custom Matting & Mat Cutting",
    body: "Precision-cut mats in single, double, or triple layers to give your piece depth and visual impact. We carry acid-free and conservation-grade mat boards in hundreds of colors and textures to protect your art from deterioration and create a clean, finished presentation.",
  },
  {
    icon: Maximize,
    title: "Mounting & Floating",
    body: "Professional dry mounting, wet mounting, floating, and hinge mounting for prints, posters, photographs, and fine art on paper. We also build custom shadow boxes for three-dimensional objects like jerseys, medals, flags, and keepsakes — displayed exactly the way you envision.",
  },
  {
    icon: Shield,
    title: "Glass & Glazing Options",
    body: "We offer a full range of glazing to suit every need and budget: premium clear glass, non-glare glass, UV-filtering conservation glass, anti-reflective museum glass, acrylic/Plexiglas, and Optium Museum Acrylic. UV protection helps preserve colors and prevent fading for decades.",
  },
  {
    icon: Sparkles,
    title: "Photo & Frame Restoration",
    body: "Bring old, damaged, or faded photographs and frames back to life. We provide digital photo repair, antique photo restoration, frame refinishing, and structural repairs. Whether it's water damage, tears, foxing, or a broken frame — we can restore it to display-ready condition.",
  },
  {
    icon: Scissors,
    title: "Canvas Stretching",
    body: "Rolled or unstretched canvas paintings and prints stretched taut over custom-built wooden stretcher bars. We also re-stretch sagging or warped canvases and build gallery-wrap frames so your canvas can hang without a traditional frame.",
  },
  {
    icon: Box,
    title: "Shadow Boxes & Acrylic Cases",
    body: "Custom-built shadow boxes and acrylic display cases for sports jerseys, military memorabilia, wedding keepsakes, baby items, and collectibles. Sturdy construction with UV-protective glazing keeps your valuables safe while showing them off beautifully.",
  },
  {
    icon: Wrench,
    title: "Insurance Repair & Replacement",
    body: "Damaged art or frames from a move, flood, or accident? We work directly with insurance claims to repair or replace damaged framing. Bring in your piece for a free assessment — we'll provide an itemized estimate for your insurance provider.",
  },
  {
    icon: Gem,
    title: "Conservation & Museum Framing",
    body: "Archival-quality framing for valuable artwork, antiques, diplomas, ketubahs, and documents. We use only acid-free materials, UV-filtering glazing, and reversible mounting techniques that meet museum conservation standards to protect your investment for generations.",
  },
  {
    icon: PaintBucket,
    title: "Specialty Services",
    body: "Mirror framing and tabletop glass, oval and circle-shaped frames and mats, custom engraved plaques and name tags, scanning and digital reproduction services, and rush same-day framing when you need it fast.",
  },
  {
    icon: DollarSign,
    title: "Budget-Friendly Framing",
    body: "Quality custom framing doesn't have to break the bank. Our experts will work with you to find the best frame, mat, and glass combination that looks great and fits your budget. We also offer volume discounts for businesses and organizations.",
  },
];

const FAQS = [
  {
    q: "How much does custom framing cost?",
    a: "Custom framing typically ranges from $80–$400+ depending on the frame moulding, mat, glass type, and size. We provide free quotes on the spot — just bring your piece in and we'll give you options at different price points.",
  },
  {
    q: "How long does custom framing take?",
    a: "Most standard orders are ready within 5–7 business days. Rush same-day service is available for an additional fee. We'll give you an exact timeline when you place your order.",
  },
  {
    q: "Do you frame sports jerseys and memorabilia?",
    a: "Absolutely — jersey framing is one of our specialties. We build custom shadow boxes for jerseys, signed balls, bats, helmets, medals, patches, and other sports memorabilia. We serve fans across Boston and the surrounding area.",
  },
  {
    q: "What type of glass should I choose?",
    a: "It depends on your piece and where it will hang. Standard clear glass works well for most items. If it's near a window or under lights, UV-filtering conservation glass prevents fading. Museum glass eliminates reflections almost entirely — ideal for valuable artwork.",
  },
  {
    q: "Can you fix a broken or damaged frame?",
    a: "Yes! We repair cracked, chipped, or broken frames. We can also refinish or repaint an existing frame to give it new life. Bring it in for a free assessment.",
  },
  {
    q: "Do you offer discounts for non-profits or military?",
    a: "Yes — non-profit organizations and active/retired military members receive an additional 5% discount on all framing services.",
  },
  {
    q: "What areas do you serve?",
    a: "Our shop is in West Roxbury, MA and we serve customers from all over the Boston metro area, including Roslindale, Jamaica Plain, Brookline, Dedham, Needham, Newton, Hyde Park, and beyond. We're located at 1741 Centre Street with free parking.",
  },
  {
    q: "Do I need an appointment?",
    a: "Walk-ins are always welcome! If you'd like dedicated one-on-one time with our framing expert — especially for complex projects — you can book a free consultation online.",
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

export default function ServicesContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Custom Framing <span className="text-gold">Services</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            West Roxbury Framing has been serving Boston and the surrounding communities for over 40 years.
            From custom picture frames and shadow boxes to photo restoration and conservation framing — everything
            is built by hand in our West Roxbury shop.
          </p>
        </div>
      </section>

      {/* Services Grid */}
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
                <s.icon size={28} className="text-gold mb-4" />
                <h3 className="font-serif text-xl text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground text-center mb-12"
          >
            Why Choose <span className="text-gold">West Roxbury Framing</span>
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { stat: "40+", label: "Years in Business" },
              { stat: "100+", label: "5-Star Google Reviews" },
              { stat: "5–7", label: "Day Turnaround" },
              { stat: "Free", label: "Parking & Walk-Ins" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-gold font-bold text-3xl mb-2">{item.stat}</div>
                <div className="text-muted-foreground text-sm">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
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

      {/* CTA */}
      <section className="py-20 bg-secondary">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
            Ready to Frame Your <span className="text-gold">Piece</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Walk in anytime, give us a call, or book a free design consultation. We'll help you choose
            the perfect frame, mat, and glass for your artwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="px-8 py-3.5 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
            >
              Book a Consultation
            </Link>
            <a
              href="tel:16173273890"
              className="px-8 py-3.5 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              Call (617) 327-3890
            </a>
            <Link
              href="/custom-framing"
              className="px-8 py-3.5 border border-border text-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:border-gold/50 transition-colors"
            >
              Get a Quote Online
            </Link>
          </div>
          <p className="mt-6 text-muted-foreground text-sm">
            1741 Centre Street, West Roxbury, MA 02132 · Free parking · Walk-ins welcome
          </p>
        </div>
      </section>
    </div>
  );
}
