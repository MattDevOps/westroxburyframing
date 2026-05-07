const placeholders = Array.from({ length: 12 }).map((_, i) => i);

export default function GalleryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {placeholders.map((i) => (
        <div key={i} className="aspect-square rounded-2xl bg-neutral-100 border border-neutral-200" />
      ))}
    </div>
  );
}
