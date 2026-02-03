import GalleryGrid from "@/components/GalleryGrid";

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Custom Picture Framing in West Roxbury, MA
          </h1>
          <p className="text-lg text-neutral-600">
            Museum-quality framing for art, photos, diplomas, memorabilia, and objects — designed with you in-store.
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="rounded-xl bg-black px-5 py-3 text-white" href="/book">Book a consultation</a>
            <a className="rounded-xl border border-neutral-300 px-5 py-3" href="/contact">Call / Directions</a>
          </div>
          <p className="text-sm text-neutral-500">Walk-ins welcome • Fast turnaround • Full-service design</p>
        </div>

        <div className="aspect-[4/3] w-full rounded-2xl bg-neutral-100" />
      </section>

      <section className="grid gap-6 md:grid-cols-4">
        {["Art & Prints", "Photos", "Diplomas", "Objects & Jerseys"].map((t) => (
          <div key={t} className="rounded-2xl border border-neutral-200 p-5">
            <div className="font-medium">{t}</div>
            <div className="text-sm text-neutral-600 mt-2">
              Bring it in — we’ll help you choose the perfect frame, mats, and glass.
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Work</h2>
        <GalleryGrid />
      </section>

      <section className="rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-xl font-semibold">Visit the shop</h2>
        <p className="text-neutral-600 mt-2">
          West Roxbury, MA • Hours and parking info on Contact page.
        </p>
        <div className="mt-4 flex gap-3">
          <a className="rounded-xl bg-black px-5 py-3 text-white" href="/contact">Get directions</a>
          <a className="rounded-xl border border-neutral-300 px-5 py-3" href="/book">Book</a>
        </div>
      </section>
    </div>
  );
}
