const SERVICES = [
  {
    title: "Custom & Handmade Frames",
    body:
      "Choose from hundreds of different styles, finishes (wood and aluminum), colors, and designs to suit your needs.",
  },
  {
    title: "Matting",
    body:
      "Preservation/Conservation of many types, styles, and frame designs.",
  },
  {
    title: "Mounting",
    body:
      "Dry mounting, floating mounting, and shadow boxing, among others.",
  },
  {
    title: "Insurance Repair & Replace",
    body:
      "Repair art and frames covered by insurance — we will repair or replace.",
  },
  {
    title: "UV Light Protection",
    body:
      "We offer various types of glass to suit your art and long-time preservation — from quality picture clear to non-glare to UV protection and the ultimate museum glass.",
  },
  {
    title: "Glazing",
    body: "Specializing in a number of types of glazing, including:",
    bullets: [
      "Premium Clear",
      "Non Glare",
      "Acrylic/Plexi/UV",
      "Optium Museum Acrylic",
      "Conservation UV Protection",
      "Mirrors",
      "Museum Glass",
    ],
  },
  {
    title: "Acrylic Boxes",
    body:
      "Protect fragile valuables, artwork, and keepsakes with sturdy construction.",
  },
  {
    title: "Stretching Of Paintings",
    body:
      "Paintings stretched to fit frames; repair of damaged paintings.",
  },
  {
    title: "Repair & Restoration",
    body:
      "Oversized framing, needle points, canvas security hanging, and more.",
  },
  {
    title: "Canvas Stretching",
    body:
      "We can fit your canvas pictures onto a new frame.",
  },
  {
    title: "Budget Framing",
    body:
      "Our experts will work to determine the best framing solution for you and keep it within your budget.",
  },
];

export default function Page() {
  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
        <p className="max-w-3xl mx-auto text-neutral-700">
          We have been serving Boston and its surrounding communities for over 30 years,
          specializing in both residential and corporate accounts. We also have a focus on
          restorations and repairs of all types (frames, pictures and more).
        </p>
        <p className="max-w-3xl mx-auto text-neutral-700">
          Contact us today to find out how we can help you frame your art, restore your
          cherished memories and preserve them for a lifetime.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What we offer</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-700">{s.body}</p>

              {"bullets" in s && Array.isArray((s as any).bullets) ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {(s as any).bullets.map((b: string) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
