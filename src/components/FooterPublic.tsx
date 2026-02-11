import Link from "next/link";
import { MapPin, Phone, Clock, Mail } from "lucide-react";

export default function FooterPublic() {
  return (
    <footer className="bg-warm border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="font-serif text-2xl font-bold text-gold mb-4">
              West Roxbury Framing
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Family owned and operated since 1981. Specializing in custom-designed frames made to perfectly complement your treasured items.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-lg text-foreground mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link href="/about" className="text-muted-foreground text-sm hover:text-gold transition-colors">About Us</Link>
              <Link href="/services" className="text-muted-foreground text-sm hover:text-gold transition-colors">Services</Link>
              <Link href="/framed-art" className="text-muted-foreground text-sm hover:text-gold transition-colors">Framed Art</Link>
              <Link href="/restoration" className="text-muted-foreground text-sm hover:text-gold transition-colors">Repair & Restoration</Link>
              <Link href="/testimonials" className="text-muted-foreground text-sm hover:text-gold transition-colors">Testimonials</Link>
              <Link href="/contact" className="text-muted-foreground text-sm hover:text-gold transition-colors">Contact Us</Link>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-lg text-foreground mb-4">Contact Info</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gold mt-0.5 shrink-0" />
                <span className="text-muted-foreground text-sm">
                  1741 Centre Street, West Roxbury, MA 02132
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gold shrink-0" />
                <a href="tel:16173273890" className="text-muted-foreground text-sm hover:text-gold">617-327-3890</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gold shrink-0" />
                <a href="mailto:jake@westroxburyframing.com" className="text-muted-foreground text-sm hover:text-gold">jake@westroxburyframing.com</a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-lg text-foreground mb-4">Hours</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-gold mt-0.5 shrink-0" />
                <div>
                  <p>Mon – Fri: 9:30am – 6pm</p>
                  <p>Saturday: Closed</p>
                  <p>Sunday: 10:30am – 4:30pm</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} West Roxbury Framing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
