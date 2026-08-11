/**
 * Featured Artists — data source for /artists and /artists/[slug].
 *
 * HOW TO ADD AN ARTIST
 * 1. Drop images in `public/artists/<slug>/` — one portrait (`portrait.jpg`)
 *    plus one file per piece of artwork.
 * 2. Copy the EXAMPLE_ARTIST block below, fill it in, and push it onto
 *    `artists` (order in the array = order of the tabs on /artists).
 * 3. Nothing else to wire up: the nav link, footer link, sitemap entries and
 *    detail pages all come online automatically once this array is non-empty.
 *
 * Ask each artist for: a headshot, 3-6 photos of work, their website/Instagram
 * links, and written permission to publish the images (plus whatever credit
 * line they want on them).
 *
 * COPY RULE (Jake, Aug 2026): highlight the work, not the resume. A sentence
 * or two on what they make and how it looks. No birth dates, no "moved to
 * Boston in 19xx", no year-by-year exhibition history.
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
  /** Credit line the artist asked for, e.g. "Courtesy of the artist". */
  credit?: string;
}

/** An extra reference beyond the primary website/Instagram — shop, museum, press. */
export interface ArtistLink {
  /** Button text, e.g. "Smithsonian American Art Museum" */
  label: string;
  url: string;
}

export interface Artist {
  /** URL segment: /artists/<slug> */
  slug: string;
  name: string;
  /** Short line under the name, e.g. "Oil painter, Jamaica Plain" */
  tagline: string;
  /** A sentence or two about the work, shown on the artist's tab. */
  blurb: string;
  /** Detail-page copy — still short, still about the work. Blank lines separate paragraphs. */
  bio: string;
  /** Headshot / studio photo path under /public. Falls back to initials. */
  portrait?: string;
  portraitAlt?: string;
  /** Their artwork. Empty until the artist sends photos we may publish. */
  works: ArtistWork[];
  website?: string;
  /** Display text for the website button, defaults to the bare domain. */
  websiteLabel?: string;
  instagram?: string;
  /** Shop, museum collection, press features — anything beyond the main site. */
  links?: ArtistLink[];
  /** e.g. "West Roxbury, MA" */
  location?: string;
  /** Featured artists sort to the top of the tab strip. */
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
 *   bio: `Jane Doe paints the Massachusetts coastline in heavy oils — marsh grass, working harbors, weather coming in off the water.`,
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
 *   links: [{ label: "Available work", url: "https://janedoeart.com/shop" }],
 *   location: "Jamaica Plain, MA",
 *   featured: true,
 * };
 */

const PAUL_GOODNIGHT: Artist = {
  slug: "paul-goodnight",
  name: "Paul Goodnight",
  tagline: "Painter",
  blurb:
    "Paul Goodnight's figurative paintings carry the rhythm of the African " +
    "diaspora. His work hangs in the Smithsonian American Art Museum.",
  bio: `Paul Goodnight is one of Boston's best-known painters. His figurative work carries the rhythm of the African diaspora, and it hangs everywhere from private collections to the Smithsonian American Art Museum.

He works out of the Piano Factory artists' compound in Boston's South End, and his paintings have reached a wide audience through film and television.`,
  works: [],
  website: "https://www.paulgoodnight.com/",
  websiteLabel: "paulgoodnight.com",
  links: [
    { label: "Available work", url: "https://www.paulgoodnight.com/shop" },
    {
      label: "Smithsonian American Art Museum",
      url: "https://americanart.si.edu/artist/paul-goodnight-1869",
    },
  ],
  location: "Boston, MA",
  keywords: [
    "Paul Goodnight",
    "Paul Goodnight artist",
    "Paul Goodnight paintings",
    "Boston painter",
    "South End artist Boston",
  ],
};

const WENDI_GRAY: Artist = {
  slug: "wendi-gray",
  name: "Wendi Gray",
  tagline: "Painter",
  blurb:
    "Wendi Gray paints out of Salem, on Boston's North Shore. New pieces go up " +
    "on Instagram as they come off the easel.",
  bio: `Wendi Gray is a painter working out of Salem, on Boston's North Shore.

Instagram is the best place to see what's currently on the easel.`,
  works: [],
  instagram: "https://www.instagram.com/graywendi/",
  location: "Salem, MA",
  keywords: [
    "Wendi Gray",
    "Wendi Gray artist",
    "Salem MA painter",
    "North Shore artist",
  ],
};

