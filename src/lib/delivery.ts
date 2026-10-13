/**
 * Pickup & delivery offer — single source of truth for the public site.
 * Every page that mentions the service reads from here, so the radius and
 * wording cannot drift. The fee is deliberately unstated.
 */

const RADIUS_MILES = 10;
const PHONE = "(617) 327-3890";
const COVERED_AREAS =
  "West Roxbury, Roslindale, Jamaica Plain, Hyde Park, and most of Boston, plus Brookline, Newton, Needham, and Dedham";

export const DELIVERY = {
  radiusMiles: RADIUS_MILES,
  /** Statute miles to meters, for schema.org GeoCircle.geoRadius. */
  radiusMeters: Math.round(RADIUS_MILES * 1609.344),
  title: "Pickup & Delivery",
  /** One-liner for compact placements (home "Visit Us", contact, area pages). */
  short: `Can't make it in? We pick up artwork and deliver finished pieces within ${RADIUS_MILES} miles of the shop for an additional fee. Call ${PHONE} to schedule.`,
  /** Terse version for service-page process steps. */
  step: `Pickup and delivery available within ${RADIUS_MILES} miles of the shop for an additional fee.`,
  /** Footer logistics line, shown on every public page. */
  footer: `Pickup & delivery within ${RADIUS_MILES} miles for an additional fee.`,
  /** Appended to the "ready for pickup" status on the order tracker. */
  readyNote: `Prefer delivery? We deliver within ${RADIUS_MILES} miles for an additional fee. Call ${PHONE} to arrange it.`,
  /** Full card copy for the services page. */
  long: `Can't get to the shop, or have a piece that's too big for the car? We offer pickup of your artwork and delivery of the finished, ready-to-hang piece anywhere within a ${RADIUS_MILES}-mile radius of West Roxbury for an additional fee. Covers ${COVERED_AREAS}. Call ${PHONE} to schedule, or mention it when you place your order.`,
  faq: {
    q: "Do you offer pickup or delivery?",
    a: `Yes — we pick up and deliver within a ${RADIUS_MILES}-mile radius of our West Roxbury shop for an additional fee. That covers ${COVERED_AREAS}. Call ${PHONE} to schedule a pickup or delivery, or ask when you place your order.`,
  },
} as const;
