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
 * Ask each artist for: a headshot, 3-6 photos of work, a 2-3 sentence blurb, a
 * longer bio, their website/Instagram links, and written permission to publish
 * the images (plus whatever credit line they want on them).
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
  /** 2-3 sentences shown on the artist's tab. */
  blurb: string;
  /** Longer bio for the detail page. Blank lines separate paragraphs. */
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
    "Paul Goodnight is one of Boston's best-known painters, working out of the " +
    "South End for decades. His figurative work carries the rhythm of the African " +
    "diaspora, and it hangs everywhere from private collections to the " +
    "Smithsonian American Art Museum.",
  bio: `Paul Goodnight has been a fixture of the Boston art world since the 1970s. Born in Chicago in 1946 and raised by a foster family in the Boston area, he served two years in Vietnam and turned to painting on his return. He went on to study at the Vesper George School of Art and earned his degree from the Massachusetts College of Art in 1976.

His paintings reached a national audience through television and film — most famously on the set of The Cosby Show — and he was commissioned to paint the official commemorative poster for the 1996 Olympic Games in Atlanta. His work is held in the Smithsonian American Art Museum.

For more than twenty years he has worked out of the Piano Factory artists' compound in Boston's South End, where he remains a driving force in the city's art community.`,
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
    "Wendi Gray paints on the North Shore, working out of Salem. She posts new " +
    "pieces as they come off the easel over on Instagram.",
  bio: `Wendi Gray is a painter based in Salem, Massachusetts, on Boston's North Shore.

Her studio work and new pieces show up first on Instagram, which is the best place to follow what she's working on.`,
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
    "Darrell Smith works in the Provincetown tradition of white-line woodblock " +
    "printing — one block, hand-carved, each color painted and pulled by hand. " +
    "It is a technique native to Cape Cod and practiced by very few people.",
  // Lineage below is quoted from his own site: "Darrell learned white-line
  // woodblock printing from Kathryn Lee Smith (no relation), who was taught by
  // her grandmother Ferol Sibley Warthen. Warthen was taught by Blanche Lazzell."
  bio: `Darrell Smith is a printmaker in Provincetown, Massachusetts, working in the white-line woodblock print — a technique developed in Provincetown in 1915 and carried on there ever since. Unlike a conventional woodcut, the whole image is carved into a single block, with each area painted and printed by hand so a thin white line of uncarved wood separates every color.

He learned the method through a direct line of Provincetown printmakers: he studied under Kathryn Lee Smith, who trained with her grandmother Ferol Sibley Warthen, who in turn learned from Blanche Lazzell.

His prints are made and sold under Smith Provincetown Prints.`,
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
    "Laurence Pierce is a Boston artist, photographer and illustrator, and the " +
    "founder of African Winter Gallery/Studio. His paintings, drawings and " +
    "constructions put his aesthetic and social concerns in the same frame.",
  // 1991 move and the Boston African-American Artists Association come from the
  // NCAAA page linked below. The March 2005 gallery opening in Dorchester comes
  // from the Dorchester Reporter, "Basement gallery spotlights artists of color"
  // (Oct 26, 2005): dotnews.com/2005/basement-gallery-spotlights-artists-color/
  bio: `Laurence Pierce is a Boston-based artist, photographer and illustrator whose paintings, drawings and constructions bring together his aesthetic and his social concerns.

He moved to Boston in 1991 and joined the Boston African-American Artists Association. In March 2005 he opened African Winter Gallery — now African Winter Studio — in the basement of his Dorchester home. His solo exhibition Think About It was shown at the National Center of Afro-American Artists.`,
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
    "Jameel Radcliffe is a Boston-based painter working in both figurative and " +
    "abstract painting. His portraits and large oils have been shown around the " +
    "city and featured by WBUR.",
  bio: `Jameel Radcliffe is a painter based in Boston, working across figurative and abstract painting — portraits in oil on one hand, large abstract canvases on the other.

His work has been shown through the Boston Center for the Arts and ShowUp, and WBUR featured him in its series on Boston makers in 2024.`,
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
    "typography and poetry. The work is layered, textural, and the kind of piece " +
    "that rewards a deep mat and a close look.",
  bio: `Deborah Ellington is a collage artist in Roslindale. She builds her work by hand, cutting into painted book pages and setting typography, poetry, color and texture against each other on the page.

Her work is carried by Green Lion Gallery, and she posts new pieces on Instagram.`,
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
