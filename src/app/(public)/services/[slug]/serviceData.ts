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
  // 6. WEDDING KEEPSAKES
  // ------------------------------------------------------------------
  {
    slug: "wedding-keepsakes",
    metaTitle: "Wedding Keepsake Framing in Boston | Invitations, Photos, Vows",
    metaDescription:
      "Custom shadow boxes for wedding invitations, ceremony photos, vows, programs, and pre-preserved bouquets. Boston-area framer since 1981. Conservation materials, archival mounting. Walk-ins welcome.",
    keywords: [
      "wedding shadow box framing Boston",
      "wedding invitation framing",
      "wedding keepsake framing",
      "ceremony photo framing Boston",
      "first dance photo framing",
      "wedding vow framing",
      "wedding program framing",
      "anniversary frame Boston",
      "wedding memorabilia framing",
      "wedding gift framing Boston",
      "framing for preserved bouquet",
    ],
    heroEyebrow: "Preserving the Day You'll Always Remember",
    heroTitle: "Wedding",
    heroTitleAccent: "Keepsakes",
    heroDescription:
      "Wedding invitations, ceremony photos, vows, programs — and a pre-pressed bouquet if you've had one preserved — built into one custom shadow box that lives on a wall in your home.",
    heroImage: "",
    intro: [
      "A wedding produces an extraordinary amount of small, beautiful things — the invitation, the program, the ring tag, the first-dance photo, your vows on the index card you actually read from. Most of those end up in a shoebox in a closet within a year.",
      "We turn those pieces into a single, beautifully designed shadow box that lives on a wall in your home. Invitations are mounted on acid-free backing, photos sit behind UV-protected glass, and a pre-preserved bouquet (if you've had one done) can be the centerpiece.",
    ],
    whatWeFrame: [
      "Wedding invitations, programs, and save-the-dates",
      "Pre-preserved bouquets (you arrange preservation, we frame around it)",
      "First-dance and ceremony photos",
      "Vow cards and handwritten readings",
      "Ring bearer pillows and ribbon details",
      "Champagne cork from the toast",
      "Marriage license (decorative copy — keep the original safe)",
      "Anniversary upgrades — add new photos or items years later",
      "Bridesmaid and groomsmen gifts (custom-framed photos as gifts)",
      "Engagement and proposal mementos",
    ],
    process: [
      {
        title: "Plan ahead if you can",
        body: "If your wedding hasn't happened yet, come in beforehand. We'll talk through what to save and how to think about the layout — invitation, photos, vows, programs — so you know what to set aside on the day.",
      },
      {
        title: "Pre-preserve the bouquet (if you want one in the frame)",
        body: "If you'd like the bouquet in the shadow box, you'll need to have it pressed or freeze-dried by a preservation specialist first — most need it within a few days of the wedding. Once it's been preserved (typically takes several weeks at the specialist), bring it in and we'll build the shadow box around it.",
      },
      {
        title: "Lay out the keepsakes",
        body: "Bring everything you'd like included. We arrange the photo, invitation, vows, and small items into a balanced layout that tells the story of the day.",
      },
      {
        title: "Custom shadow box",
        body: "Most wedding shadow boxes are 16×20 to 24×30. We pick moulding and mat colors that match your wedding palette — soft whites, blush, navy, gold, whatever fits.",
      },
      {
        title: "Anniversary upgrades",
        body: "Many couples come back at their 10th or 25th anniversary to add new photos, kids' baby pictures, or trip mementos to the original shadow box. We can rebuild around the original.",
      },
    ],
    features: [
      "Acid-free, archival mounting — invitations and photos stay perfect",
      "UV-protective glass prevents fading of photos and printed pieces",
      "Custom moulding and mat colors matched to your wedding palette",
      "Engraved nameplates with date and names available",
      "Smaller companion frames as bridesmaid / parent gifts",
      "Pre-preserved bouquets framed as the centerpiece",
      "Anniversary upgrade service — add to the frame later",
    ],
    localContext:
      "Boston wedding season runs hard from May through October — local ceremonies, Cape Cod, the Berkshires, Newport. We see a steady stream of wedding keepsake projects every year, often referred by photographers. If you're getting married locally, stop in beforehand and we'll talk through what to save and how to think about the final shadow box.",
    gallery: [],
    faqs: [
      {
        q: "How much does a wedding shadow box cost?",
        a: "Every wedding keepsake shadow box is custom — pricing depends on size, the number of items included, the moulding, and the design. Stop in with what you'd like included and we'll design the piece and work out the pricing together. Walk-ins are always welcome.",
      },
      {
        q: "Do you preserve the bouquet?",
        a: "No — bouquet preservation (pressing or freeze-drying) is its own specialty handled by dedicated preservation companies. If you want the bouquet in your shadow box, you'll need to arrange the preservation separately. Once it's preserved, bring it to us and we'll build the shadow box around it.",
      },
      {
        q: "When does the bouquet need to be preserved?",
        a: "Most preservation specialists need the bouquet within a few days of the wedding. Search 'wedding bouquet preservation' for companies in your area. If you're not sure you want the bouquet in the frame, the invitation, photos, vows, and programs make a beautiful shadow box on their own.",
      },
      {
        q: "Can I add to the frame later?",
        a: "Yes. Many couples come back at their 5th, 10th, or 25th anniversary to add new photos, the kids' first photos, or trip souvenirs. We rebuild the original frame and add the new items.",
      },
      {
        q: "Can you do smaller companion frames as gifts?",
        a: "Yes. Bridesmaid, groomsmen, or parent gift frames using ceremony photos make excellent thank-you gifts. We do these as a coordinated set.",
      },
      {
        q: "Will you frame the marriage license?",
        a: "We frame decorative copies of the marriage license. Always keep the original in a safe place at home — it's a legal document.",
      },
      {
        q: "How long does it take?",
        a: "Most wedding shadow boxes are ready in 7–10 business days once we have all the keepsakes in hand. If you're including a preserved bouquet, factor in the preservation step (handled separately) before that clock starts.",
      },
    ],
    relatedSlugs: ["canvas-stretching", "sports-memorabilia-framing", "diploma-framing"],
    schemaCategory: "Wedding keepsake custom framing",
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
