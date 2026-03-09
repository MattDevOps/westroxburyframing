"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Privacy <span className="text-gold">Policy</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your privacy matters to us. Here&rsquo;s how we handle your information.
          </p>
          <p className="text-muted-foreground text-sm mt-4">
            <Link href="/policies" className="text-gold hover:text-gold-light underline underline-offset-2">
              View our full policies page
            </Link>
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 space-y-12 text-foreground/80 text-sm leading-relaxed">
          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">Information We Collect</h2>
            <p className="mb-3">
              When you place an order, book an appointment, or contact us through our website, we may collect the following information:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Name, email address, and phone number</li>
              <li>Photos of artwork or items you wish to have framed</li>
              <li>Order details including framing specifications, dimensions, and pricing</li>
              <li>Payment information (processed securely through Square — we do not store card numbers)</li>
              <li>Communication preferences and marketing opt-in status</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>To process and fulfill your framing orders</li>
              <li>To communicate about your order status (e.g., ready for pickup notifications)</li>
              <li>To schedule and manage appointments</li>
              <li>To respond to your inquiries and provide customer service</li>
              <li>If you opt in, to send occasional email updates about framing tips, promotions, and shop events</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">Email Marketing</h2>
            <p className="mb-3">
              We use Postmark to send marketing emails. You will only receive marketing emails if you have explicitly opted in by checking the marketing consent box during order intake or on our website forms. You can unsubscribe at any time by clicking the &ldquo;unsubscribe&rdquo; link in any marketing email.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">SMS/Text Message Notifications</h2>
            <p className="mb-3">
              We may send informational text messages to customers who have opted in to receive account updates and notifications. These messages include order status updates, pickup reminders, and other account-related notifications. You can opt in to receive text messages by:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>Visiting our SMS opt-in page at <a href="/sms-opt-in" className="text-gold hover:text-gold-light underline underline-offset-2">westroxburyframing.com/sms-opt-in</a></li>
              <li>Providing verbal consent during in-store interactions</li>
              <li>Checking the SMS opt-in box during order intake</li>
            </ul>
            <p className="mb-3">
              By opting in, you agree to receive account updates and notifications via text message. Message and data rates may apply. Message frequency varies. You can opt out at any time by replying <strong>STOP</strong> to any message, or by contacting us directly. For help, reply <strong>HELP</strong>.
            </p>
            <p>
              We use Twilio to send text messages. Twilio&rsquo;s privacy policy governs their handling of your phone number. For more information, visit{" "}
              <a
                href="https://www.twilio.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-light underline underline-offset-2"
              >
                Twilio&rsquo;s Privacy Policy
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">Payment Processing</h2>
            <p>
              All payments are processed securely through Square. We do not store credit card numbers or sensitive payment data on our servers. Square&rsquo;s privacy policy and security practices govern the handling of your payment information. For more information, visit{" "}
              <a
                href="https://squareup.com/us/en/legal/general/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-light underline underline-offset-2"
              >
                Square&rsquo;s Privacy Policy
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">Data Retention</h2>
            <p>
              We retain customer and order records to provide you with order history and to improve our service. Photos uploaded as part of orders are stored securely and retained only as long as needed for order fulfillment. You may request deletion of your personal data at any time by contacting us.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Square</strong> — Payment processing and invoicing</li>
              <li><strong>Postmark</strong> — Email marketing (opt-in only)</li>
              <li><strong>Calendly</strong> — Online appointment scheduling</li>
              <li><strong>Google Maps</strong> — Maps and directions on our website</li>
              <li><strong>Vercel</strong> — Website hosting</li>
            </ul>
            <p className="mt-3">
              Each service has its own privacy policy governing how they handle data.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">Cookies</h2>
            <p>
              Our website may use cookies for basic functionality (such as staff authentication). We do not use tracking cookies for advertising. Third-party embeds (Google Maps, Calendly) may set their own cookies.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Opt out of marketing emails at any time</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-4">Contact Us</h2>
            <p>
              If you have questions about this privacy policy or your personal data, please contact us:
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
              Last updated: February 2026. We may update this policy from time to time. Changes will be posted on this page.
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              <Link href="/policies" className="text-gold hover:text-gold-light underline underline-offset-2">
                View our full policies page
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
