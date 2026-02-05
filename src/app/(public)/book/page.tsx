export default function Page() {
  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Book A Free Consultation</h1>
        <p className="max-w-2xl mx-auto text-neutral-700">
          Schedule a complimentary framing consultation with West Roxbury Framing. You can meet with us
          in person at our shop or talk over the phone about your artwork, photos, memorabilia, or
          project ideas.
        </p>
        <p className="max-w-2xl mx-auto text-neutral-700">
          Use the calendar below to pick a day and time that works best for you. You&apos;ll be able to
          confirm whether you prefer an in-person or phone consultation directly in the booking form.
        </p>
      </header>

      <section className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-3 md:p-4">
          <iframe
            title="Book a free consultation with West Roxbury Framing"
            src="https://calendly.com/jake-westroxburyframing/30min"
            className="w-full h-[780px] border-0"
          />
        </div>
        <p className="mt-3 text-center text-sm text-neutral-600">
          If the calendar does not load, you can also book directly at{" "}
          <a
            href="https://calendly.com/jake-westroxburyframing/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            calendly.com/jake-westroxburyframing/30min
          </a>
          .
        </p>
      </section>
    </div>
  );
}
