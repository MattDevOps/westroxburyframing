"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Frame, Layers, Maximize, Wrench, Shield, Sparkles } from "lucide-react";

const services = [
  { icon: Frame, title: "Custom & Handmade Frames", description: "Choose from hundreds of different styles, finishes (wood and aluminum), colors, and designs to suit your needs." },
  { icon: Layers, title: "Matting", description: "Preservation/Conservation of many types, styles, and frame designs for your precious artwork." },
  { icon: Maximize, title: "Mounting", description: "Dry mounting, floating mounting, and shadow boxing, among others." },
  { icon: Wrench, title: "Insurance Repair & Replace", description: "Repair art and frames covered by insurance — we will repair or replace with care." },
  { icon: Shield, title: "UV Light Protection", description: "Various types of glass for preservation: picture clear, non-glare, UV protection, and museum glass." },
  { icon: Sparkles, title: "Restoration", description: "Beautiful frame and photo restoration to bring the good memories back to life." },
];

const galleryImages = [
  "/framed-art/01.webp",
  "/framed-art/02.webp",
  "/framed-art/03.webp",
  "/framed-art/04.webp",
  "/framed-art/05.webp",
  "/framed-art/06.webp",
];

const framedArtImages = [
  "/framed-art/brady-jersey.webp",
  "/framed-art/diploma-and-medal.webp",
  "/framed-art/cowboy-sunset.webp",
  "/framed-art/ems-patches-collage.webp",
  "/framed-art/lighthouse-tapestry.webp",
  "/framed-art/honor-certificate.webp",
];