const DARRELL_SMITH: Artist = {
  slug: "darrell-smith",
  name: "Darrell Smith",
  tagline: "White-line woodblock printmaker",
  blurb:
    "Darrell Smith makes white-line woodblock prints — one hand-carved block, " +
    "every color painted and pulled by hand. It's a Provincetown technique " +
    "practiced by very few people.",
  bio: `Darrell Smith is a Provincetown printmaker working in the white-line woodblock print. Unlike a conventional woodcut, the whole image is carved into a single block, and each area is painted and printed by hand so a thin white line of uncarved wood separates every color.

It's a technique born in Provincetown and still practiced by only a handful of people. His prints are made and sold under Smith Provincetown Prints.`,
  works: [],
  website: "https://smithprovincetownprints.com/",
  websiteLabel: "smithprovincetownprints.com",
  links: [
    {
      label: "Provincetown Independent feature",
      url: "https://provincetownindependent.org/arts-minds/2023/04/12/arts-briefs-83/",
    },
  ],
  location: "Provincetown, MA",
  keywords: [
    "Darrell Smith",
    "white-line woodblock print",
    "Provincetown printmaker",
    "Provincetown print framing",
  ],
};

const LAURENCE_PIERCE: Artist = {
  slug: "laurence-pierce",
  name: "Laurence Pierce",
  tagline: "Artist, photographer & illustrator",
  blurb:
    "Laurence Pierce makes paintings, drawings and constructions that put his " +
    "aesthetic and his social concerns in the same frame. He works out of " +
    "African Winter Studio in Dorchester.",
  bio: `Laurence Pierce is a Boston artist, photographer and illustrator whose paintings, drawings and constructions bring his aesthetic and his social concerns together in the same piece.

He works out of African Winter Studio in Dorchester, and his solo exhibition Think About It was shown at the National Center of Afro-American Artists.`,
  works: [],
  instagram: "https://www.instagram.com/laurencempierce/",
  links: [
    {
      label: "National Center of Afro-American Artists",
      url: "https://ncaaa.org/museum/collections-exhibitions/think-about-it/",
    },
  ],
  location: "Boston, MA",
  keywords: [
    "Laurence Pierce",
    "Laurence Pierce artist",
    "African Winter Gallery",
    "Boston artist photographer",
  ],
};

const JAMEEL_RADCLIFFE: Artist = {
  slug: "jameel-radcliffe",
  name: "Jameel Radcliffe",
  tagline: "Painter",
  blurb:
    "Jameel Radcliffe paints both ways — portraits in oil on one hand, large " +
    "abstract canvases on the other. WBUR featured him in its series on Boston " +
    "makers.",
  bio: `Jameel Radcliffe is a Boston painter working across figurative and abstract painting — oil portraits on one hand, large abstract canvases on the other.

His work has been shown through the Boston Center for the Arts and ShowUp, and WBUR featured him in its series on Boston makers.`,
  works: [],
  website: "https://www.jameelradcliffe.com/",
  websiteLabel: "jameelradcliffe.com",
  links: [
    {
      label: "Boston Center for the Arts",
      url: "https://bostonarts.org/artist/jameel-radcliffe/",
    },
    { label: "ShowUp", url: "https://www.showupinc.org/about" },
    {
      label: "WBUR: The Makers",
      url: "https://www.wbur.org/news/2024/10/06/the-makers-jameel-radcliffe",
    },
  ],
  location: "Boston, MA",
  keywords: [
    "Jameel Radcliffe",
    "Jameel Radcliffe painter",
    "Boston painter",
    "figurative painting Boston",
  ],
};

const DEBORAH_ELLINGTON: Artist = {
  slug: "deborah-ellington",
  name: "Deborah Ellington",
  tagline: "Paper collage artist",
  blurb:
    "Deborah Ellington makes hand-cut paper collage out of painted book pages, " +
    "typography and poetry — layered, textural work that rewards a close look.",
  bio: `Deborah Ellington is a collage artist in Roslindale. She builds her work by hand, cutting into painted book pages and setting typography, poetry, color and texture against each other on the page.

Her work is carried by Green Lion Gallery, and new pieces go up on Instagram.`,
  works: [],
  instagram: "https://www.instagram.com/deborahellington3/",
  links: [
    {
      label: "Green Lion Gallery",
      url: "https://www.greenlionart.com/deborah-ellington-shop",
    },
  ],
  location: "Roslindale, Boston, MA",
  keywords: [
    "Deborah Ellington",
    "Deborah Ellington collage",
    "Roslindale artist",
    "paper collage Boston",
  ],
};

export const artists: Artist[] = [
  PAUL_GOODNIGHT,
  WENDI_GRAY,
  DARRELL_SMITH,
  LAURENCE_PIERCE,
  JAMEEL_RADCLIFFE,
  DEBORAH_ELLINGTON,
];

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

/** Every off-site URL for an artist — used for schema.org sameAs. */
export function artistSameAs(artist: Artist): string[] {
  return [
    artist.website,
    artist.instagram,
    ...(artist.links || []).map((l) => l.url),
  ].filter(Boolean) as string[];
}

/** "PG" — stands in for a portrait until the artist sends a headshot. */
export function artistInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}
