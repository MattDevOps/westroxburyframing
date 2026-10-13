// Services page FAQ. Rendered as the visible accordion in ServicesContent.tsx
// and emitted as FAQPage JSON-LD in page.tsx from this single list.
import { DELIVERY } from "@/lib/delivery";

export const FAQS = [
  {
    q: "How much does custom framing cost?",
    a: "Every framing job is custom — pricing depends on the moulding, mat, glass type, and size of your piece. Bring it in and we'll walk through your options together. Quotes are always free.",
  },
  {
    q: "How long does custom framing take?",
    a: "Most standard orders are ready within 5–7 business days. Rush same-day service is available for an additional fee. We'll give you an exact timeline when you place your order.",
  },
  {
    q: "Do you offer rush or same-day framing?",
    a: "Yes — we offer rush same-day framing for customers in Boston and the surrounding area who need a frame fast. Great for last-minute gifts, graduations, gallery deadlines, and memorial services. Call us at (617) 327-3890 or walk in to confirm availability and pricing for rush jobs.",
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
  DELIVERY.faq,
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
