// Niche service landing pages.
// Mirrors the structure used by /areas/[slug] but tuned for service-type SEO.
// Each entry powers one page at /services/<slug>.

export interface ServiceFAQ {
  q: string;
  a: string;
}

export interface ServiceProcessStep {
  title: string;
  body: string;
}

export interface ServiceInfo {
  slug: string;
  /** SEO <title>. Keep <60 chars. */
  metaTitle: string;
  /** SEO <meta description>. Keep ~150–160 chars. */
  metaDescription: string;
  keywords: string[];
  /** Hero eyebrow text (e.g. "Boston's go-to for"). */
  heroEyebrow: string;
  /** H1 prefix — gold accent applied to heroTitleAccent. */
  heroTitle: string;
  heroTitleAccent: string;
  /** Short hero blurb shown under the H1. */
  heroDescription: string;
  /** Path under /public — used as og:image and hero image. */
  heroImage: string;
  /** Two short paragraphs of intro copy. */
  intro: string[];
  /** "What we frame" bullet grid. */
  whatWeFrame: string[];
  /** Three to five process steps for this niche specifically. */
  process: ServiceProcessStep[];
  /** Niche-specific features / promises (UV glass, acid-free mounting, etc.). */
  features: string[];
  /** Boston / local context paragraph. */
  localContext: string;
  /** Optional gallery (paths under /public). */
  gallery?: string[];
  /** Three to six FAQs. */
  faqs: ServiceFAQ[];
  /** Cross-links shown at the bottom. */
  relatedSlugs: string[];
  /** schema.org Service category (used in JSON-LD). */
  schemaCategory: string;
}

