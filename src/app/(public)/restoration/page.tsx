import Image from "next/image";

const RESTORATION_IMAGES = [
  { src: "/restoration/1.jpg", alt: "Restored photograph example 1" },
  { src: "/restoration/2.png", alt: "Restored photograph example 2" },
  { src: "/restoration/3.png", alt: "Restored photograph example 3" },
  { src: "/restoration/4.png", alt: "Restored photograph example 4" },
  { src: "/restoration/5.png", alt: "Restored photograph example 5" },
  { src: "/restoration/6.jpg", alt: "Restored photograph example 6" },
];

export default function Page() {
  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Repair &amp; Restoration</h1>
        <p className="max-w-3xl mx-auto text-neutral-700">
          West Roxbury Framing offers a full array of repair and restoration services. We can provide
          initial treatment for photographs and memorabilia suffering from a wide range of damage that
          requires repair.
        </p>
        <p className="max-w-3xl mx-auto text-neutral-700">
          West Roxbury Framing specializes in photo repair services, digital photo repair and antique
          photo restoration. From breathing life into a cherished family heirloom or restoring water or
          fire-damaged photos, it would be a privilege to restore and preserve your photographs.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Restoration examples</h2>
        <p className="max-w-2xl mx-auto text-center text-sm text-neutral-700">
          A small sample of photographs and artwork we have restored and preserved for our clients.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {RESTORATION_IMAGES.map((img) => (
            <div
              key={img.src}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-neutral-100">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

