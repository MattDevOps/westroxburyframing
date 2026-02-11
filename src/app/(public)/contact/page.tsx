"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Contact <span className="text-gold">Us</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Thanks for your interest. Contact us via email, phone, or stop by our West Roxbury location.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Get In Touch</h2>
            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Address</h4>
                  <p className="text-muted-foreground text-sm">1741 Centre St, West Roxbury, MA 02132</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Phone</h4>
                  <a href="tel:16173273890" className="text-muted-foreground text-sm hover:text-gold">617-327-3890</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Email</h4>
                  <a href="mailto:jake@westroxburyframing.com" className="text-muted-foreground text-sm hover:text-gold">jake@westroxburyframing.com</a>
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
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <a href="https://www.facebook.com/WestRoxburyFraming/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-sm border border-border text-sm text-foreground/80 hover:text-gold hover:border-gold/50 transition-colors">Facebook</a>
              <a href="https://www.yelp.com/biz/west-roxbury-framing-west-roxbury" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-sm border border-border text-sm text-foreground/80 hover:text-gold hover:border-gold/50 transition-colors">Yelp</a>
              <a href="https://www.instagram.com/westroxburyframing/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-sm border border-border text-sm text-foreground/80 hover:text-gold hover:border-gold/50 transition-colors">Instagram</a>
            </div>
            <div className="aspect-video rounded-sm overflow-hidden border border-border">
              <iframe
                title="West Roxbury Framing on Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2951.5821502373105!2d-71.1501852!3d42.28744220000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e37f2bfd283b73%3A0x4cbd8e522909889e!2sWest%20Roxbury%20Framing!5e0!3m2!1sen!2sus!4v1770278426960!5m2!1sen!2sus"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Send Us a Message</h2>
            <ContactForm variant="dark" />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
