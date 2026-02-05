export default function FooterPublic() {
  return (
    <footer className="border-t border-neutral-200 mt-10 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-700 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="font-semibold text-black">West Roxbury Framing</div>
          <div>1741 Centre Street</div>
          <div>West Roxbury, MA 02132</div>
          <div>
            Phone:{" "}
            <a href="tel:16173273890" className="text-blue-600 hover:underline">
              617-327-3890
            </a>
          </div>
        </div>

        <div className="space-y-1">
          <div className="font-semibold text-black">Hours</div>
          <div>Monday: 9:30 AM - 6 PM</div>
          <div>Tuesday: 9:30 AM - 6 PM</div>
          <div>Wednesday: 9:30 AM - 6 PM</div>
          <div>Thursday: 9:30 AM - 6 PM</div>
          <div>Friday: 9:30 AM - 6 PM</div>
          <div>Saturday: Closed</div>
          <div>Sunday: 10:30 AM - 4:30 PM</div>
        </div>
      </div>
    </footer>
  );
}
