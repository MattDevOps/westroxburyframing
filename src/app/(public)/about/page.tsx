"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            About <span className="text-gold">Us</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Family owned and operated since 1981
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">West Roxbury Framing</h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We are a family owned and operated fine art custom picture framing shop. Opened in 1981 and based in West Roxbury, we serve Boston and surrounding neighborhoods and towns with a commitment to quality service and fair prices.
            </p>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We offer all kinds of frame options to fit any needs from old maps and paintings, posters, valuable prints and sports jerseys to all manner of three dimensional objects — we can handle it all. We also offer limited frame and photo restoration as well as rush same day services.
            </p>
            <h3 className="font-serif text-2xl font-bold text-foreground mt-10 mb-4">Specialties</h3>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We can also frame mirrors and tabletops, which you can bring to us or we can supply. We also do beautiful frame and photo restoration to bring the good memories back. We are available by appointment as well as before and after listed hours.
            </p>
            <p className="text-gold text-sm font-semibold">
              Non-Profit and Military Organizations receive an additional 5% off. Awarded for Best of Boston.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="aspect-[4/5] rounded-sm overflow-hidden relative"
          >
            <Image src="/home/2024-legacy-award-mayor-wu.jpg" alt="West Roxbury Framing with Mayor Wu" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-secondary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Our History</h2>
            <p className="text-foreground/70 leading-relaxed mb-6">
              Established in 1982, West Roxbury Framing Center is a family-owned and operated business with over 40 years of experience. We have served a high volume of clients over the years and take pride in giving great value for your money.
            </p>
            <h3 className="font-serif text-2xl text-gold mb-4">Meet The Owner</h3>
            <h4 className="font-serif text-xl text-foreground mb-2">Moses Hasson</h4>
            <p className="text-gold text-sm italic">&quot;The Frame Guy&quot;</p>
            <p className="text-foreground/70 leading-relaxed mt-4">
              Moses Hasson is the owner of Copley Art &amp; Framing and West Roxbury Framing. He has been designing and building custom frames since 1982. He loves to work with customers to execute the perfect custom frame for their piece and give them the best price possible.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
