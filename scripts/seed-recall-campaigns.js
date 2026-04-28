/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SEEDS = [
  {
    slug: "graduation-may",
    name: "Graduation diploma reminder (May)",
    description:
      "Past customers — nudge anyone who has bought from us before to bring in this year's diploma.",
    startMonth: 5,
    startDay: 1,
    endMonth: 5,
    endDay: 31,
    segmentRule: { hadOrder: true, excludeIfOrderedSinceDays: 60 },
    subject: "Diploma framing season — got one to bring in, {{firstName}}?",
    bodyHtml: `<p>Hi {{firstName}},</p>
<p>Graduation season is here. If anyone in the family is finishing this year — high school, college, grad school, even a professional certification — we'd love to frame the diploma for you.</p>
<p>We do recognized seal embossing, archival mounting, and Boston-area school mat colors (Harvard crimson, BC maroon &amp; gold, BU red, Northeastern red &amp; black, MIT cardinal, etc.).</p>
<p>Walk in any time, or call us at {{shopPhone}} and we can have it ready before the family party.</p>
<p>— The team at {{shopName}}<br><a href="{{shopUrl}}">{{shopUrl}}</a></p>`,
    bodyText: null,
    enabled: false,
  },
  {
    slug: "fathers-day-sports",
    name: "Father's Day sports memorabilia (early June)",
    description:
      "Boston sports fans buy a lot of jersey + signed-photo shadow boxes for Father's Day. Catch them 2 weeks out.",
    startMonth: 6,
    startDay: 1,
    endMonth: 6,
    endDay: 15,
    segmentRule: { hadOrder: true, excludeIfOrderedSinceDays: 60 },
    subject: "Father's Day idea — frame Dad's favorite Boston sports moment",
    bodyHtml: `<p>Hi {{firstName}},</p>
<p>Father's Day is around the corner. If there's a signed photo, ticket stub, championship-night front page, or jersey sitting in a closet — we can turn it into a Sox / Pats / Bruins / Celtics shadow box he'll actually display.</p>
<p>UV-protective glass and acid-free mounting standard. Most pieces turn around in about a week if you bring it in early.</p>
<p>Call us at {{shopPhone}} or stop by — we can sketch out a few options together.</p>
<p>— {{shopName}}<br><a href="{{shopUrl}}">{{shopUrl}}</a></p>`,
    bodyText: null,
    enabled: false,
  },
  {
    slug: "wedding-keepsakes-summer",
    name: "Wedding keepsakes (summer wedding season)",
    description:
      "June through September. For couples who got married — invitation, vow card, photo shadow boxes — and parents/bridal party gifts.",
    startMonth: 6,
    startDay: 1,
    endMonth: 9,
    endDay: 30,
    segmentRule: { hadOrder: true, excludeIfOrderedSinceDays: 60 },
    subject: "Wedding keepsake framing — turn the day into something on the wall",
    bodyHtml: `<p>Hi {{firstName}},</p>
<p>Wedding season is in full swing. We frame a lot of wedding shadow boxes this time of year — invitation, ceremony photo, vow card, dried flowers, sometimes a piece of the dress lace. Bridesmaid and parent companion frames are popular for the gifts.</p>
<p>Soft palettes (whites, blush, navy, gold) are what we usually pair with. We can match the wedding's color story.</p>
<p>Easiest is to bring in everything you have and we'll lay it out on the table together. {{shopPhone}}.</p>
<p>— {{shopName}}<br><a href="{{shopUrl}}">{{shopUrl}}</a></p>`,
    bodyText: null,
    enabled: false,
  },
  {
    slug: "holiday-shadow-boxes",
    name: "Holiday shadow boxes (Nov–Dec)",
    description:
      "Memorial / heirloom / collection shadow boxes for the holidays. Highest-margin work, emotional purchase, often gifted.",
    startMonth: 11,
    startDay: 15,
    endMonth: 12,
    endDay: 20,
    segmentRule: { hadOrder: true, excludeIfOrderedSinceDays: 60 },
    subject: "Holiday gift idea — a custom shadow box from {{shopName}}",
    bodyHtml: `<p>Hi {{firstName}},</p>
<p>If there's a meaningful collection or keepsake you've been meaning to do something with — a grandfather's medals, a parent's old uniform, a family heirloom, a kid's first-year photos and footprints — a custom shadow box makes a gift no one expects and no one forgets.</p>
<p>We can usually finish a shadow box in 7–10 days, so there's still time before the holidays if you come in soon.</p>
<p>Stop by or call {{shopPhone}}.</p>
<p>— {{shopName}}<br><a href="{{shopUrl}}">{{shopUrl}}</a></p>`,
    bodyText: null,
    enabled: false,
  },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const s of SEEDS) {
    const existing = await prisma.recallCampaign.findUnique({
      where: { slug: s.slug },
    });
    if (existing) {
      skipped++;
      console.log(`skip (already exists): ${s.slug}`);
      continue;
    }
    await prisma.recallCampaign.create({ data: s });
    created++;
    console.log(`created: ${s.slug}`);
  }
  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
