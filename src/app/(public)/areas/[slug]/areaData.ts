export interface AreaInfo {
  slug: string;
  name: string;
  demonym: string; // e.g. "Roslindale" resident
  distance: string; // from shop
  description: string; // intro paragraph
  why: string; // why customers come from there
  directions: string; // driving directions snippet
  nearbyLandmarks: string; // nearby reference points
}

export const SERVICE_AREAS: AreaInfo[] = [
  {
    slug: "west-roxbury",
    name: "West Roxbury",
    demonym: "West Roxbury",
    distance: "right here in the neighborhood",
    description:
      "West Roxbury Framing is located at 1741 Centre Street in the heart of West Roxbury, MA. As the neighborhood's trusted custom framing shop since 1981, we're just steps away from the restaurants and shops on Centre Street. Whether you need a sports jersey shadow boxed, a diploma framed for the wall, or an antique photograph restored — we handle it all in-house.",
    why: "As your local neighborhood framing shop, we know West Roxbury. Many of our customers walk in on their way to Roche Bros, the library, or Holy Name Parish. We're proud to be part of this community and honored to have received the 2024 Boston Legacy Business Award.",
    directions:
      "We're on Centre Street between Belgrade Avenue and Park Street. Free street parking is available directly in front of the shop, with additional parking in the municipal lot behind the building.",
    nearbyLandmarks: "Near Roche Bros, West Roxbury Branch Library, and Holy Name Parish",
  },
  {
    slug: "roslindale",
    name: "Roslindale",
    demonym: "Roslindale",
    distance: "just a 5-minute drive",
    description:
      "Looking for custom picture framing near Roslindale? West Roxbury Framing is located just minutes from Roslindale Village on Centre Street in West Roxbury. We've been serving Roslindale residents with custom framing, shadow boxes, photo restoration, and conservation framing for over 40 years.",
    why: "Roslindale customers love our combination of quality craftsmanship and fair pricing. Many customers come to us after visiting Roslindale Village and discover we're just a short drive up Centre Street. We frame everything from artwork bought at local art shows to family heirlooms passed down through generations.",
    directions:
      "From Roslindale Village, take Centre Street southwest — we're about 1.5 miles down on the right at 1741 Centre Street. The drive takes about 5 minutes with free parking at the shop.",
    nearbyLandmarks: "5 minutes from Roslindale Village, Adams Park, and Roslindale Square",
  },
  {
    slug: "jamaica-plain",
    name: "Jamaica Plain",
    demonym: "Jamaica Plain",
    distance: "about a 10-minute drive",
    description:
      "Jamaica Plain residents trust West Roxbury Framing for custom picture framing, shadow boxes, and photo restoration. Our shop at 1741 Centre Street in West Roxbury is a quick drive from JP and offers the same personalized, expert framing service we've provided to the Boston area since 1981.",
    why: "JP is known for its vibrant arts community, and many local artists and collectors come to us for museum-quality framing at accessible prices. Whether you picked up a piece at a First Thursday gallery walk or need a family photo beautifully framed, we'll make it look perfect.",
    directions:
      "From Jamaica Plain, take Centre Street south through Roslindale — we're at 1741 Centre Street. About 10 minutes by car with free parking available.",
    nearbyLandmarks: "10 minutes from Jamaica Pond, Centre Street JP, and the Arnold Arboretum",
  },
  {
    slug: "brookline",
    name: "Brookline",
    demonym: "Brookline",
    distance: "about a 15-minute drive",
    description:
      "Brookline residents looking for high-quality custom picture framing choose West Roxbury Framing. Located at 1741 Centre Street in West Roxbury, we're an easy drive from Brookline and offer expert custom framing, matting, glazing, shadow boxes, and photo restoration — all at fair prices with fast turnaround.",
    why: "Brookline customers appreciate our attention to detail and museum-quality conservation framing options. Whether you need a valuable piece framed with UV-protective glass or a collection of family photos arranged in matching frames, our 40+ years of experience shows in every piece we build.",
    directions:
      "From Brookline Village or Coolidge Corner, take Route 9 West to Centre Street. We're at 1741 Centre Street in West Roxbury — about 15 minutes with free parking.",
    nearbyLandmarks: "15 minutes from Coolidge Corner, Brookline Village, and Washington Square",
  },
  {
    slug: "dedham",
    name: "Dedham",
    demonym: "Dedham",
    distance: "about a 10-minute drive",
    description:
      "Dedham residents have been coming to West Roxbury Framing for custom picture framing since 1981. Our shop at 1741 Centre Street in West Roxbury is just a short drive from Dedham Square and Legacy Place, and we offer expert custom framing, shadow boxes, canvas stretching, and restoration.",
    why: "Many Dedham families come to us for multi-generational framing — grandparents who first visited our shop in the 1980s now bring their grandchildren's diplomas and artwork. That kind of trust is something we don't take for granted.",
    directions:
      "From Dedham, take VFW Parkway or Washington Street to Centre Street in West Roxbury. We're at 1741 Centre Street — about 10 minutes with free parking.",
    nearbyLandmarks: "10 minutes from Dedham Square, Legacy Place, and Endicott Estate",
  },
  {
    slug: "needham",
    name: "Needham",
    demonym: "Needham",
    distance: "about a 15-minute drive",
    description:
      "Needham homeowners looking for custom picture framing trust West Roxbury Framing. Located at 1741 Centre Street in West Roxbury, MA, we're easily accessible from Needham via Route 135 or VFW Parkway and offer full-service custom framing, conservation framing, shadow boxes, and restoration.",
    why: "Needham customers often come to us for home décor framing — matching frames for a gallery wall, oversized art for a new build, or framing a collection of family photos. We take the time to help you design the perfect presentation for your space.",
    directions:
      "From Needham center, take Highland Avenue to Great Plain Avenue, then VFW Parkway to Centre Street. We're at 1741 Centre Street — about 15 minutes with free parking.",
    nearbyLandmarks: "15 minutes from Needham Center, Ridge Hill Reservation, and Charles River",
  },
  {
    slug: "newton",
    name: "Newton",
    demonym: "Newton",
    distance: "about a 15-minute drive",
    description:
      "Newton residents choose West Roxbury Framing for expert custom picture framing, shadow boxes, and photo restoration. Our shop at 1741 Centre Street in West Roxbury is a short drive from Newton Centre, Newtonville, and West Newton, and we've been serving the Greater Boston area since 1981.",
    why: "Newton customers value quality and craftsmanship, and that's exactly what we deliver. From conservation framing for valuable artwork to custom shadow boxes for sports memorabilia, our team has over 40 years of experience getting every detail right.",
    directions:
      "From Newton, take Route 9 East or Centre Street south. We're at 1741 Centre Street in West Roxbury — about 15 minutes with free parking available.",
    nearbyLandmarks: "15 minutes from Newton Centre, Newtonville, and Crystal Lake",
  },
  {
    slug: "hyde-park",
    name: "Hyde Park",
    demonym: "Hyde Park",
    distance: "about a 10-minute drive",
    description:
      "Hyde Park residents trust West Roxbury Framing for custom picture framing, matting, shadow boxes, and photo restoration. Located at 1741 Centre Street in West Roxbury, we're just a quick drive from Hyde Park and have been serving the neighborhood for over 40 years.",
    why: "Hyde Park customers appreciate our honest pricing and fast turnaround. Whether you have a family photograph that needs restoration or a military flag that deserves a proper shadow box, we handle every project with care and attention to detail.",
    directions:
      "From Hyde Park, take Washington Street north to Centre Street. We're at 1741 Centre Street in West Roxbury — about 10 minutes with free parking.",
    nearbyLandmarks: "10 minutes from Cleary Square, Stony Brook Reservation, and Hyde Park Ave",
  },
];

export function getAreaBySlug(slug: string): AreaInfo | undefined {
  return SERVICE_AREAS.find((a) => a.slug === slug);
}
