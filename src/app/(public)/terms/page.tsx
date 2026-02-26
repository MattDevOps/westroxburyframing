"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Terms & <span className="text-gold">Conditions</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using our services.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 space-y-12 text-foreground/80 text-sm leading-relaxed">
          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the services of West Roxbury Framing, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">2. Services</h2>
            <p className="mb-3">
              West Roxbury Framing provides custom framing services, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Custom frame design and fabrication</li>
              <li>Mat cutting and mounting</li>
              <li>Glass and acrylic glazing</li>
              <li>Artwork restoration and conservation</li>
              <li>Framing consultation and design services</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">3. Orders and Estimates</h2>
            <p className="mb-3">
              <strong>Estimates:</strong> Estimates are valid for 30 days from the date of issue. Prices are subject to change based on material availability and market conditions.
            </p>
            <p className="mb-3">
              <strong>Order Confirmation:</strong> An order is considered confirmed when a deposit is paid or when you provide verbal or written approval to proceed. Once confirmed, the order becomes binding.
            </p>
            <p>
              <strong>Order Changes:</strong> Changes to confirmed orders may result in additional charges or delays. We will notify you of any impact before proceeding with changes.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">4. Payment Terms</h2>
            <p className="mb-3">
              <strong>Deposits:</strong> A deposit may be required to begin work on your order. Deposit amounts vary based on order value and materials required.
            </p>
            <p className="mb-3">
              <strong>Payment Methods:</strong> We accept cash, check, and all major credit cards. Payment is due upon order completion and pickup, unless other arrangements have been made.
            </p>
            <p>
              <strong>Outstanding Balances:</strong> Orders with outstanding balances may be held until payment is received. We reserve the right to charge interest on overdue accounts.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">5. Pickup and Storage</h2>
            <p className="mb-3">
              <strong>Pickup Notification:</strong> We will notify you when your order is ready for pickup via phone, email, or text message (if you have opted in).
            </p>
            <p className="mb-3">
              <strong>Storage:</strong> Completed orders will be stored for up to 90 days after completion. After 90 days, a storage fee may apply. Orders unclaimed after 180 days may be disposed of at our discretion.
            </p>
            <p>
              <strong>Liability:</strong> While we take every precaution to protect your items, we are not responsible for damage to items left in storage beyond 90 days.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">6. Warranty and Guarantee</h2>
            <p className="mb-3">
              <strong>Workmanship:</strong> We guarantee our workmanship for one year from the date of pickup. If you discover any defects in our work, please contact us immediately for repair or replacement at no charge.
            </p>
            <p>
              <strong>Materials:</strong> We use high-quality materials from reputable suppliers. While we cannot guarantee against material defects beyond our control, we will work with you to resolve any issues that arise.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">7. Cancellations and Refunds</h2>
            <p className="mb-3">
              <strong>Cancellation:</strong> You may cancel an order before work begins for a full refund of any deposit paid. Once work has begun, cancellation may result in charges for materials and labor already expended.
            </p>
            <p>
              <strong>Refunds:</strong> Refunds for completed work are considered on a case-by-case basis. If you are not satisfied with your order, please contact us within 7 days of pickup to discuss resolution options.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">8. Customer Property</h2>
            <p className="mb-3">
              <strong>Care and Handling:</strong> We handle all customer property with the utmost care. However, we cannot be held responsible for damage to items that were already damaged, fragile, or in poor condition when received.
            </p>
            <p>
              <strong>Insurance:</strong> While we take every precaution, we recommend that customers maintain their own insurance coverage for valuable items. Our liability is limited to the value of the framing work performed.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">9. Intellectual Property</h2>
            <p>
              All designs, concepts, and specifications created by West Roxbury Framing remain our intellectual property. You may not reproduce, distribute, or use our designs for commercial purposes without written permission.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">10. Limitation of Liability</h2>
            <p className="mb-3">
              To the fullest extent permitted by law, West Roxbury Framing shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
            </p>
            <p>
              Our total liability for any claim arising from our services shall not exceed the total amount paid by you for the specific order in question.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">11. Privacy</h2>
            <p>
              Your use of our services is also governed by our{" "}
              <Link href="/policies" className="text-gold hover:text-gold-light underline underline-offset-2">
                Privacy Policy
              </Link>
              . Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to this page. Your continued use of our services after changes are posted constitutes acceptance of the modified terms.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">13. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the Commonwealth of Massachusetts, without regard to its conflict of law provisions.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">14. Contact Information</h2>
            <p className="mb-3">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="mt-3 space-y-1">
              <p>West Roxbury Framing</p>
              <p>1741 Centre St, West Roxbury, MA 02132</p>
              <p>
                Phone:{" "}
                <a href="tel:16173273890" className="text-gold hover:text-gold-light">
                  617-327-3890
                </a>
              </p>
              <p>
                Email:{" "}
                <a href="mailto:jake@westroxburyframing.com" className="text-gold hover:text-gold-light">
                  jake@westroxburyframing.com
                </a>
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-muted-foreground text-xs">
              Last updated: February 2026. These terms may be updated from time to time. Please check this page periodically for changes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
