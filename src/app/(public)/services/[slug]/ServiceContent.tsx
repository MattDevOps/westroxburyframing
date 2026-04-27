"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Check, Phone, Star, ShieldCheck } from "lucide-react";
import type { ServiceInfo } from "./serviceData";

interface Props {
  service: ServiceInfo;
  related: ServiceInfo[];
}

export default function ServiceContent({ service, related }: Props) {
  const hasHeroImage = Boolean(service.heroImage);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-secondary">
        <div
          className={
            hasHeroImage
              ? "max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center"
              : "max-w-3xl mx-auto px-6 text-center"
          }
        >
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-3"
            >
              {service.heroEyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-tight"
            >
              {service.heroTitle}{" "}
              <span className="text-gold">{service.heroTitleAccent}</span>
            </motion.h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {service.heroDescription}
            </p>
            <div
              className={
                hasHeroImage
                  ? "flex flex-col sm:flex-row gap-3"
                  : "flex flex-col sm:flex-row gap-3 justify-center"
              }
            >
              <Link
                href="/book"
                className="px-7 py-3 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors text-center"
              >
                Plan Your Visit
              </Link>
              <a
                href="tel:16173273890"
                className="px-7 py-3 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors text-center inline-flex items-center justify-center gap-2"
              >
                <Phone size={14} /> (617) 327-3890
              </a>
            </div>
            <p className="text-muted-foreground text-xs mt-5">
              Walk-ins always welcome. Bring the piece in and we&apos;ll design and price it together.
            </p>
          </div>

          {hasHeroImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[4/5] rounded-sm overflow-hidden border border-border shadow-lg"
            >
              <Image
                src={service.heroImage}
                alt={`${service.heroTitle} ${service.heroTitleAccent} — West Roxbury Framing`}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* Intro */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          {service.intro.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-foreground/80 text-lg leading-relaxed"
            >
              {p}
            </motion.p>
          ))}
        </div>
      </section>

      {/* What we frame */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-foreground text-center mb-12"
          >
            What We <span className="text-gold">Frame</span>
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {service.whatWeFrame.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 p-4 rounded-sm bg-card border border-border"
              >
                <Check size={18} className="text-gold shrink-0 mt-0.5" />
                <span className="text-foreground/90 text-sm leading-relaxed">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-foreground text-center mb-4"
          >
            How It <span className="text-gold">Works</span>
          </motion.h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            From walk-in to finished piece — a careful, hands-on process built over four decades.
          </p>
          <div className="space-y-6">
            {service.process.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-5 items-start"
              >
                <div className="w-12 h-12 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 text-gold font-serif font-bold text-lg">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-foreground text-center mb-12"
          >
            Why It <span className="text-gold">Matters</span>
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {service.features.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-5 rounded-sm bg-card border border-border"
              >
                <ShieldCheck size={20} className="text-gold shrink-0 mt-0.5" />
                <p className="text-foreground/90 text-sm leading-relaxed">{f}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Local context + trust */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-card rounded-sm border border-border p-8 md:p-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-5">
              Why Boston <span className="text-gold">Trusts Us</span>
            </h2>
            <p className="text-foreground/80 leading-relaxed mb-8">{service.localContext}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-border">
              {[
                { stat: "40+", label: "Years in Business" },
                { stat: "100+", label: "5-Star Reviews" },
                { stat: "5–7 Day", label: "Standard Turnaround" },
                { stat: "Free", label: "Quotes & Parking" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-gold font-bold text-2xl mb-1">{item.stat}</div>
                  <div className="text-muted-foreground text-xs">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6">
              <Star size={16} className="fill-gold text-gold" />
              <span>Rated 5.0 on Google · 2024 Boston Legacy Business Award</span>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {service.gallery && service.gallery.length > 0 && (
        <section className="py-20 bg-secondary">
          <div className="max-w-6xl mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl md:text-4xl font-bold text-foreground text-center mb-12"
            >
              Recent <span className="text-gold">Work</span>
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {service.gallery.map((src, i) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="aspect-square rounded-sm overflow-hidden border border-border relative"
                >
                  <Image
                    src={src}
                    alt={`${service.heroTitle} ${service.heroTitleAccent} example ${i + 1}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-foreground text-center mb-12"
          >
            Common <span className="text-gold">Questions</span>
          </motion.h2>
          <div className="space-y-4">
            {service.faqs.map((faq, i) => (
              <motion.details
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-card border border-border rounded-sm p-5 cursor-pointer"
              >
                <summary className="flex justify-between items-center font-semibold text-foreground list-none">
                  <span>{faq.q}</span>
                  <span className="text-gold ml-4 transition-transform group-open:rotate-45 text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="text-muted-foreground leading-relaxed mt-4">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Related services */}
      {related.length > 0 && (
        <section className="py-20 bg-secondary">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              You May Also <span className="text-gold">Need</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/services/${r.slug}`}
                  className="group block bg-card border border-border rounded-sm overflow-hidden hover:border-gold/50 transition-colors"
                >
                  {r.heroImage && (
                    <div className="aspect-video relative">
                      <Image
                        src={r.heroImage}
                        alt={r.heroTitle}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-serif font-semibold text-foreground mb-2">
                      {r.heroTitle} {r.heroTitleAccent}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                      {r.heroDescription}
                    </p>
                    <span className="text-gold text-xs tracking-wide uppercase inline-flex items-center gap-1">
                      Learn More <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Get <span className="text-gold">Started</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Walk in anytime or book a consultation. Bring the piece — we&apos;ll design and price it
            with you in person. Pricing is always quoted in writing before any work begins.
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
              href="/contact"
              className="px-8 py-3.5 border border-border text-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:border-gold/50 transition-colors"
            >
              Hours & Directions
            </Link>
          </div>
          <p className="text-muted-foreground text-xs mt-6">
            1741 Centre Street, West Roxbury · Free parking · Walk-ins always welcome
          </p>
        </div>
      </section>
    </div>
  );
}
