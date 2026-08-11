import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { sortedArtists, hasArtists, websiteLabel } from "./artists";

const TITLE = "Featured Artists | West Roxbury Framing";
const DESCRIPTION =
  "Meet the local artists we frame for. Boston-area painters, photographers, and makers whose work we prepare, mat, and frame by hand at our West Roxbury shop.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Boston local artists",
    "West Roxbury artists",
    "artist framing Boston",
    "gallery framing West Roxbury",
    "local painters Boston",
    "artwork framing for artists",
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

export default function ArtistsIndexPage() {
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
          ...(artist.website ? { sameAs: [artist.website] } : {}),
        },
      })),
    },
  };

  return (
    <>
      {hasArtists && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
        />
      )}
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
              Local painters, photographers, and makers whose work comes through
              our shop. We handle the mats, the glass, and the mouldings so their
              work shows the way they intended — and we&apos;re glad to send you
              their way.
            </p>
          </div>

          {hasArtists ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {sortedArtists.map((artist) => (
                <article
                  key={artist.slug}
                  className="border border-border rounded-sm overflow-hidden bg-card hover:border-gold/30 transition-colors flex flex-col"
                >
                  <Link href={`/artists/${artist.slug}`} className="block group">
                    <div className="relative aspect-[4/3] bg-secondary">
                      <Image
                        src={artist.portrait}
                        alt={artist.portraitAlt}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={artist.portrait.startsWith("http")}
                      />
                    </div>
                  </Link>
                  <div className="p-6 flex flex-col flex-1">
                    {artist.featured && (
                      <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">
                        Featured
                      </p>
                    )}
                    <Link href={`/artists/${artist.slug}`}>
                      <h2 className="font-serif text-xl font-bold text-foreground hover:text-gold transition-colors">
                        {artist.name}
                      </h2>
                    </Link>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mt-1 mb-3">
                      {artist.tagline}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                      {artist.blurb}
                    </p>
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                      <Link
                        href={`/artists/${artist.slug}`}
                        className="text-gold text-sm font-semibold hover:text-gold-light transition-colors"
                      >
                        See Their Work →
                      </Link>
                      {artist.website && (
                        <a
                          href={artist.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground text-xs hover:text-gold transition-colors"
                        >
                          {websiteLabel(artist)}
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
