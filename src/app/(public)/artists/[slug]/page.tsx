import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  artists,
  getArtistBySlug,
  getOtherArtists,
  websiteLabel,
} from "../artists";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return artists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return {};

  const title = `${artist.name} — ${artist.tagline} | West Roxbury Framing`;
  const description =
    artist.metaDescription ||
    `${artist.name}: ${artist.blurb} Framed by hand at West Roxbury Framing.`;

  return {
    title,
    description,
    keywords: artist.keywords || [
      artist.name,
      `${artist.name} artist`,
      `${artist.name} paintings`,
      "Boston local artist",
      "West Roxbury Framing artists",
    ],
    openGraph: {
      title,
      description,
      url: `https://www.westroxburyframing.com/artists/${artist.slug}`,
      type: "profile",
      images: [
        {
          url: artist.works[0]?.src || artist.portrait,
          width: 1200,
          height: 630,
          alt: artist.works[0]?.alt || artist.portraitAlt,
        },
      ],
    },
    alternates: {
      canonical: `https://www.westroxburyframing.com/artists/${artist.slug}`,
    },
  };
}

export default async function ArtistPage({ params }: PageProps) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  const others = getOtherArtists(artist.slug);
  const sameAs = [artist.website, artist.instagram].filter(Boolean) as string[];

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.name,
    description: artist.blurb,
    image: `https://www.westroxburyframing.com${artist.portrait}`,
    jobTitle: artist.tagline,
    url: `https://www.westroxburyframing.com/artists/${artist.slug}`,
    ...(sameAs.length ? { sameAs } : {}),
    ...(artist.location
      ? { homeLocation: { "@type": "Place", name: artist.location } }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/artists"
            className="text-gold text-sm font-semibold tracking-wide uppercase hover:text-gold-light transition-colors"
          >
            ← All Artists
          </Link>

          {/* Header: portrait + intro */}
          <div className="mt-8 grid gap-10 md:grid-cols-[320px_1fr] items-start">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-border bg-secondary">
              <Image
                src={artist.portrait}
                alt={artist.portraitAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                priority
                unoptimized={artist.portrait.startsWith("http")}
              />
            </div>

            <div>
              {artist.featured && (
                <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">
                  Featured Artist
                </p>
              )}
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {artist.name}
              </h1>
              <p className="text-muted-foreground text-sm uppercase tracking-wide mt-2">
                {artist.tagline}
                {artist.location && ` · ${artist.location}`}
              </p>

              <div className="mt-6 text-foreground/80 leading-relaxed space-y-4">
                {artist.bio
                  .trim()
                  .split("\n\n")
                  .map((para, i) => (
                    <p key={i}>{para.trim()}</p>
                  ))}
              </div>

              {(artist.website || artist.instagram) && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {artist.website && (
                    <a
                      href={artist.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-xs rounded-sm hover:opacity-90 transition-colors"
                    >
                      Visit {websiteLabel(artist)} →
                    </a>
                  )}
                  {artist.instagram && (
                    <a
                      href={artist.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 border border-border text-foreground font-semibold tracking-wide uppercase text-xs rounded-sm hover:border-gold/50 hover:text-gold transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Their work, framed by us */}
          {artist.works.length > 0 && (
            <section className="mt-20">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                Their <span className="text-gold">Work</span>
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                Pieces by {artist.name}, framed by hand in our West Roxbury shop.
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {artist.works.map((work) => (
                  <figure
                    key={work.src}
                    className="overflow-hidden rounded-sm border border-border bg-card group"
                  >
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={work.src}
                        alt={work.alt}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={work.src.startsWith("http")}
                      />
                    </div>
                    {(work.title || work.medium || work.framing) && (
                      <figcaption className="p-4">
                        {work.title && (
                          <h3 className="text-sm font-medium text-foreground">
                            {work.title}
                          </h3>
                        )}
                        {work.medium && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {work.medium}
                          </p>
                        )}
                        {work.framing && (
                          <p className="text-xs text-gold/80 mt-1">
                            {work.framing}
                          </p>
                        )}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* More artists */}
          {others.length > 0 && (
            <section className="mt-20 border-t border-border pt-10">
              <h2 className="font-serif text-xl font-bold text-foreground mb-6">
                More Artists We <span className="text-gold">Frame For</span>
              </h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {others.map((other) => (
                  <Link
                    key={other.slug}
                    href={`/artists/${other.slug}`}
                    className="border border-border rounded-sm p-5 hover:border-gold/30 transition-colors"
                  >
                    <h3 className="font-serif text-lg text-foreground">
                      {other.name}
                    </h3>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mt-1">
                      {other.tagline}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="mt-16 p-8 bg-secondary rounded-sm border border-border text-center">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
              Framing for <span className="text-gold">Artists</span>
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Gallery shows, commissions, or a single piece — bring your work in
              and we&apos;ll design the frame around it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/book"
                className="px-8 py-3 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
              >
                Book Consultation
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
