export default function HeaderPublic() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <a className="font-semibold" href="/">West Roxbury Framing</a>
        <nav className="flex gap-4 text-sm text-neutral-600">
          <a href="/custom-framing">Custom Framing</a>
          <a href="/services">Services</a>
          <a href="/gallery">Gallery</a>
          <a href="/about">About</a>
          <a href="/book" className="text-black font-medium">Book</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}