const allServicesList = [
  "Same Day Framing", "Custom Framing", "On-Site Framing Design", "Ready Made Frames and Mats",
  "Repairs and Restoration", "Custom Acrylic Box for All Use", "Museum Diploma/Ketubah Framing",
  "Plaques and Name Tags For All Occasions", "Engraving", "Various Glass Types and Mirrors",
  "Canvas Stretching", "Oval Circle Shape Frames and Matting", "Various Type of Glass for All Needs and Repairs",
  "Scanning Services", "Volume Discounts",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/framed-art/01.webp)" }}
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <a
              href="https://www.boston.gov/departments/small-business/legacy-business-program"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold text-sm font-semibold tracking-[0.3em] uppercase hover:text-gold-light transition-colors underline decoration-gold/50 hover:decoration-gold underline-offset-2"
            >
              We Earned the 2024 Boston Legacy Business Award
            </a>
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 leading-tight"
          >
            West Roxbury
            <br />
            <span className="text-gold">Framing</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-foreground/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            West Roxbury Framing was one of a select few businesses in Boston to earn the Legacy Business Award, acknowledging long-standing businesses with historic significance and a commitment to the community.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/book"
              className="px-8 py-3.5 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
            >
              Book a Design Consultation
            </Link>
            <a
              href="tel:16173273890"
              className="px-8 py-3.5 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              Call Now
            </a>
            <a
              href="https://maps.google.com/?q=1741+Centre+St+West+Roxbury+MA+02132"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              Get Directions
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-6 text-foreground/50 text-sm"
          >
            Walk-ins welcome · Free parking available
          </motion.p>
        </div>
      </section>

      {/* Gallery scroll */}
      <section className="py-20 bg-warm overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-10">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl text-foreground"
          >
            Discover <span className="text-gold">Gallery</span>
          </motion.h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 px-6 scrollbar-hide">
          {galleryImages.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex-shrink-0 w-64 h-72 md:w-80 md:h-96 rounded-sm overflow-hidden group cursor-pointer relative"
            >
              <Image src={src} alt={`Framed artwork ${i + 1}`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="320px"  />
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              How It <span className="text-gold">Works</span>
            </motion.h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps from your artwork to a beautifully framed piece.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Bring In Your Work", desc: "Visit our gallery or schedule a consultation. Bring your treasured artwork, family photograph, or meaningful keepsake — we welcome walk-ins and appointments." },
              { step: "2", title: "Design Together", desc: "Our experts help you choose the perfect frame, mat, and glass to complement your piece and your space." },
              { step: "3", title: "We Frame & You Pick Up", desc: "We craft your custom frame with care. We'll let you know when it's ready — most orders done in about a week." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-gold text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-5">
                  {s.step}
                </div>
                <h3 className="font-impact text-xl text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              About <span className="text-gold">Us</span>
            </h2>
            <h3 className="font-serif text-xl text-gold mb-6 italic">Serving Boston for 45 Years</h3>
            <p className="text-foreground/70 leading-relaxed mb-4">
              West Roxbury Framing is a locally owned framing gallery, specializing in custom-designed frames made to perfectly complement the item you are looking to showcase. Since 1981 we have offered our clients quality products with a fast turnaround at an affordable price.
            </p>
            <p className="text-foreground/70 leading-relaxed mb-8">
              Located in West Roxbury, MA, we proudly serve the communities of the Metro Boston-area and beyond. We are a family-owned business with deep roots in the community.
            </p>
            <Link
              href="/about"
              className="inline-block px-8 py-3.5 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              Discover More
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-sm overflow-hidden relative">
              <Image src="/home/2024-legacy-award-mayor-wu.jpg" alt="West Roxbury Framing with Mayor Wu" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              Our <span className="text-gold">Services</span>
            </motion.h2>
            <Link href="/services" className="text-gold text-sm tracking-wide uppercase hover:text-gold-light transition-colors">
              View All Services →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-8 rounded-sm border border-border hover:border-gold/30 transition-colors group"
              >
                <service.icon size={32} className="text-gold mb-5 group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-xl text-foreground mb-3">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Framed Art Gallery */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl font-bold text-foreground text-center mb-16"
          >
            Framed Art <span className="text-gold">Gallery</span>
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {framedArtImages.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="aspect-square overflow-hidden rounded-sm cursor-pointer group relative"
              >
                <Image src={src} alt={`Framed art ${i + 1}`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 50vw, 33vw" />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/framed-art"
              className="inline-block px-8 py-3.5 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              View Full Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-3">
              Testimonials
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              What Our Clients <span className="text-gold">Say</span>
            </motion.h2>
            <p className="text-muted-foreground text-sm">100+ five-star Google reviews</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { name: "Sarah M.", text: "Moses is incredible! He framed my grandmother's antique photographs and they look absolutely stunning. The attention to detail is unmatched." },
              { name: "James R.", text: "Best framing shop in Boston. Had a Tom Brady jersey shadowboxed and the result was museum quality. Fast turnaround and fair prices." },
              { name: "Linda K.", text: "I've been coming here for years. They framed my daughter's diploma and it looks beautiful. The whole family trusts West Roxbury Framing." },
            ].map((review, i) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-8 rounded-sm border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-gold text-sm">★</span>
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic">&ldquo;{review.text}&rdquo;</p>
                <p className="text-gold font-semibold text-sm">{review.name}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/testimonials"
              className="inline-block px-8 py-3.5 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              Read All Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* Services list */}
      <section className="py-24 bg-warm">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-foreground text-center mb-12"
          >
            Everything We <span className="text-gold">Offer</span>
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allServicesList.map((service, i) => (
              <motion.div
                key={service}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-sm hover:bg-card transition-colors"
              >
                <span className="text-gold shrink-0">✓</span>
                <span className="text-foreground/80 text-sm">{service}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit Us — map, hours, parking */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              Visit <span className="text-gold">Us</span>
            </motion.h2>
            <p className="text-gold text-sm font-semibold tracking-wide uppercase">Walk-ins always welcome</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h3 className="font-serif text-xl text-foreground mb-2">Address</h3>
                <p className="text-foreground/70 text-sm">1741 Centre St, West Roxbury, MA 02132</p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-foreground mb-2">Hours</h3>
                <div className="text-foreground/70 text-sm space-y-1">
                  <p>Monday – Friday: 9:30am – 6pm</p>
                  <p>Saturday: Closed</p>
                  <p>Sunday: 10:30am – 4:30pm</p>
                </div>
              </div>
              <div>
                <h3 className="font-serif text-xl text-foreground mb-2">Parking</h3>
                <p className="text-foreground/70 text-sm">
                  Free street parking is available directly in front of the shop on Centre Street. Additional parking in the municipal lot behind the building.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-foreground mb-2">Contact</h3>
                <div className="text-foreground/70 text-sm space-y-1">
                  <p>Phone: <a href="tel:16173273890" className="text-gold hover:text-gold-light">617-327-3890</a></p>
                  <p>Email: <a href="mailto:jake@westroxburyframing.com" className="text-gold hover:text-gold-light">jake@westroxburyframing.com</a></p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="tel:16173273890"
                  className="px-6 py-3 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
                >
                  Call Now
                </a>
                <a
                  href="https://maps.google.com/?q=1741+Centre+St+West+Roxbury+MA+02132"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
                >
                  Get Directions
                </a>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="aspect-video rounded-sm overflow-hidden border border-border"
            >
              <iframe
                title="West Roxbury Framing on Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2951.5821502373105!2d-71.1501852!3d42.28744220000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e37f2bfd283b73%3A0x4cbd8e522909889e!2sWest%20Roxbury%20Framing!5e0!3m2!1sen!2sus!4v1770278426960!5m2!1sen!2sus"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
