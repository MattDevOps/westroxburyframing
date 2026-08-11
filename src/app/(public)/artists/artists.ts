/**
 * Featured Artists — data source for /artists and /artists/[slug].
 *
 * HOW TO ADD AN ARTIST
 * 1. Drop images in `public/artists/<slug>/` — one portrait (`portrait.jpg`)
 *    plus one file per piece of artwork.
 * 2. Copy the EXAMPLE_ARTIST block below, fill it in, and push it onto
 *    `artists` (order in the array = order on the page, after featured ones).
 * 3. Nothing else to wire up: the nav link, footer link, sitemap entries and
 *    detail pages all come online automatically once this array is non-empty.
 *
 * Ask each artist for: a headshot, 3-6 photos of work we framed, a 2-3
 * sentence blurb, a longer bio, and their website/Instagram links.
 */

export interface ArtistWork {
  /** Path under /public, e.g. "/artists/jane-doe/harbor-at-dusk.jpg" */
  src: string;
  /** Descriptive alt text — used for SEO and accessibility, keep it specific. */
  alt: string;
  title?: string;
  /** e.g. "Oil on canvas, 24 x 36" */
  medium?: string;
  /** How we framed it, e.g. "Hand-finished gold gilded moulding, museum glass" */
  framing?: string;
}

export interface Artist {
  /** URL segment: /artists/<slug> */
  slug: string;
  name: string;
  /** Short line under the name, e.g. "Oil painter, Jamaica Plain" */
  tagline: string;
  /** 2-3 sentences shown on the index card. */
  blurb: string;
  /** Longer bio for the detail page. Blank lines separate paragraphs. */
  bio: string;
  /** Headshot / studio photo path under /public. */
  portrait: string;
  portraitAlt: string;
  /** Pieces of theirs we've framed. */
  works: ArtistWork[];
  website?: string;
  /** Display text for the website button, defaults to the bare domain. */
  websiteLabel?: string;
  instagram?: string;
  /** e.g. "West Roxbury, MA" */
  location?: string;
  /** Featured artists sort to the top of the index page. */
  featured?: boolean;
  /** Overrides the generated <meta name="description">. */
  metaDescription?: string;
  keywords?: string[];
}

/**
 * Template — copy this, rename, fill it in, and add it to `artists` below.
 *
 * const EXAMPLE_ARTIST: Artist = {
 *   slug: "jane-doe",
 *   name: "Jane Doe",
 *   tagline: "Oil painter, Jamaica Plain",
 *   blurb:
 *     "Jane paints the marshes and harbors of the South Shore in heavy oils. " +
 *     "We've framed her last three gallery shows, start to finish.",
 *   bio: `Jane Doe has painted the Massachusetts coastline for over twenty years...
 *
 * Her work hangs in private collections across New England...`,
 *   portrait: "/artists/jane-doe/portrait.jpg",
 *   portraitAlt: "Jane Doe in her Jamaica Plain studio",
 *   works: [
 *     {
 *       src: "/artists/jane-doe/harbor-at-dusk.jpg",
 *       alt: "Harbor at Dusk by Jane Doe, framed in a hand-finished gold moulding",
 *       title: "Harbor at Dusk",
 *       medium: "Oil on canvas, 24 x 36",
 *       framing: "Hand-finished gold gilded moulding with museum glass",
 *     },
 *   ],
 *   website: "https://janedoeart.com",
 *   instagram: "https://instagram.com/janedoeart",
 *   location: "Jamaica Plain, MA",
 *   featured: true,
 * };
 */

export const artists: Artist[] = [];

/** Featured artists first, then the rest in declaration order. */
export const sortedArtists: Artist[] = [...artists].sort(
  (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
);

export const hasArtists = artists.length > 0;

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((a) => a.slug === slug);
}

/** Everyone except `slug` — used for the "more artists" strip. */
export function getOtherArtists(slug: string, limit = 3): Artist[] {
  return sortedArtists.filter((a) => a.slug !== slug).slice(0, limit);
}

/** Bare domain for display, e.g. "janedoeart.com". */
export function websiteLabel(artist: Artist): string {
  if (artist.websiteLabel) return artist.websiteLabel;
  if (!artist.website) return "";
  return artist.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
