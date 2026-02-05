export default function Page() {
  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Contact Us</h1>
        <p className="max-w-3xl mx-auto text-neutral-700">
          Thanks for your interest in West Roxbury Framing. We take your inquiries seriously. Please
          contact us via the email below or call / stop by our convenient West Roxbury location to learn
          more about what we can do to help you.
        </p>
      </header>

      <section className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] items-start">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Contact Info</h2>
            <div className="space-y-1 text-sm text-neutral-800">
              <p>
                <a
                  href="mailto:info@westroxburyframing.com"
                  className="text-blue-600 hover:underline"
                >
                  info@westroxburyframing.com
                </a>
              </p>
              <p>
                <a href="tel:16173273890" className="text-blue-600 hover:underline">
                  617-327-3890
                </a>
              </p>
              <p className="mt-2 font-medium">West Roxbury Framing</p>
              <p>1741 Centre Street</p>
              <p>West Roxbury, MA 02132</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-neutral-800">
            <h3 className="font-semibold">Hours:</h3>
            <p>Monday: 9:30 AM - 6 PM</p>
            <p>Tuesday: 9:30 AM - 6 PM</p>
            <p>Wednesday: 9:30 AM - 6 PM</p>
            <p>Thursday: 9:30 AM - 6 PM</p>
            <p>Friday: 9:30 AM - 6 PM</p>
            <p>Saturday: Closed</p>
            <p>Sunday: 10:30 AM - 4:30 PM</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-900">Find us online</h3>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.facebook.com/WestRoxburyFraming/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
              >
                Facebook
              </a>
              <a
                href="https://www.yelp.com/biz/west-roxbury-framing-west-roxbury"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
              >
                Yelp
              </a>
              <a
                href="https://www.instagram.com/westroxburyframing/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <iframe
            title="West Roxbury Framing on Google Maps"
            src="https://www.google.com/maps?ll=42.287442,-71.150185&z=10&t=m&hl=en-US&gl=US&mapclient=embed&cid=5529732401007790238"
            className="w-full h-[320px] md:h-[420px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
}
