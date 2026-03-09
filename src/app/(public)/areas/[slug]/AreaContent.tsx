"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, ArrowRight, Star } from "lucide-react";
import type { AreaInfo } from "./areaData";

const SERVICES = [
  "Custom Picture Framing",
  "Shadow Box Framing",
  "Jersey & Memorabilia Framing",
  "Diploma & Certificate Framing",
  "Photo Restoration",
  "Canvas Stretching",
  "Conservation & Museum Framing",
  "Frame Repair & Refinishing",
  "Custom Matting & Mat Cutting",
  "Glass & Glazing (UV, Museum, Non-Glare)",
  "Mirror & Tabletop Framing",
  "Rush Same-Day Framing",
];

export default function AreaContent({ area }: { area: AreaInfo }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-3"
          >
            Serving {area.name}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4"
          >
            Custom Framing Near <span className="text-gold">{area.name}</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            {area.description}
          </p>
        </div>
      </section>

      {/* Services We Offer */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground text-center mb-4"
          >
            Framing Services for <span className="text-gold">{area.name}</span> Residents
          </motion.h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Everything you need under one roof — {area.distance} from {area.name}.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-sm hover:bg-card transition-colors"
              >
                <span className="text-gold shrink-0">✓</span>
                <span className="text-foreground/80 text-sm">{service}</span>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/services"
              className="text-gold text-sm tracking-wide uppercase hover:text-gold-light transition-colors inline-flex items-center gap-1"
            >
              View All Services <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Customers Choose Us */}
      <section className="py-20 bg-secondary">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground text-center mb-8"
          >
            Why {area.name} Residents <span className="text-gold">Choose Us</span>
          </motion.h2>
          <div className="bg-card rounded-sm border border-border p-8 mb-8">
            <p className="text-foreground/80 leading-relaxed mb-6">{area.why}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { stat: "40+", label: "Years in Business" },
                { stat: "100+", label: "5-Star Reviews" },
                { stat: "5–7 Day", label: "Turnaround" },
                { stat: "Free", label: "Parking & Quotes" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-gold font-bold text-2xl mb-1">{item.stat}</div>
                  <div className="text-muted-foreground text-xs">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Star size={16} className="fill-gold text-gold" />
            <span>Rated 5.0 on Google with 100+ reviews</span>
          </div>
        </div>
      </section>

      {/* Getting Here */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground text-center mb-12"
          >
            Getting Here from <span className="text-gold">{area.name}</span>
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Address</h4>
                  <p className="text-muted-foreground text-sm">1741 Centre Street, West Roxbury, MA 02132</p>
                  <p className="text-muted-foreground text-xs mt-1">{area.nearbyLandmarks}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Phone</h4>
                  <a href="tel:16173273890" className="text-muted-foreground text-sm hover:text-gold">(617) 327-3890</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Hours</h4>
                  <p className="text-muted-foreground text-sm">Mon – Fri: 9:30am – 6pm</p>
                  <p className="text-muted-foreground text-sm">Saturday: Closed</p>
                  <p className="text-muted-foreground text-sm">Sunday: 10:30am – 4:30pm</p>
                </div>
              </div>
              <div className="bg-card rounded-sm border border-border p-4">
                <h4 className="font-semibold text-foreground text-sm mb-2">Directions from {area.name}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{area.directions}</p>
              </div>
            </div>
            <div className="aspect-video md:aspect-auto rounded-sm overflow-hidden border border-border">
              <iframe
                title={`Directions to West Roxbury Framing from ${area.name}`}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2951.5821502373105!2d-71.1501852!3d42.28744220000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e37f2bfd283b73%3A0x4cbd8e522909889e!2sWest%20Roxbury%20Framing!5e0!3m2!1sen!2sus!4v1770278426960!5m2!1sen!2sus"
                className="w-full h-full min-h-[300px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
            Ready to Get Your Piece <span className="text-gold">Framed</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Walk in anytime, book a free consultation, or submit a quote request online.
            We&apos;re {area.distance} from {area.name} with free parking and walk-ins welcome.
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
        </div>
      </section>
    </div>
  );
}
