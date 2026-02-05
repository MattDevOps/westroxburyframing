export default function Page() {
  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">About Us</h1>
        <p className="text-lg font-medium">West Roxbury Framing</p>
        <p className="max-w-3xl mx-auto text-neutral-700">
          We are a family owned and operated fine art custom picture framing shop. Opened in 1981 and
          based in West Roxbury, we serve Boston and surrounding neighborhoods and towns with a
          commitment to quality service and fair prices. We offer all kinds of frame options to fit any
          needs from old maps and paintings, posters, valuable prints and sports jerseys to all manner of
          three dimensional objects; we can handle it all. We also offer limited frame and photo
          restoration as well as rush same day services.
        </p>
      </header>

      <section className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Specialties</h2>
          <p className="mt-3 text-neutral-700">
            We are a locally-owned framing gallery specializing in custom-designed frames made to
            perfectly compliment the item you are looking to showcase. We can also frame mirrors and
            tabletops, which you can bring to us or we can supply. Since 1981, we have offered our
            clients quality products with a fast turnaround at an affordable price. We also do beautiful
            frame and photo restoration to bring the good memories back. We are available by appointment
            as well as before and after listed hours. Non Profit and Military Organization will receive
            an additional 5% off. Awarded for Best of Boston.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">History</h2>
          <p className="mt-3 text-neutral-700">
            Established in 1982. West Roxbury Framing Center is a family-owned and operated business with
            over 35 years of experience. We have served a high volume of clients over the years and take
            pride in giving great value for your money. We can help with anything related to the trade
            including artwork.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Meet The Owner</h2>
          <p className="mt-1 font-medium">
            Moses Hasson (&quot;The Frame Guy&quot;)
          </p>
          <p className="mt-3 text-neutral-700">
            Moses Hasson is the owner of Copley Art &amp; Framing and West Roxbury Framing. He has been
            designing and building custom frames since 1982. He loves to work with customers to execute
            the perfect custom frame for their piece and give them the best price possible. He is
            sometimes known as &quot;The Frame Guy&quot;.
          </p>
        </div>
      </section>
    </div>
  );
}
