import Image from "next/image";

const TIPS = [
  {
    title: "Make Sure The Frame Matches The Photo And The Room",
    body:
      "A great frame should feel like it belongs to both the artwork and the space it lives in. We help you balance style, era, and materials so your framed art looks intentional in any room in Boston.",
    img: "/framed-art/01.jpg",
    alt: "Person considering frame options in front of artwork",
  },
  {
    title: "Consider The Size",
    body:
      "The wrong scale can make even the best artwork feel out of place. We look at wall size, viewing distance, and surrounding pieces to recommend frame and mat sizes that feel perfectly proportioned.",
    img: "/framed-art/02.jpg",
    alt: "Gallery professional adjusting framed artwork on wall",
  },
  {
    title: "Consider Colors",
    body:
      "Color choices in your frame and mat can either quietly support the art or make a bold statement. We guide you through neutrals, metals, woods, and accent tones so the colors enhance rather than compete.",
    img: "/framed-art/03.jpg",
    alt: "Person observing framed artwork in a gallery",
  },
  {
    title: "Choose Whether You Want A Mat Board",
    body:
      "Mat boards create breathing room around your art, protect it from the glass, and can completely change the look of a piece. From clean white to layered museum-style mats, we’ll help you decide what fits your artwork and your taste.",
    img: "/framed-art/04.jpg",
    alt: "Hands positioning an empty picture frame on a tabletop",
  },
];

export default function FramedArtPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Framed Art</h1>
        <p className="max-w-3xl mx-auto text-neutral-700">
          Choose The Right Frame In Boston Framed Art
        </p>
        <p className="max-w-3xl mx-auto text-neutral-700">
          Taking time to choose the perfect frame might not seem like a high priority, but if you care
          enough to put a picture on the wall, you have to make an effort to ensure you are looking your
          best and select a frame that makes it even better.
        </p>
        <p className="max-w-3xl mx-auto text-neutral-700">
          When selecting an appropriate frame, there are two main things you should consider: the piece
          itself and where the frame will live in your home or office.
        </p>
        <p className="max-w-3xl mx-auto text-neutral-700">
          Here are some of the most important tips to consider when choosing framed art.
        </p>
      </header>

      <section className="space-y-8">
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            className="grid gap-6 md:grid-cols-2 items-center rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-semibold">{tip.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">{tip.body}</p>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={tip.img}
                alt={tip.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

