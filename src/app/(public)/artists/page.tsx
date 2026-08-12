import { Metadata } from "next";
import Link from "next/link";
import ArtistTabs, { ArtistTab } from "./ArtistTabs";
import {
  sortedArtists,
  hasArtists,
  websiteLabel,
  artistSameAs,
  artistInitials,
} from "./artists";

const TITLE = "Featured Artists | West Roxbury Framing";

// Naming the artists in the description gives Google the entity association
// between each artist and the shop, and it is what shows in the SERP snippet.
const ARTIST_NAMES = sortedArtists.map((a) => a.name).join(", ");
const DESCRIPTION = sortedArtists.length
  ? `Boston-area artists we frame for — ${ARTIST_NAMES}. Painters, printmakers, and collage artists whose work we mat, glaze, and frame by hand at our West Roxbury shop.`
  : "Meet the local artists we frame for. Boston-area painters, photographers, and makers whose work we prepare, mat, and frame by hand at our West Roxbury shop.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "Boston local artists",
    "West Roxbury artists",
    "artist framing Boston",
    "gallery framing West Roxbury",
    "local painters Boston",
    "artwork framing for artists",
    ...sortedArtists.map((a) => a.name),
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.westroxburyframing.com/artists",
  },
  alternates: {
    canonical: "https://www.westroxburyframing.com/artists",
  },
  // Keep the placeholder page out of the index until there's an artist on it.
  robots: hasArtists ? undefined : { index: false, follow: true },
};

/**
 * Answers to what people actually type when they're looking for a framer for
 * their own work. Rendered on the page and mirrored into FAQPage schema, so it
 * feeds both classic search and AI answer engines.
 */
const FAQS = [
  {
    q: "Do you frame artwork for working artists?",
    a: "Yes. We frame for painters, printmakers, photographers, and collage artists across Greater Boston — full gallery shows, commissions, and single pieces. Bring the work in and we'll design the frame around it.",
  },
  {
    q: "Can you frame a whole gallery show?",
    a: "We do. Bring in the full body of work and we'll spec a consistent moulding, mat, and glazing package across every piece, then build and deliver on your show date.",
  },
  {
    q: "What glass should I use on work that's for sale?",
    a: "For work heading into a collection, UV-protective or museum glass is worth it — it cuts fading and, in the museum grade, nearly eliminates reflection. We'll walk through the options and prices with the piece in front of us.",
  },
  {
    q: "Do you frame original prints and works on paper?",
    a: "Yes, with conservation matting and hinging so nothing acidic touches the paper and the work can be removed later without damage. That's how we handle white-line woodblock prints, collage, and original works on paper.",
  },
  {
    q: "Where are you located?",
    a: "1741 Centre St, West Roxbury, MA 02132 — free street parking out front and a municipal lot behind the building. Call 617-327-3890.",
  },
];

export default function ArtistsIndexPage() {
  // Only the tab-strip fields cross to the client — bios stay on the server.
  const tabs: ArtistTab[] = sortedArtists.map((artist) => ({
    slug: artist.slug,
    name: artist.name,
    tagline: artist.tagline,
    blurb: artist.blurb,
    initials: artistInitials(artist.name),
    portrait: artist.portrait,
    portraitAlt: artist.portraitAlt,
    location: artist.location,
    website: artist.website,
    websiteLabel: websiteLabel(artist),
    instagram: artist.instagram,
    links: artist.links,
    workCount: artist.works.length,
  }));

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Featured Artists",
    description: DESCRIPTION,
    url: "https://www.westroxburyframing.com/artists",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: sortedArtists.map((artist, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Person",
          name: artist.name,
          description: artist.blurb,
          url: `https://www.westroxburyframing.com/artists/${artist.slug}`,
          ...(artistSameAs(artist).length
            ? { sameAs: artistSameAs(artist) }
            : {}),
        },
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.westroxburyframing.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Featured Artists",
        item: "https://www.westroxburyframing.com/artists",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      {hasArtists && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-3">
              The Artists We Frame For
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Featured <span className="text-gold">Artists</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Painters, printmakers, photographers, and collage artists working
              around Greater Boston. We handle the mats, the glass, and the
              mouldings so their work shows the way they intended — and
              we&apos;re glad to send you their way.
            </p>
          </div>

          {hasArtists ? (
            <ArtistTabs artists={tabs} />
          ) : (
            <div className="border border-border rounded-sm bg-secondary p-12 text-center max-w-2xl mx-auto">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
                Coming <span className="text-gold">Soon</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We&apos;re putting together profiles of the local artists whose
                work we frame. Check back shortly.
              </p>
            </div>
          )}

          {/* Framing-for-artists FAQ — mirrored in FAQPage schema above */}
          <section className="mt-20 max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              Framing for <span className="text-gold">Artists</span>
            </h2>
            <dl className="space-y-6">
              {FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="border-b border-border pb-6 last:border-0"
                >
                  <dt className="font-serif text-lg text-foreground mb-2">
                    {faq.q}
                  </dt>
                  <dd className="text-muted-foreground text-sm leading-relaxed">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* CTA — recruit artists for the program */}
          <div className="mt-20 p-10 bg-secondary rounded-sm border border-border text-center">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
              Are You an <span className="text-gold">Artist</span>?
            </h2>
            <p className="text-muted-foreground text-sm mb-7 max-w-lg mx-auto leading-relaxed">
              We frame for working artists across Greater Boston — gallery shows,
              commissions, and one-off pieces. Bring your work in and we&apos;ll
              talk about mouldings, mats, and glazing that suit it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="px-8 py-3 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
              >
                Get in Touch
              </Link>
              <a
                href="tel:16173273890"
                className="px-8 py-3 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
              >
                Call 617-327-3890
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