export const SERVICES: ServiceInfo[] = [
  // ------------------------------------------------------------------
  // 1. SPORTS MEMORABILIA
  // ------------------------------------------------------------------
  {
    slug: "sports-memorabilia-framing",
    metaTitle: "Sports Memorabilia Framing in Boston | Jerseys, Tickets, Photos",
    metaDescription:
      "Boston's trusted sports memorabilia framer since 1981. Jersey shadow boxes, autographed photos, ticket stubs, baseballs & pucks. UV-protective glass, acid-free mounting. Walk-ins welcome.",
    keywords: [
      "sports memorabilia framing Boston",
      "jersey framing Boston",
      "jersey shadow box framing",
      "framing for autographed jerseys",
      "Red Sox jersey framing",
      "Patriots jersey framing",
      "Bruins jersey framing",
      "Celtics jersey framing",
      "ticket stub framing Boston",
      "autographed photo framing",
      "baseball shadow box framing",
      "puck shadow box framing",
      "sports collectibles framing near me",
      "sports memorabilia framer near me",
      "framer for game-worn jerseys",
    ],
    heroEyebrow: "Boston's Go-To Sports Memorabilia Framer",
    heroTitle: "Sports Memorabilia Framing in",
    heroTitleAccent: "Boston",
    heroDescription:
      "Jersey shadow boxes, autographed photos, ticket stubs, signed baseballs and pucks — built by hand in West Roxbury since 1981. UV-protective glass and acid-free materials so the piece you love never fades.",
    heroImage: "",
    intro: [
      "If you've got a Brady jersey, a Sox lineup card, or a Bruins puck from a game you'll never forget — those pieces deserve more than a closet shelf. We've spent 40+ years building shadow boxes for Boston's most passionate fans, athletes, and collectors.",
      "Every memorabilia piece we frame is mounted on archival, acid-free backing and sealed behind UV-protective glass. That means autographs don't fade, jerseys don't yellow, and the piece looks the same in 20 years as the day you brought it in.",
    ],
    whatWeFrame: [
      "Game-worn and replica jerseys (NFL, MLB, NHL, NBA, soccer, college)",
      "Autographed photographs and 8×10s",
      "Ticket stubs from championship games and historic moments",
      "Signed baseballs, pucks, footballs, basketballs",
      "Bats, helmets, hats, and gloves in custom shadow boxes",
      "Boxing gloves, MMA gear, golf flags and scorecards",
      "Pennants, programs, and game-day collectibles",
      "Multi-piece collections — jersey + photo + ticket layouts",
      "Trading card displays (rookie cards, graded cards, complete sets)",
      "Championship rings, medals, and trophies",
    ],
    process: [
      {
        title: "Bring the piece in",
        body: "Walk in with the jersey, ball, photo, or memorabilia. We'll talk through layout options, glass type, and the right way to mount it once we've had a chance to look at the piece in person.",
      },
      {
        title: "Design the shadow box",
        body: "We mock up frame moulding, mat color, and inset depth. For autographed pieces we'll explain UV vs. museum glass — the right choice depends on where the piece will hang.",
      },
      {
        title: "Archival mounting",
        body: "Jerseys are mounted with hidden, reversible stitching that doesn't damage the fabric. Autographed pieces are mounted on acid-free backing that won't bleed or yellow over time.",
      },
      {
        title: "Build, glaze, and inspect",
        body: "Our framers hand-build the box in our West Roxbury shop. Every piece gets inspected for dust, alignment, and seal before it leaves.",
      },
      {
        title: "Pickup or local delivery",
        body: "Most jerseys finish in 5–7 business days. Rush jobs available. We can deliver to most Greater Boston addresses for an extra fee.",
      },
    ],
    features: [
      "UV-protective glass blocks 97%+ of fading rays",
      "Acid-free, archival mounting — no tape on the autograph",
      "Reversible stitching for jerseys (no needle holes through the logo)",
      "Sealed dust-tight construction",
      "Custom moulding in dozens of finishes — wood, metal, gilded",
      "Engraved nameplates available for the bottom of the frame",
      "Insurance appraisals on request for high-value pieces",
    ],
    localContext:
      "We're a few minutes from Fenway, the Garden, and Gillette is a quick drive south. Over 40 years we've framed pieces from the '04 World Series team, Bruins Cup runs, Patriots dynasty years, and countless Celtics legends. If it happened in Boston sports, there's a good chance someone brought a piece of it through our door.",
    gallery: [],
    faqs: [
      {
        q: "How much does a jersey shadow box cost?",
        a: "Every shadow box is custom. Pricing depends on the size of the jersey, the moulding you choose, the glass type, and how many pieces are mounted. Bring the piece in and we'll design the shadow box and work out the pricing together. Walk-ins are always welcome.",
      },
      {
        q: "Will mounting damage my game-worn jersey?",
        a: "No. We use a reversible mounting technique that doesn't pierce the logo, numbers, or autograph areas. The jersey can be removed at any point with no permanent alteration.",
      },
      {
        q: "Should I get UV glass or museum glass for an autographed jersey?",
        a: "UV glass blocks ~97% of fading rays and is the right call for most pieces hanging in a normal room. Museum glass adds anti-reflective coating and is worth it for high-value pieces or pieces hung in bright rooms.",
      },
      {
        q: "Can you frame a championship ring or medal?",
        a: "Yes — we build custom shadow boxes with recessed inserts for rings, medals, and 3D pieces. Often we'll combine the ring with a photo, scorecard, or program in a single layout.",
      },
      {
        q: "How long does it take?",
        a: "Standard turnaround is 5–7 business days. Rush jobs (including same-day for simple framings) are available — call us and we'll let you know what's possible.",
      },
      {
        q: "Do you handle insurance appraisals?",
        a: "We can provide a written framing-and-materials appraisal for insurance purposes. For authentication of the autograph or memorabilia itself, we'll refer you to PSA or JSA.",
      },
    ],
    relatedSlugs: ["military-shadow-boxes", "canvas-stretching", "diploma-framing"],
    schemaCategory: "Sports memorabilia and jersey custom framing",
  },

  // ------------------------------------------------------------------
  // 2. DIPLOMA FRAMING
  // ------------------------------------------------------------------
  {
    slug: "diploma-framing",
    metaTitle: "Custom Diploma Framing | Any School's Colors & Seal",
    metaDescription:
      "Custom diploma framing for graduates of any school — official mat colors, seal embossing, and conservation glass. West Roxbury, MA framer since 1981. Walk-ins welcome.",
    keywords: [
      "custom diploma framing",
      "diploma framing near me",
      "diploma framing Boston",
      "diploma framing West Roxbury",
      "Harvard diploma framing",
      "MIT diploma framing",
      "BU diploma framing",
      "BC diploma framing",
      "Northeastern diploma framing",
      "Tufts diploma framing",
      "Wellesley diploma framing",
      "Babson diploma framing",
      "Ivy League diploma framing",
      "graduation framing",
      "certificate framing",
      "JD diploma framing",
      "MBA diploma framing",
      "PhD diploma framing",
      "professional certification framing",
      "bar admission framing",
      "school seal embossing",
      "official school colors mat",
    ],
    heroEyebrow: "For Every Graduate",
    heroTitle: "Custom Diploma",
    heroTitleAccent: "Framing",
    heroDescription:
      "Official mat colors, seal embossing, and conservation glass — for graduates of any school, anywhere. From the Boston-area institutions we know by heart to schools across the country, we match the colors and details that make a diploma frame feel official.",
    heroImage: "",
    intro: [
      "A diploma is a once-in-a-lifetime document. It belongs in a frame that matches the institution and protects the paper for the next 40 years — not a generic frame off the shelf at a big-box store.",
      "We frame diplomas from any school. We stock the official mat colors for every Boston-area institution and can match the colors and seals of schools across the country. Acid-free, conservation-grade materials throughout — your diploma stays bright for decades.",
    ],
    whatWeFrame: [
      "Undergraduate diplomas (BA, BS, BFA)",
      "Graduate degrees (MA, MS, MBA, MFA, MEd)",
      "Doctoral degrees (PhD, EdD, JD, MD, DDS)",
      "Honorary degrees and citations",
      "Professional certifications and licenses (bar admission, CPA, RN)",
      "Commissions and military discharge papers",
      "Multi-degree displays (BS + MBA in one frame)",
      "Diploma + graduation photo + tassel combinations",
      "Class composites and group photos",
      "Awards, honors, and induction certificates",
    ],
    process: [
      {
        title: "Bring in the diploma",
        body: "Bring the original or a printed copy. We never trim or alter the document — everything is reversible. We can also work from a high-resolution scan if you'd rather keep the original at home.",
      },
      {
        title: "Match the school",
        body: "Tell us which school. We match the official mat colors and seal embossing of any institution. If we don't already stock the colors for your school, we'll match them from samples.",
      },
      {
        title: "Choose moulding and glass",
        body: "Most graduates pick a traditional dark wood or burnished gold moulding. We'll recommend conservation glass with UV protection so the parchment stays bright.",
      },
      {
        title: "Build and seal",
        body: "Acid-free mounting, sealed dust covers, and museum-quality construction. Every diploma frame is built to last decades.",
      },
    ],
    features: [
      "Official mat colors and seal embossing for any school",
      "Conservation glass blocks UV — parchment stays bright for decades",
      "Acid-free, reversible mounting — never damages the document",
      "Optional engraved nameplate with name, degree, and date",
      "Multi-degree layouts (combine multiple diplomas in one frame)",
      "Add tassel, class photo, or honor cord in a custom shadow box",
      "Bulk pricing for law firms, hospitals, and corporate offices framing partner credentials",
    ],
    localContext:
      "Boston has 50+ colleges and universities, and we've been framing diplomas for graduates from every one of them — Harvard crimson, BC maroon-and-gold, BU scarlet-and-white, MIT cardinal-and-gray. We also frame diplomas for graduates of schools across the country. If your school's mat colors aren't in our stock, we'll match them from the official samples. We also work with corporate offices, law firms, and medical practices that need partner credentials framed consistently across the wall.",
    gallery: [],
    faqs: [
      {
        q: "How much does diploma framing cost?",
        a: "Every diploma frame is custom — pricing depends on size, the moulding you choose, mat options, glass type, and whether you want embossing or a nameplate. Bring the diploma in and we'll design and price the frame together. Quotes are always free.",
      },
      {
        q: "Do you have official mat colors for my school?",
        a: "We stock official mat colors for every major Boston-area institution — Harvard, MIT, BU, BC, Northeastern, Tufts, Wellesley, Babson, Brandeis, Suffolk, Emerson, Bentley, and more — and we can match official colors for schools anywhere in the country. Just let us know the school and we'll match it.",
      },
      {
        q: "Will framing damage the diploma?",
        a: "No. We use acid-free, reversible mounting with no tape touching the document. Conservation glass protects the paper from UV fading. The diploma can be removed at any time with no alteration.",
      },
      {
        q: "Can you emboss the school seal on the mat?",
        a: "Yes — we offer raised gold or blind embossing of school seals for most major institutions. It's a small detail that makes the frame feel official.",
      },
      {
        q: "Do you offer bulk pricing for law firms or medical practices?",
        a: "Yes. We work with Boston-area firms that frame every partner's diploma collection consistently. Email us with the count and schools, then come in and we'll work out the project pricing. Volume discount available.",
      },
      {
        q: "How long does it take?",
        a: "Standard turnaround is 5–7 business days. Rush available for graduation deadlines — let us know your event date when you order.",
      },
    ],
    relatedSlugs: ["corporate-art-programs", "military-shadow-boxes", "sports-memorabilia-framing"],
    schemaCategory: "Custom diploma and certificate framing",
  },

  // ------------------------------------------------------------------
  // 3. MILITARY / FIRST RESPONDER SHADOW BOXES
  // ------------------------------------------------------------------
  {
    slug: "military-shadow-boxes",
    metaTitle: "Military & First Responder Shadow Boxes | Boston Framing",
    metaDescription:
      "Custom shadow boxes for military veterans, police, fire, and EMS in Boston. Medals, badges, patches, flags, and challenge coins, framed by hand since 1981. Trusted by Boston PD.",
    keywords: [
      "military shadow box framing Boston",
      "veteran shadow box framing",
      "retirement shadow box Boston",
      "police shadow box framing",
      "fire department shadow box",
      "EMS shadow box framing",
      "challenge coin display framing",
      "medal display framing Boston",
      "flag and medal shadow box",
      "uniform framing Boston",
      "military retirement gift framing",
      "first responder retirement frame",
    ],
    heroEyebrow: "Trusted by Boston PD, Fire & Veterans",
    heroTitle: "Military & First Responder",
    heroTitleAccent: "Shadow Boxes",
    heroDescription:
      "Medals, badges, patches, flags, and challenge coins — built into custom shadow boxes that honor a career of service. We've framed retirement displays for Boston police, fire, EMS, and veterans for over 40 years.",
    heroImage: "",
    intro: [
      "A retirement after 25 or 30 years of service deserves more than a thank-you letter. We build shadow boxes that pull together the medals, patches, badge, flag, photos, and challenge coins from an entire career into one piece that hangs proudly in a den, office, or station house.",
      "Boston Police, BFD, and military families have been bringing retirement displays to our shop for decades. We know how to lay out the rank insignia, fold the flag correctly, mount the medals without damaging the ribbons, and pair it all with the right photos and citations.",
    ],
    whatWeFrame: [
      "Folded American flag + medals + photos in triangular display cases",
      "Police retirement displays — badge, patches, commendations, photos",
      "Fire department retirement — badge, helmet front, patches, citations",
      "EMS service displays — patches, certifications, career photos",
      "Military medal racks (Army, Navy, Air Force, Marines, Coast Guard)",
      "Challenge coin displays (single or multi-row)",
      "Service uniforms — full uniform shadow boxes",
      "Purple Heart and combat decoration displays",
      "Promotion certificates and unit citations",
      "Memorial / KIA tribute shadow boxes",
    ],
    process: [
      {
        title: "Bring everything in",
        body: "Bring all the items — medals, patches, badge, flag, photos, citations. We'll lay them out together so you can see the full story before we design the box.",
      },
      {
        title: "Design the layout",
        body: "We arrange the pieces in proper military or department protocol. Rank insignia goes where rank insignia goes; ribbons sit in proper order. We can recreate any official rack arrangement.",
      },
      {
        title: "Choose moulding and depth",
        body: "Service shadow boxes are usually deeper to accommodate medals and 3D items. We pick a moulding that matches the tone — often dark wood with subtle gold accents.",
      },
      {
        title: "Mount and seal",
        body: "Every medal is mounted with archival, reversible methods — no glue on the ribbons. The flag is properly folded and pinned. Acid-free backing throughout.",
      },
      {
        title: "Engrave the nameplate",
        body: "Most retirement displays include an engraved brass plate with name, rank, badge number, and dates of service. Included on most builds.",
      },
    ],
    features: [
      "Proper protocol for medal and ribbon arrangement (Army, Navy, USAF, USMC, USCG, BPD, BFD)",
      "Reversible, archival mounting — medals are not glued or pierced",
      "Engraved brass nameplates included on most retirement builds",
      "Folded flag display cases with optional inset medals",
      "UV-protective glass to keep ribbons and patches from fading",
      "Department-specific layouts (BPD, BFD, MA State Police, etc.)",
      "Bulk pricing for unit-wide retirement gifts",
    ],
    localContext:
      "We work directly with Boston Police, Boston Fire, and surrounding departments on a steady stream of framing — artwork for stations and offices, medallions and citations, recognition awards, retirement displays, and high-quality presentation pieces. Several BPD districts and BFD houses are longtime clients. We also work with VA hospitals, Bedford VA, and military families across Greater Boston. For department or unit-wide projects, ask us about volume pricing.",
    gallery: [
      "/framed-art/flag-with-medals.jpg",
      "/framed-art/ems-patches-collage.webp",
      "/framed-art/honor-certificate.webp",
      "/framed-art/vintage-flag-large.webp",
    ],
    faqs: [
      {
        q: "How much does a retirement shadow box cost?",
        a: "Every retirement shadow box is custom — pricing depends on the depth of the box, the moulding, the number of items being mounted, and whether a folded flag is included. Bring the items in and we'll lay them out and work out the pricing together. Walk-ins are always welcome.",
      },
      {
        q: "Will mounting damage my medals or ribbons?",
        a: "No. We use reversible, archival methods. Medals are pinned through the backing — never glued — and ribbons are left intact. Everything can be removed at any time without alteration.",
      },
      {
        q: "Do you do flag-only display cases (KIA / military funeral flags)?",
        a: "Yes. We build proper triangular display cases for funeral and ceremonial flags, with optional inset compartments for medals, dog tags, or photos.",
      },
      {
        q: "Can you do bulk projects for a department or unit?",
        a: "Yes. We work with BPD districts, BFD houses, and military units on bulk retirement gifts. Email us the count, then come in and we'll work out the pricing with the volume discount applied.",
      },
      {
        q: "Can you replicate official medal-rack protocol?",
        a: "Yes. We follow proper service protocol for medal and ribbon order. If you have a specific layout you want preserved, bring a photo or DD-214 and we'll match it.",
      },
      {
        q: "How long does it take?",
        a: "Most service shadow boxes finish in 7–10 business days because of the layout work involved. Rush available — call us with your retirement date.",
      },
    ],
    relatedSlugs: ["canvas-stretching", "sports-memorabilia-framing", "diploma-framing"],
    schemaCategory: "Military and first responder shadow box framing",
  },

  // ------------------------------------------------------------------
  // 4. CANVAS STRETCHING & FRAMING
  // ------------------------------------------------------------------
  {
    slug: "canvas-stretching",
    metaTitle: "Canvas Stretching & Framing in Boston | Gallery Wraps & Floaters",
    metaDescription:
      "Custom canvas stretching, gallery wraps, floater frames, and re-stretching for sagging or warped paintings. Hand-stretched in West Roxbury since 1981. Walk-ins welcome.",
    keywords: [
      "canvas stretching Boston",
      "canvas stretching near me",
      "canvas stretching West Roxbury",
      "stretch a canvas painting",
      "gallery wrap Boston",
      "gallery wrap framing",
      "floater frame canvas",
      "framing for canvas painting",
      "oil painting stretching Boston",
      "acrylic painting stretching",
      "rolled canvas stretching",
      "unstretched canvas framing",
      "canvas re-stretching",
      "warped canvas repair Boston",
      "sagging canvas fix",
      "custom stretcher bars",
      "oversize canvas stretching",
      "plein air painting framing",
      "canvas print framing",
    ],
    heroEyebrow: "Hand-Stretched Canvas Since 1981",
    heroTitle: "Canvas Stretching",
    heroTitleAccent: "& Framing",
    heroDescription:
      "Rolled canvases, unstretched paintings, gallery wraps, floater frames, and re-stretching for sagging or warped pieces — built by hand in West Roxbury. Whether you bought a painting on vacation that needs stretching or you're an artist with a stack of unstretched canvases, we handle it all.",
    heroImage: "",
    intro: [
      "Stretching a canvas properly is a craft. The tension has to be even on every side, the corners need to be tucked cleanly, and the stretcher bars have to be sized exactly right for the painting. Done well, the canvas hangs flat for decades. Done poorly, it warps within a year.",
      "We've been hand-stretching canvases in West Roxbury for over 40 years — for working artists, galleries, designers, and customers who picked up a painting they love and need it finished. We build custom stretcher bars to size, stretch by hand for proper tension, and offer gallery wraps, floater frames, or traditional framing depending on the look you want.",
    ],
    whatWeFrame: [
      "Rolled canvas paintings (oil, acrylic, mixed media)",
      "Unstretched gallery prints and limited editions",
      "Re-stretching for sagging or warped paintings",
      "Gallery wraps (canvas wrapped around bars, no traditional frame)",
      "Floater frames (canvas sits inside the frame with a small reveal)",
      "Traditional frames for canvas — with or without a mat / liner",
      "Plein-air paintings of any size",
      "Oversize canvases (we have the space and equipment)",
      "Canvas prints — modern print-on-canvas pieces",
      "Inherited or vintage canvas paintings needing fresh stretcher bars",
      "Custom stretcher bars built to exact dimensions",
    ],
    process: [
      {
        title: "Bring the canvas in",
        body: "Bring the rolled or unstretched canvas in. We'll measure, look at the surface, and discuss the right stretcher bar depth (standard 3/4\", gallery wrap 1.5\", or extra-deep) based on the look you want and where the piece will hang.",
      },
      {
        title: "Custom stretcher bars built to size",
        body: "We build stretcher bars to your canvas's exact dimensions — kiln-dried wood with proper keys at the corners so the canvas stays tight over time. No off-the-shelf compromises.",
      },
      {
        title: "Hand-stretching",
        body: "Each canvas is stretched by hand for even tension on all four sides. The corners are folded cleanly. For valuable or vintage pieces we use archival, reversible methods so the painting can be re-stretched in the future without damage.",
      },
      {
        title: "Gallery wrap, floater frame, or traditional",
        body: "Decide how you want it finished — gallery wrap (no frame, edges painted or wrapped), floater frame (modern look with a small gap between canvas and frame), or a traditional moulded frame with optional liner. We'll show you options for the painting.",
      },
      {
        title: "Pickup",
        body: "Standard turnaround is 5–7 business days. Larger or oversize pieces may take longer. Rush jobs available.",
      },
    ],
    features: [
      "Hand-stretched (not pneumatic) for proper, even tension",
      "Custom kiln-dried stretcher bars built to exact size",
      "Multiple bar depths — standard, gallery-wrap, oversize",
      "Re-stretching service for sagging, warped, or aging canvases",
      "Gallery wrap, floater frame, or traditional frame options",
      "Archival, reversible methods for valuable or vintage canvases",
      "Oversize canvas capacity (the shop has the space and gear)",
      "Wholesale rates for working artists, galleries, and designers",
    ],
    localContext:
      "Boston has a serious working-artist community, a strong plein-air tradition, and dozens of galleries from the SoWa district to the South End to the North Shore. We've built relationships with artists, galleries, and designers across Greater Boston for over 40 years. Plenty of customers also bring us paintings they bought on vacation — Cape Cod, Provincetown, Newport, Italy, the Caribbean — that need to be stretched and finished once they're home.",
    gallery: [],
    faqs: [
      {
        q: "How much does it cost to stretch a canvas?",
        a: "Every canvas is custom — pricing depends on size, stretcher bar depth, and whether you want a gallery wrap, floater frame, or traditional frame. Bring the canvas in and we'll measure and work out the pricing together. Walk-ins are always welcome.",
      },
      {
        q: "What's the difference between a gallery wrap and a floater frame?",
        a: "A gallery wrap has the canvas wrapped around the sides of the stretcher bars with no frame — a clean, modern look. A floater frame surrounds the canvas with a small visible gap between the canvas edge and the frame, so the canvas appears to 'float' inside it. Both work well for contemporary paintings; gallery wraps cost less, floater frames look more finished.",
      },
      {
        q: "Can you re-stretch a sagging or warped canvas?",
        a: "Yes. Older canvases often loosen up as the wood settles or the canvas relaxes. We can pull the canvas off the original bars, build new stretcher bars if needed, and re-stretch it properly. For valuable or vintage pieces we use reversible methods that don't damage the painting.",
      },
      {
        q: "How big can you go?",
        a: "We've stretched canvases up to gallery-wall scale and beyond. The shop has the space and equipment for oversize work. Bring it in or call ahead so we can plan the build.",
      },
      {
        q: "Do you offer wholesale rates for artists or galleries?",
        a: "Yes. Working artists, galleries, and designers who use us regularly get wholesale pricing. Stop by or have your studio manager get in touch.",
      },
      {
        q: "How long does it take?",
        a: "Standard turnaround is 5–7 business days. Oversize, vintage, or restoration-style work takes longer. Rush jobs available — call ahead.",
      },
    ],
    relatedSlugs: ["sports-memorabilia-framing", "diploma-framing", "corporate-art-programs"],
    schemaCategory: "Canvas stretching and framing services",
  },

  // ------------------------------------------------------------------
  // 5. CORPORATE ART PROGRAMS (B2B)
  // ------------------------------------------------------------------
  {
    slug: "corporate-art-programs",
    metaTitle: "Corporate Art Framing in Boston | Hotels, Law Firms, Hospitals",
    metaDescription:
      "Bulk custom framing for Boston hotels, law firms, hospitals, and corporate offices. Donor walls, partner diploma displays, lobby art, conservation framing. Volume pricing & project management.",
    keywords: [
      "corporate art framing Boston",
      "law firm diploma framing Boston",
      "hotel art framing Boston",
      "hospital art program framer",
      "donor wall framing Boston",
      "office art framing bulk pricing",
      "interior designer framing partner Boston",
      "real estate staging framer",
      "corporate framing volume pricing",
      "framing partner for designers Boston",
      "B2B framing Boston",
    ],
    heroEyebrow: "B2B Custom Framing for Boston Businesses",
    heroTitle: "Corporate Art",
    heroTitleAccent: "Programs",
    heroDescription:
      "Hotels, law firms, hospitals, and corporate offices across Greater Boston rely on us for bulk custom framing — donor walls, partner diploma displays, lobby art, and recurring framing projects. Volume pricing, dedicated project management, and direct billing.",
    heroImage: "",
    intro: [
      "If you run an office, hotel, hospital, design studio, or staging firm, framing is rarely a one-time job. Donor walls expand. New partners need diplomas matched to existing displays. Lobbies refresh art every few years. We're built for that kind of recurring, multi-piece work.",
      "We've been the framing partner for Greater Boston hotels, law offices, hospital art programs, and interior designers for decades. We work directly with facilities managers, designers, and procurement teams — so the project gets done without your team chasing details.",
    ],
    whatWeFrame: [
      "Law firm partner diploma displays — matched moulding across the partner floor",
      "Hospital art programs and donor walls (UV conservation framing standard)",
      "Hotel guest room and lobby art (volume pricing for full property refreshes)",
      "Corporate office lobby installations and conference room art",
      "Interior designer projects — luxury home installations across Boston suburbs",
      "Real estate staging — bulk frames for staging companies",
      "Restaurant and retail art programs",
      "Photographer and gallery wholesale framing",
      "School and university administrative installations",
      "Recurring memorial and tribute projects for institutions",
    ],
    process: [
      {
        title: "On-site walkthrough",
        body: "We come to your space (Greater Boston) to see the project in person. We measure, photograph, and understand the scope. No charge for the walkthrough — we just need to see the work to scope it properly.",
      },
      {
        title: "Pricing in writing",
        body: "Every project gets itemized pricing in writing: piece count, moulding choices, glass type, mat options, timeline, and total. No surprise add-ons.",
      },
      {
        title: "Approval samples",
        body: "For larger projects we'll build one sample piece for sign-off before producing the rest. Designers and facilities managers love this — no guesswork.",
      },
      {
        title: "Production",
        body: "We handle pickup of artwork from your office or directly from the artist/printer. Production happens in our West Roxbury shop with project management throughout.",
      },
      {
        title: "Delivery & install",
        body: "We deliver to your space and can hang most installations ourselves. Direct billing with net-30 terms available for established clients.",
      },
    ],
    features: [
      "Volume pricing on projects of 10+ pieces",
      "Net-30 invoicing for qualified businesses",
      "On-site walkthroughs and measurements (Greater Boston)",
      "Single point of contact for the duration of the project",
      "Approval samples for designer/facilities sign-off",
      "Pickup, delivery, AND professional hanging / installation — we hang the work for you, level and secure",
      "Right hardware for every wall type (drywall, plaster, concrete, brick)",
      "Conservation glass and acid-free materials standard for institutional work",
      "Insurance certificates for installations on request",
    ],
    localContext:
      "We've worked with Greater Boston hospitals, hotels, AmLaw 100 firms, regional law firms, hospitality groups, real estate developers, and dozens of interior designers over four decades. The reason work keeps coming back: it's done right the first time, with predictable pricing and someone who answers the phone. Designers in particular value our ability to match existing moulding lines years later.",
    gallery: [],
    faqs: [
      {
        q: "Do you offer volume / bulk pricing?",
        a: "Yes. Projects of 10+ pieces get tiered volume pricing. Larger ongoing accounts (hotels, hospitals, law firms) get a custom rate card.",
      },
      {
        q: "Do you bill on Net-30 terms?",
        a: "Yes — established business accounts can bill Net-30 after the first project. New accounts typically run on standard payment terms for the first project.",
      },
      {
        q: "Can you hang the artwork as well?",
        a: "Yes. We handle delivery and installation for most Greater Boston installs. We carry liability coverage and can provide an insurance certificate on request.",
      },
      {
        q: "We're a designer / staging company. Can you be our wholesale framer?",
        a: "Absolutely. Designers, stagers, photographers, and galleries are a meaningful part of our business. Email us about a wholesale rate sheet and trade pricing.",
      },
      {
        q: "Can you match existing framing in our office?",
        a: "Yes. Bring (or email a photo of) a sample piece and we'll match the moulding, mat, and glass. We keep records of major client mouldings so future pieces match years later.",
      },
      {
        q: "Who's our point of contact?",
        a: "Every business client gets a single point of contact at the shop for the duration of the project. No bouncing between staff.",
      },
    ],
    relatedSlugs: ["diploma-framing", "canvas-stretching", "military-shadow-boxes"],
    schemaCategory: "Corporate and B2B custom framing services",
  },

  // ------------------------------------------------------------------
  // 6. MARATHON & RACE BIB FRAMING
  // ------------------------------------------------------------------
  {
    slug: "marathon-race-bib-framing",
    metaTitle: "Boston Marathon & Race Bib Framing | Medals, Bibs, Singlets",
    metaDescription:
      "Custom shadow boxes for Boston Marathon bibs, finisher medals, signed singlets, and race-day photos. Hand-built in West Roxbury since 1981. Walk-ins welcome.",
    keywords: [
      "Boston Marathon framing",
      "Boston Marathon bib framing",
      "race bib framing Boston",
      "marathon medal display Boston",
      "marathon shadow box framing",
      "Boston Marathon medal framing",
      "race medal display Boston",
      "framing for finisher medal",
      "framing for marathon photos",
      "BAA unicorn jacket framing",
      "BAA singlet framing",
      "Falmouth Road Race framing",
      "half marathon shadow box",
      "Ironman triathlon medal framing",
      "race bib and medal shadow box",
      "Six Star Marathon Majors framing",
      "Patriots Day marathon framing",
      "marathoner framer near me",
    ],
    heroEyebrow: "Boston's Marathon-Bib Framer",
    heroTitle: "Boston Marathon",
    heroTitleAccent: "& Race Bib Framing",
    heroDescription:
      "Race bib + finisher medal + finish-line photo, built into one shadow box that lives on a wall in your home. We've framed Boston Marathon bibs, BAA unicorn singlets, and personal-best medals for runners across the city since 1981.",
    heroImage: "/framed-art/boston-marathon-jersey.jpg",
    intro: [
      "Crossing the finish line on Boylston — or any race you trained months for — is the kind of day that deserves more than a bib stuffed in a drawer. We build shadow boxes that pull the bib, the finisher medal, the signed singlet, and the finish-line photo together into one piece that hangs on a wall and tells the whole story.",
      "Whether it's your first Boston, your tenth, an Ironman, or a charity 5K that meant the world — race memorabilia gets the same treatment we give championship jerseys: archival mounting, UV-protective glass so the bib paper and photos don't fade, and a layout that does the day justice.",
    ],
    whatWeFrame: [
      "Boston Marathon bibs, finisher medals, and certificates",
      "BAA unicorn singlets, finisher jackets, and signed race-day gear",
      "Race-day bib + medal + finish-line photo combos",
      "Multi-race displays — Boston, NYC, Chicago, London, Berlin, Tokyo (Six Star Majors)",
      "Falmouth Road Race, BAA 5K / 10K / Half, BAA Distance Medley pieces",
      "Ironman, half-Ironman, and triathlon medals",
      "Charity-team bibs (Dana-Farber, Project Bread, Boston Children's)",
      "Personal-best splits printouts framed alongside the medal",
      "First-marathon and milestone-marathon (10th, 25th, 30th) commemoratives",
      "Signed singlets and bibs from elite runners or charity-event signings",
    ],
    process: [
      {
        title: "Bring the keepsakes in",
        body: "Bring the bib, medal, finisher photo, splits printout, and any signed gear. We'll lay it all out together so you can see how the pieces work as a single layout before we build anything.",
      },
      {
        title: "Design the shadow box",
        body: "Most marathon shadow boxes are 16×20 or 20×24. We pick moulding and mat colors that complement the medal ribbon — often dark wood with subtle gold accents, or BAA blue-and-yellow if you want to lean into the Boston colors.",
      },
      {
        title: "Archival mounting",
        body: "Bibs are mounted on acid-free backing — never taped through the paper. Medals are mounted through their natural ribbon hole or pinned to the backing; ribbons are left intact and reversible. UV-protective glass keeps photos and printed bibs from fading over the decades.",
      },
      {
        title: "Build, glaze, and engrave",
        body: "Frames are hand-built in our West Roxbury shop. Optional engraved brass nameplates with finish time, race name, and date are popular for milestone races — first Boston, BQ year, Six Star finish.",
      },
      {
        title: "Pickup before race day",
        body: "Standard turnaround is 5–7 business days. If you're framing a milestone as a Patriots' Day surprise or a runner's birthday gift, call ahead with your deadline and we'll make sure it's done in time.",
      },
    ],
    features: [
      "Acid-free, archival mounting — bib paper stays bright for decades",
      "UV-protective glass blocks 97%+ of fading rays",
      "Reversible medal mounting — ribbons aren't pierced or glued",
      "Engraved brass nameplates with finish time, race, and date",
      "Multi-race layouts (Six Star, Marathon Majors, BAA Triple Crown)",
      "Custom moulding — including BAA blue-and-yellow palette",
      "Reversible singlet mounting (no needle holes through the unicorn)",
      "Bulk pricing for charity teams (Dana-Farber, Project Bread, Boston Children's)",
    ],
    localContext:
      "Boston is the marathon capital of the country — Patriots' Day, the BAA 5K / 10K / Half, the Falmouth Road Race, the BAA Distance Medley, and an enormous charity-running community across Greater Boston. We see a steady stream of marathon shadow boxes every spring and fall: first-time finishers, Boston Qualifiers, Six-Star Majors finishers, and charity-team runners who raised for Dana-Farber, Project Bread, and Boston Children's. Bring the bib in any time of year and we'll have it ready for the next Patriots' Day.",
    gallery: [
      "/framed-art/marathon-shadowbox-collection.jpg",
    ],
    faqs: [
      {
        q: "How much does a marathon shadow box cost?",
        a: "Every marathon shadow box is custom — pricing depends on size, the moulding you choose, the glass, and how many pieces are mounted (bib alone vs. bib + medal + photo + jacket). Bring the keepsakes in and we'll design the shadow box and work out the pricing together. Walk-ins are always welcome.",
      },
      {
        q: "Will mounting damage my bib or medal?",
        a: "No. Bibs are mounted on acid-free backing with reversible methods — no tape across the race number, no piercing through the paper. Medals are mounted through their natural ribbon hole or pinned to the backing — the ribbon is never cut or glued.",
      },
      {
        q: "Can you frame a bib + medal + finish-line photo together?",
        a: "That's the most popular layout. Bib on one side, medal on the other, finish-line or Athlete's Village photo in the middle, and an engraved nameplate underneath with the finish time. Works for marathons, halves, Ironman events, anything.",
      },
      {
        q: "Do you do Six-Star or Marathon Majors displays?",
        a: "Yes — multi-race displays for Six Star finishers (Boston, NYC, Chicago, Berlin, London, Tokyo) are a great fit for a single large shadow box with all six medals laid out together. We've done a number of these.",
      },
      {
        q: "Can you frame the BAA unicorn jacket or singlet?",
        a: "Absolutely. Signed singlets, finisher jackets, and BAA-branded gear frame beautifully on their own or paired with the bib and medal. We use the same reversible mounting as for jersey shadow boxes — no needle holes through the unicorn logo.",
      },
      {
        q: "How long does it take?",
        a: "Standard turnaround is 5–7 business days. If you're framing a milestone race as a surprise gift, call us with your deadline and we'll make sure it's done in time.",
      },
      {
        q: "Do you do bulk pricing for charity teams?",
        a: "Yes — Dana-Farber, Project Bread, Boston Children's, and other charity-team runners often frame their finisher pieces together as a team. We offer volume pricing for groups of 5+ runners.",
      },
    ],
    relatedSlugs: ["sports-memorabilia-framing", "military-shadow-boxes", "corporate-art-programs"],
    schemaCategory: "Marathon and race bib custom framing",
  },

  // ------------------------------------------------------------------
  // 7. PROCLAMATIONS, CITATIONS & RECOGNITION PLAQUES
  // ------------------------------------------------------------------
  {
    slug: "proclamation-and-plaque-framing",
    metaTitle: "Proclamation & Plaque Framing in Boston | Citations, Awards",
    metaDescription:
      "Custom framing for City of Boston proclamations, retirement plaques, recognition awards, and citations. Boston Police, Whittier Health & corporate honorees since 1981.",
    keywords: [
      "proclamation framing Boston",
      "city of boston proclamation framing",
      "mayoral proclamation framing",
      "mayor of boston citation framing",
      "city council proclamation framing",
      "citation framing boston",
      "retirement plaque framing Boston",
      "corporate plaque framing Boston",
      "recognition award framing Boston",
      "honorary plaque framing",
      "award certificate framing",
      "engraved plaque framing",
      "wood plaque framing",
      "Massachusetts State House citation framing",
      "senate citation framing Massachusetts",
      "governor proclamation framing",
      "Boston Police plaque framing",
      "BPD recognition plaque framing",
      "hospital donor recognition framing",
      "hall of fame plaque framing",
      "lifetime achievement award framing",
    ],
    heroEyebrow: "Boston's Proclamation & Plaque Framer",
    heroTitle: "Proclamations,",
    heroTitleAccent: "Citations & Plaques",
    heroDescription:
      "City of Boston proclamations, BPD recognition plaques, hospital honoree awards, and retirement citations — framed and mounted to look as significant as the recognition itself. Hand-built in West Roxbury since 1981.",
    heroImage: "/framed-art/jaylen-brown-proclamation.jpg",
    intro: [
      "A proclamation, citation, or recognition plaque marks something that doesn't happen twice. The City of Boston only declares so many days. A 30-year career only ends once. The frame around the document needs to match the weight of the moment — not look like a generic certificate frame from a big-box store.",
      "We frame proclamations, citations, plaques, and recognition awards for City Hall constituents, BPD command staff, area hospitals, and corporate honorees. Conservation glass, acid-free mounting, and the formal mahogany-and-gold palette that suits the document.",
    ],
    whatWeFrame: [
      "City of Boston proclamations and mayoral citations",
      "Boston City Council resolutions",
      "Massachusetts State House citations and proclamations",
      "Senate and Congressional recognitions",
      "Boston Police, BFD, EMS, and State Police recognition plaques",
      "Hospital donor wall plaques and Beacon of Hope-style honoree awards",
      "Corporate recognition awards (Person of the Year, Beacon of Hope, etc.)",
      "Retirement plaques with engraved brass plates on solid wood",
      "Honorary degrees and distinguished-service citations",
      "Eagle Scout and youth recognition certificates",
      "Hall of Fame plaques and induction certificates",
      "Lifetime Achievement and humanitarian award framings",
    ],
    process: [
      {
        title: "Bring the document or plaque in",
        body: "For paper proclamations, bring the original. For mounted plaques that arrived in inadequate frames, bring the plaque itself — we'll re-mount or re-frame it so the recognition reads with the weight it deserves.",
      },
      {
        title: "Single, paired, or shadow box",
        body: "Many City of Boston proclamations are issued as a pair (the mayoral proclamation + the council resolution). We can frame them side-by-side in one wide frame, as a matched pair, or with an inset shadow box for any included medallion or seal.",
      },
      {
        title: "Match the formality",
        body: "Most recognitions get traditional mahogany or walnut moulding with a subtle gold liner — formal, dignified, timeless. We carry the standard institutional palettes (Boston city seal gold, BPD blue, Massachusetts navy) and can match what the issuing body used.",
      },
      {
        title: "Engraved nameplate",
        body: "Most plaques benefit from an engraved brass nameplate at the bottom — recipient name, date, one line of context. We engrave in-house, no third-party turnaround.",
      },
      {
        title: "Conservation mounting",
        body: "Acid-free backing, conservation glass, sealed dust covers. The proclamation looks the same in 30 years as the day it was issued — gold seal intact, ribbons unfaded, paper bright.",
      },
    ],
    features: [
      "Conservation glass — protects official seals, gold leaf, and ribbons from fading",
      "Acid-free, reversible mounting — the document is never trimmed or glued",
      "Standard institutional moulding palette (mahogany, walnut, black-and-gold)",
      "In-house brass engraving for nameplates — no third-party delays",
      "Side-by-side / paired layouts for two-document proclamations",
      "Re-mounting service for plaques delivered in inadequate frames",
      "Bulk pricing for elected offices that frame constituent recognitions regularly",
      "Shadow-box variants for plaques with embossed seals or medallions",
    ],
    localContext:
      "The Boston civic ecosystem produces a steady stream of proclamations and recognition plaques — the Mayor's office, Boston City Council, the State House on Beacon Hill, BPD and BFD command staff, area hospitals, and the AmLaw firms downtown all issue formal recognitions every week. We've framed pieces from across that ecosystem for over 40 years — including a recent City of Boston proclamation declaring 'Jaylen Brown Day,' Boston Police recognition plaques and Special Citations, and the Whittier Street Health Center 'Beacon of Hope' annual honoree awards (Whittier has been a client of ours for over 25 years). If a constituent or honoree brings in a proclamation, we know how to frame it so it hangs proudly in an office or den for the next 30 years.",
    gallery: [
      "/framed-art/whittier-plaque.jpg",
      "/framed-art/superintendent-plaque.jpg",
    ],
    faqs: [
      {
        q: "How much does proclamation framing cost?",
        a: "Every proclamation frame is custom — pricing depends on size, the moulding you choose, glass type, and whether you want an engraved nameplate. Bring the document in and we'll design the frame and work out the pricing together. Walk-ins are always welcome.",
      },
      {
        q: "I received a paired proclamation (City of Boston + Council resolution) — can you frame them together?",
        a: "Yes — that's actually a common request. We frame the two documents side-by-side in a single wide mat so they read together as one piece. A paired layout looks more deliberate than two separate frames hung next to each other.",
      },
      {
        q: "Can you re-frame a plaque I received in a cheap presentation?",
        a: "Yes. Many recognitions arrive in low-grade plastic frames or generic plaque holders. We'll re-mount the document or plate into proper conservation framing so the recognition holds up over decades.",
      },
      {
        q: "Will conservation glass protect the gold-foil seal and ribbons?",
        a: "Yes. UV-protective conservation glass blocks 97%+ of fading rays — the gold foil, embossed seals, and ribbons stay vibrant. For especially valuable pieces we'd recommend museum glass for the anti-reflective coating as well.",
      },
      {
        q: "Do you do engraved brass nameplates in-house?",
        a: "Yes — we engrave in-house, so there's no third-party turnaround. Most plaques include the recipient's name, date, and one line of context. We'll proof the layout with you before engraving.",
      },
      {
        q: "Can you frame a proclamation as a surprise retirement gift before the ceremony?",
        a: "Absolutely. Tell us the ceremony date and we'll work backward. Rush turnaround is available — we've done plenty of these on tight retirement-party timelines.",
      },
      {
        q: "Do you offer volume pricing for elected offices?",
        a: "Yes. Offices that issue and frame proclamations regularly (city, state, congressional) get a tiered rate sheet. Email us with the typical volume and we'll work out the pricing.",
      },
    ],
    relatedSlugs: ["military-shadow-boxes", "corporate-art-programs", "diploma-framing"],
    schemaCategory: "Proclamation, citation, and recognition plaque custom framing",
  },

  // ------------------------------------------------------------------
  // 8. CONCERT POSTERS & MUSIC MEMORABILIA
  // ------------------------------------------------------------------
  {
    slug: "music-and-concert-poster-framing",
    metaTitle: "Concert Poster & Music Memorabilia Framing in Boston",
    metaDescription:
      "Custom framing for concert posters, signed albums, vinyl records, ticket stubs, gold records, and signed guitars. Trusted by the Verb Hotel and Boston music collectors since 1981.",
    keywords: [
      "concert poster framing Boston",
      "music memorabilia framing Boston",
      "vinyl record framing Boston",
      "album cover framing",
      "signed album framing",
      "gold record framing Boston",
      "ticket stub framing",
      "backstage pass framing",
      "guitar shadow box framing",
      "music poster framing Boston",
      "rock and roll memorabilia framing",
      "band poster framing",
      "vintage concert poster framing",
      "Boston Tea Party poster framing",
      "Fillmore poster framing",
      "music collector framing Boston",
      "signed guitar framing",
      "album release shadow box",
      "drumhead framing",
      "tour poster framing Boston",
    ],
    heroEyebrow: "Boston's Music Memorabilia Framer",
    heroTitle: "Concert Posters &",
    heroTitleAccent: "Music Memorabilia",
    heroDescription:
      "Concert posters, signed albums, vinyl records, ticket stubs, gold records, and signed guitars — built into shadow boxes and frames that do justice to the music. The Verb Hotel and Boston music collectors have been bringing pieces to our shop for decades.",
    heroImage: "/framed-art/music-poster-wall.jpg",
    intro: [
      "Music memorabilia is a particular category — the inks on a vintage Fillmore or Boston Tea Party poster fade faster than almost anything else, vinyl needs depth in the frame so the cover doesn't flex, and a signed album cover is only worth what the autograph survives. Off-the-shelf frames don't do this work any favors.",
      "We've been the framing partner for The Verb Hotel and Boston's music-collector community for many years. Conservation glass, acid-free mounting, and the right shadow-box depth for vinyl, cassette, and 45 layouts. The pieces hang in hotel lobbies, listening rooms, dens, and on the walls of fans who'd trade the rest of their collection before they'd part with these.",
    ],
    whatWeFrame: [
      "Vintage concert posters (Fillmore, Boston Tea Party, Avalon, Grande Ballroom)",
      "Modern festival, tour, and gig posters",
      "Signed album covers (LP, 45, 78)",
      "Vinyl record displays — single album with cover, multi-record discographies",
      "Cassette and CD memorabilia",
      "Gold and platinum record awards",
      "Signed guitars and instruments in custom shadow boxes",
      "Drumheads, drum sticks, signed guitar picks",
      "Concert ticket stubs, all-access laminates, and backstage passes",
      "Setlists, lyric sheets, and handwritten band ephemera",
      "Album-release shadow boxes (album + 45 + ticket + press clipping)",
      "Festival wristbands, lanyards, and credential displays",
    ],
    process: [
      {
        title: "Bring the piece in",
        body: "Rolled posters, signed records, ticket stubs, instruments — bring it all. We'll lay everything out together and figure out which pieces are the centerpiece and how to layer the rest around them.",
      },
      {
        title: "Flatten the poster first if needed",
        body: "Vintage posters often arrive rolled or creased. We can dry-flatten and stabilize the paper before framing — it adds a few days but saves the artwork. For severely brittle pieces we'll talk through paper conservation options.",
      },
      {
        title: "Shadow box vs. flat frame",
        body: "Vinyl, cassettes, gold records, and 3D items need shadow boxes with appropriate depth. Posters and signed flats can go in traditional moulding with conservation glass. Plenty of collectors want a hybrid — album + 45 + ticket + signed photo all in one wide layout.",
      },
      {
        title: "Conservation mounting",
        body: "Acid-free backing, hinged mounting (no tape on the autograph), UV-protective glass. Vintage poster inks were never built to last — UV protection isn't optional, it's the only reason the piece will look the same in 20 years.",
      },
      {
        title: "Build, seal, and deliver",
        body: "Hand-built in West Roxbury. Sealed dust-tight so there's no dust on the autograph or vinyl. Standard turnaround is 5–7 business days; longer for poster flattening or multi-piece installations.",
      },
    ],
    features: [
      "Conservation glass — vintage poster inks stay vibrant for decades",
      "Acid-free, hinged mounting — autographs and signatures stay safe",
      "Custom shadow box depths for vinyl, cassettes, gold records, instruments",
      "Dry-flattening service for rolled or creased vintage posters",
      "Sealed dust-tight construction — no dust on the autograph or vinyl",
      "Rock-and-roll-friendly mouldings — matte black, brushed metal, vintage wood",
      "Volume pricing for venues, hotels, music bars, and lounge installations",
      "Long-time framing partner of The Verb Hotel",
    ],
    localContext:
      "Boston is a music town — from the Boston Tea Party era through the Rat / WBCN / Newbury Comics decades to today. We've worked with The Verb Hotel for years — the rock-and-roll boutique hotel in the Fenway — framing the lobby and listening-room walls full of vintage Boston-rock posters, signed albums, and concert memorabilia. We also frame for individual collectors across the city: Velvet Underground LPs, Led Zeppelin album-history shadow boxes, signed Boston-club concert posters from the Rat, Channel, and Paradise era, and modern Fenway and TD Garden ticket-stub displays.",
    gallery: [
      "/framed-art/stairway-to-heaven.jpg",
    ],
    faqs: [
      {
        q: "How much does concert poster framing cost?",
        a: "Every poster frame is custom — pricing depends on size, the moulding, glass type (conservation vs. museum), and whether the poster needs flattening first. Bring it in and we'll work out the design and pricing together. Walk-ins are always welcome.",
      },
      {
        q: "Can you flatten a rolled poster before framing?",
        a: "Yes. Vintage posters that have been rolled in a tube for years can be dry-flattened and stabilized before they're mounted. It adds a few days to the timeline but it's the right way to handle brittle paper. For severely fragile pieces we'll talk through paper-conservation options before mounting.",
      },
      {
        q: "Will conservation glass really protect an old poster from fading?",
        a: "Yes — UV-filtering conservation glass blocks 97%+ of fading rays. Vintage poster inks (especially day-glo and screen-printed pigments from the '60s and '70s) are exceptionally fade-prone, so for any piece you care about, conservation or museum glass is non-negotiable.",
      },
      {
        q: "Can you frame vinyl with the album cover together in one piece?",
        a: "Yes — that's the most popular layout. We do single-record-with-cover shadow boxes, multi-record discography displays, and album-release shadow boxes that combine the LP, 45, ticket, and press clipping in one wide piece.",
      },
      {
        q: "Do you do shadow boxes for signed guitars or drumheads?",
        a: "Absolutely. Signed guitars get custom-depth shadow boxes with internal mounting that doesn't pierce the body or strap. Drumheads, signed sticks, and picks frame beautifully on their own or paired with a poster, photo, or setlist.",
      },
      {
        q: "Will mounting damage the signature on a signed album cover?",
        a: "No. We use hinged, reversible mounting with no tape across the signature. The cover is held by acid-free hinges along the top edge — the autograph is never touched and the cover can be removed at any point with no alteration.",
      },
      {
        q: "Do you do bulk pricing for music venues, hotels, or lounges?",
        a: "Yes. The Verb Hotel and other Boston venues use us for full-property installations and ongoing additions — volume pricing, matched mouldings, and on-site delivery / hanging. Email us with the project scope and we'll work out a rate sheet.",
      },
    ],
    relatedSlugs: ["sports-memorabilia-framing", "corporate-art-programs", "canvas-stretching"],
    schemaCategory: "Concert poster and music memorabilia custom framing",
  },

  // ------------------------------------------------------------------
  // 9. FINE ART & OIL PAINTING FRAMING
  // ------------------------------------------------------------------
  {
    slug: "fine-art-and-oil-painting-framing",
    metaTitle: "Fine Art & Oil Painting Framing in Boston | Gallery Frames",
    metaDescription:
      "Custom framing for original oil paintings, fine art, antique works, and gallery pieces. Gold-leaf mouldings, conservation glass, linen liners. West Roxbury since 1981.",
    keywords: [
      "fine art framing Boston",
      "oil painting framing Boston",
      "gallery framing Boston",
      "antique oil painting framing",
      "conservation framing Boston",
      "museum framing Boston",
      "collector framing Boston",
      "gold leaf moulding framing",
      "ornate gold frame Boston",
      "vintage painting framing",
      "estate painting framing",
      "inherited painting framing",
      "portrait painting framing Boston",
      "landscape oil painting framing",
      "period frame Boston",
      "closed corner frame Boston",
      "linen liner frame",
      "museum quality framing Boston",
      "contemporary art framing Boston",
      "plein air painting framing",
    ],
    heroEyebrow: "Conservation Framing for Fine Art",
    heroTitle: "Fine Art & Oil",
    heroTitleAccent: "Painting Framing",
    heroDescription:
      "Original oil paintings, antique works, gallery pieces, and inherited fine art — framed with gilded mouldings, conservation glass, and the attention these pieces have always deserved. Built by hand in West Roxbury since 1981.",
    heroImage: "/framed-art/ballerina-painting.jpg",
    intro: [
      "An original oil painting deserves more than a moulding off a wall rack. The right gold-leaf or hand-finished frame transforms a painting — gives it the gravity it had on the wall of the gallery you bought it from, or the presence your grandmother's painting deserved when it was first hung in the family home a hundred years ago.",
      "We frame fine art for collectors, gallery clients, designers, and estate inheritors across Greater Boston. Hand-finished gilded mouldings, period frames for antique works, conservation glass for valuable pieces, and acid-free linen liners that complete the gallery look.",
    ],
    whatWeFrame: [
      "Original oil paintings — contemporary, mid-century, traditional, plein-air",
      "Antique paintings inherited from estates or bought at estate sales",
      "Gallery purchases from Boston, Cape Cod, Newport, and travel",
      "Acrylic and mixed-media works",
      "Fine art prints, etchings, lithographs, and serigraphs",
      "Watercolors and pastels (acid-free conservation framing)",
      "Commissioned and antique family portraits",
      "Closed-corner gold-leaf gallery frames",
      "Linen liners and fillets between frame and painting",
      "Vintage paintings needing fresh framing or moulding restoration",
      "Plein-air paintings bought on vacation or from working artists",
      "Children's portraits and family-commission paintings",
    ],
    process: [
      {
        title: "Bring the painting in",
        body: "We'll look at the piece in person — size, surface (varnished, matte, textured), condition, and the room it'll hang in. Lighting and surroundings matter for the moulding decision.",
      },
      {
        title: "Choose the moulding",
        body: "Most fine art deserves gold-leaf, hand-finished, or closed-corner moulding. We carry traditional gilded period mouldings, contemporary minimal floats, and everything between. We'll pull samples and let you see them next to the painting before deciding.",
      },
      {
        title: "Liner or no liner",
        body: "A linen- or silk-covered liner inside the frame separates the painting from the moulding visually — common on traditional oils and a meaningful upgrade. We'll show you the difference with and without.",
      },
      {
        title: "Conservation considerations",
        body: "Valuable paintings benefit from conservation glass or acrylic to protect from UV and dust. Some collectors prefer no glazing for the painterly texture — we'll talk through the tradeoffs based on the piece, the value, and where it will hang.",
      },
      {
        title: "Build, fit, and deliver",
        body: "Frames are hand-built in our West Roxbury shop. For larger or oversize works we offer local delivery and professional hanging — drywall, plaster, brick, the right hardware for the wall.",
      },
    ],
    features: [
      "Hand-finished gilded and gold-leaf mouldings — period and contemporary",
      "Closed-corner frames for gallery-quality finish",
      "Linen and silk liners in dozens of colors",
      "Conservation glass and acrylic for valuable works",
      "Period mouldings for antique paintings (Louis XIV, Spanish, Florentine, Dutch)",
      "Reversible mounting — paintings are never glued or forced into the frame",
      "Local delivery and professional hanging for oversize works",
      "Designer and gallery wholesale rates",
    ],
    localContext:
      "Boston has a serious fine-art community — galleries from the SoWa district to the South End and Newbury Street, designers across the suburbs, and collectors with paintings inherited from generations of New England families. We've worked with collectors, designers, and gallery clients across Greater Boston for over 40 years. Plenty of customers also bring us paintings inherited from estates, purchased on vacation in Provincetown, Newport, Italy, or the Caribbean, or commissioned from local portrait artists. Bring it in and we'll work out the right moulding to give the painting the presence it should have.",
    gallery: [
      "/framed-art/horse-painting.jpg",
      "/framed-art/worker-painting.jpg",
    ],
    faqs: [
      {
        q: "How much does a fine art frame cost?",
        a: "Every fine art frame is custom — pricing depends on the size of the painting, the moulding (closed-corner gilded mouldings cost more than off-the-shelf wood), the liner, and the glazing. Bring the painting in and we'll pull samples and work out the design and pricing together. Quotes are always free.",
      },
      {
        q: "What's the difference between a closed-corner gallery frame and a regular frame?",
        a: "A closed-corner frame is built so the moulding is mitered and finished as a single continuous piece — there's no visible joint at the corners. It's the gallery and museum standard for fine art and adds significantly to the perceived value of the painting. We carry closed-corner mouldings in dozens of finishes.",
      },
      {
        q: "Do oil paintings need glass?",
        a: "It depends on the piece. Many traditional oils are framed without glass to preserve the painterly surface and visible brushwork. Valuable, fragile, or environmentally sensitive paintings benefit from museum-grade non-reflective acrylic. We'll talk through the tradeoffs for your specific painting.",
      },
      {
        q: "Can you build a period frame for an antique painting?",
        a: "Yes. We carry period mouldings (Louis XIV, Florentine, Spanish, Dutch) and can match the era of the painting. For especially significant pieces we can also source or restore an existing period frame.",
      },
      {
        q: "What's a linen liner and do I need one?",
        a: "A linen liner is a fabric-covered inner frame that sits between the painting and the moulding — usually 1–3 inches wide. It gives the painting space to 'breathe' visually and is a hallmark of traditional oil painting framing. Not every painting needs one, but for most traditional oils it's the right call.",
      },
      {
        q: "Can you re-frame a painting that came with a frame I don't like?",
        a: "Absolutely — common request. We'll remove the painting from the existing frame without damage, design a new frame that suits it, and return the old frame to you (or dispose of it if you'd prefer).",
      },
      {
        q: "Do you offer trade pricing for designers and galleries?",
        a: "Yes. Working designers, galleries, and stagers who use us regularly get wholesale trade pricing. Email us for the trade rate sheet.",
      },
    ],
    relatedSlugs: ["canvas-stretching", "corporate-art-programs", "proclamation-and-plaque-framing"],
    schemaCategory: "Fine art and oil painting custom framing",
  },

  // ------------------------------------------------------------------
  // 10. HEIRLOOM & CULTURAL KEEPSAKE FRAMING
  // ------------------------------------------------------------------
  {
    slug: "heirloom-and-cultural-keepsake-framing",
    metaTitle: "Heirloom & Cultural Keepsake Framing in Boston",
    metaDescription:
      "Custom shadow boxes for family heirlooms, cultural keepsakes, ceremonial items, and generational mementos. Conservation framing in West Roxbury since 1981.",
    keywords: [
      "heirloom framing Boston",
      "family heirloom shadow box",
      "cultural keepsake framing",
      "generational keepsake framing",
      "ceremonial item framing",
      "ethnic keepsake framing Boston",
      "chinese fan framing Boston",
      "japanese fan framing Boston",
      "chopstick display framing",
      "cultural artifact framing",
      "religious object framing Boston",
      "ketubah framing Boston",
      "baptism gown framing",
      "ceremonial textile framing",
      "sari framing Boston",
      "kimono framing Boston",
      "hanbok framing Boston",
      "vintage textile framing",
      "immigration document framing",
      "family bible framing",
    ],
    heroEyebrow: "For Pieces That Pass Through Generations",
    heroTitle: "Heirloom & Cultural",
    heroTitleAccent: "Keepsake Framing",
    heroDescription:
      "Family heirlooms, ceremonial items, cultural artifacts, and generational keepsakes — built into archival shadow boxes that protect the piece for decades and let it live on a wall instead of a closet shelf. Hand-built in West Roxbury since 1981.",
    heroImage: "/framed-art/chopstick-fan-shadowbox.jpg",
    intro: [
      "Some pieces don't fit any category but their own. A grandmother's silk fan from Shanghai, a hand-painted chopstick set from Kyoto, a ketubah from a wedding 60 years ago, a baptism gown passed down through four generations. They're not 'sports memorabilia' or any other off-the-shelf category — they're heirlooms, and they deserve framing built around their specific shape, weight, and significance.",
      "We build archival shadow boxes for family and cultural heirlooms with the same conservation methods we'd use on a museum piece — acid-free backing, UV-protective glass, reversible mounting, and a layout that respects the piece. The result is something that protects the heirloom, displays it beautifully, and can be passed down again to the next generation.",
    ],
    whatWeFrame: [
      "Asian fans — Chinese, Japanese, Korean — folding and rigid",
      "Decorative chopsticks, kanzashi, and ceremonial flatware sets",
      "Embroidered textiles and silk panels",
      "Sari, kimono, hanbok, and ceremonial garment displays",
      "Ketubahs, marriage contracts, and religious documents",
      "Baptism gowns and christening keepsakes",
      "First-haircut keepsake boxes (upsherin, mundan)",
      "Antique handkerchiefs, lace, and trousseau pieces",
      "Family bibles, prayer books, and inscribed documents",
      "Vintage maps, deeds, and immigration papers",
      "Generational toys, pins, jewelry, and inherited small objects",
      "Hand-painted folk art, icons, and devotional pieces",
    ],
    process: [
      {
        title: "Bring the piece in",
        body: "Heirloom framing starts with a conversation. Tell us what the piece is, who it came from, and how it's been stored. We'll examine the condition together and figure out the right approach before any work begins.",
      },
      {
        title: "Conservation assessment",
        body: "For fragile or aged pieces, we'll talk through whether straightforward shadow-box framing is appropriate or whether the piece needs paper / textile conservation work first. For especially valuable pieces we may refer you to a conservator before we frame.",
      },
      {
        title: "Layout design",
        body: "The piece itself dictates the layout. A folding fan opens into one specific shape. A textile needs to be supported flat or pleated as it naturally falls. We design the shadow box around how the piece wants to sit — never the other way around.",
      },
      {
        title: "Reversible, archival mounting",
        body: "Nothing is glued, stitched through, or pierced. Acid-free backing, hidden archival pins or sleeves where needed, and reversible methods so a future owner can re-frame the piece without damage decades from now.",
      },
      {
        title: "Conservation glass",
        body: "UV-protective glass is standard for heirlooms — silk fades fast, paper foxes, dyes shift. Museum glass with anti-reflective coating for the most valuable or visually busy pieces.",
      },
    ],
    features: [
      "Acid-free, reversible mounting — the heirloom is never glued or pierced",
      "UV-protective conservation glass — slows fading by decades",
      "Custom shadow-box depths for fans, textiles, ceremonial objects, garments",
      "Fabric-covered backing in colors that complement the piece",
      "Period and culturally appropriate moulding choices",
      "Archival sleeves and mounting for documents (immigration papers, ketubahs, bibles)",
      "Conservator referrals for pieces needing restoration before framing",
      "Documentation pocket on the back for provenance and family history",
    ],
    localContext:
      "Boston is generations old as a city, and Greater Boston has every cultural community you can name. We've framed heirlooms for families with roots in China, Japan, Korea, Vietnam, India, the Philippines, Ireland, Italy, the Caribbean, West Africa, Eastern Europe, and the Middle East — alongside multi-generational New England families with trousseau pieces and baptism gowns going back to the 1800s. There's no single template for an heirloom, which is why every one of these projects starts with a conversation about the piece itself.",
    gallery: [],
    faqs: [
      {
        q: "How much does an heirloom shadow box cost?",
        a: "Every heirloom is unique, so every frame is custom. Pricing depends on size, the depth of the shadow box, the moulding, the glass, and any conservation work the piece may need before mounting. Bring the piece in and we'll work out the design and pricing together. Walk-ins are always welcome.",
      },
      {
        q: "Will mounting damage my heirloom?",
        a: "No. We use reversible, archival methods — no glue, no stitching through the piece, no piercing. Textiles are supported on acid-free backing; documents are mounted with archival corners or sleeves. The piece can be removed at any future date with no damage.",
      },
      {
        q: "Can you frame textiles, fans, and three-dimensional pieces?",
        a: "Yes — that's the heart of this work. We custom-build shadow boxes at whatever depth is needed for the piece, from a thin folded fan to a full kimono or ceremonial garment. Fabric-covered backing in a color that complements the textile is included.",
      },
      {
        q: "Do you handle religious or ceremonial pieces (ketubahs, baptism gowns, etc.)?",
        a: "Yes. Ketubahs, baptism gowns, prayer cards, religious icons, and similar pieces are common heirloom requests. We frame them with the same conservation respect we'd give a museum piece — acid-free, reversible, UV-protected.",
      },
      {
        q: "The piece is fragile or aged — should I have it conserved first?",
        a: "Sometimes. We'll look at the piece with you. For straightforward heirlooms we can frame as-is with conservation methods that prevent further deterioration. For fragile, foxed, torn, or chemically deteriorating pieces we'll refer you to a paper or textile conservator before framing.",
      },
      {
        q: "Can you frame the heirloom alongside photographs or documents about its history?",
        a: "Absolutely. Pairing the piece with a family photo, the original immigration document, or a handwritten note about its provenance is a meaningful upgrade. We can also include a small documentation pocket on the back of the frame for family history that should travel with the piece.",
      },
      {
        q: "Will UV glass slow the fading on a silk fan or embroidered piece?",
        a: "Yes — significantly. Conservation glass blocks 97%+ of UV rays, which are responsible for most fabric and dye fading. For silk, embroidered pieces, and any dyed textile, conservation or museum glass is the right call.",
      },
    ],
    relatedSlugs: ["military-shadow-boxes", "diploma-framing", "fine-art-and-oil-painting-framing"],
    schemaCategory: "Heirloom and cultural keepsake custom framing",
  },
];

export function getServiceBySlug(slug: string): ServiceInfo | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getRelatedServices(slugs: string[]): ServiceInfo[] {
  return slugs
    .map((slug) => getServiceBySlug(slug))
    .filter((s): s is ServiceInfo => Boolean(s));
}
