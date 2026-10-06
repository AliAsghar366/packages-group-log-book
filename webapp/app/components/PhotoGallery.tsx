export type PhotoItem = { id: string; url: string; caption?: string | null };

export default function PhotoGallery({ photos }: { photos: PhotoItem[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {photos.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="block aspect-square overflow-hidden rounded-lg border border-white/30 bg-black/5 dark:border-white/15 dark:bg-white/5"
          title={p.caption ?? undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.caption ?? "Attached photo"} className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}