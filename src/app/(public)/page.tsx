import Image from "next/image";
import HomeGalleryStrip from "@/components/HomeGalleryStrip";

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="rounded-2xl border border-neutral-200 bg-white/80 px-4 py-4 md:px-6 md:py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          We Earned the 2024 Boston Legacy Business Award
        </p>
        <p className="mt-1 text-lg font-semibold text-neutral-900">
          West Roxbury Framing
        </p>
        <p className="mt-1 text-sm text-neutral-800">
          <a
            href="https://www.boston.gov/departments/small-business/legacy-business-program"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 decoration-neutral-500 hover:text-neutral-900"
          >
            West Roxbury Framing and its owner, Moses Hasson, was one of a select few business in Boston
            to earn the Legacy Business Award, acknowledging long-standing businesses with historic
            significance and a commitment to the community.
          </a>
        </p>
      </section>

      <section className="grid gap-10 md:grid-cols-2 md:items-center rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 px-5 py-8 md:px-8 md:py-10 text-neutral-50 shadow-[0_30px_70px_rgba(0,0,0,0.65)]">
        <div className="space-y-5">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Custom Picture Framing in West Roxbury, MA
          </h1>
          <p className="text-lg text-neutral-200">
            Museum-quality framing for art, photos, diplomas, memorabilia, and objects — designed with you
            in-store.
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black shadow-md hover:bg-neutral-100" href="/book">
              Book a consultation
            </a>
            <a className="rounded-xl border border-neutral-500 px-5 py-3 text-sm font-medium text-neutral-100 hover:bg-neutral-800" href="/contact">
              Call / Directions
            </a>
          </div>
          <p className="text-sm text-neutral-400">Walk-ins welcome • Fast turnaround • Full-service design</p>
        </div>

        <div className="relative h-[260px] md:h-[320px]">
          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-amber-500/20 via-fuchsia-500/10 to-sky-500/20 blur-3xl" />
          <div className="relative h-full w-full">
            <div className="absolute left-0 top-6 h-40 w-32 md:h-52 md:w-40 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-[0_18px_45px_rgba(0,0,0,0.8)]">
              <Image
                src="/framed-art/brady-jersey.webp"
                alt="Framed Patriots jersey"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 40vw, 20vw"
              />
            </div>
            <div className="absolute right-1 md:right-4 top-0 h-40 w-32 md:h-52 md:w-40 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-[0_18px_45px_rgba(0,0,0,0.8)]">
              <Image
                src="/framed-art/diploma-and-medal.webp"
                alt="Framed diploma and medal"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 40vw, 20vw"
              />
            </div>
            <div className="absolute left-10 md:left-16 bottom-0 h-40 w-40 md:h-52 md:w-56 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-[0_22px_55px_rgba(0,0,0,0.95)]">
              <Image
                src="/framed-art/cowboy-sunset.webp"
                alt="Framed western artwork"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 55vw, 28vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">About Us</h2>
          <p className="text-sm font-medium text-neutral-900">West Roxbury Framing</p>
          <p className="text-sm leading-6 text-neutral-700">
            We are a family owned and operated fine art custom picture framing shop. Opened in 1981 and
            based in West Roxbury, we serve Boston and surrounding neighborhoods and towns with a
            commitment to quality service and fair prices. We offer all kinds of frame options to fit any
            needs from old maps and paintings, posters, valuable prints and sports jerseys to all manner
            of three dimensional objects; we can handle it all. We also offer limited frame and photo
            restoration as well as rush same day services.
          </p>
        </div>
        <div className="relative h-56 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-md md:h-64">
          <Image
            src="/home/2024-legacy-award-mayor-wu.jpg"
            alt="West Roxbury Framing receiving the 2024 Legacy Business Award with Mayor Wu"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>
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
