"use client";

export function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  let m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
  );
  if (m) return "https://www.youtube.com/embed/" + m[1];
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return "https://player.vimeo.com/video/" + m[1];
  m = url.match(/loom\.com\/(?:share|embed)\/([\w]+)/);
  if (m) return "https://www.loom.com/embed/" + m[1];
  return null;
}

export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const embed = getEmbedUrl(url);
  if (embed) {
    return (
      <div className="relative pt-[56.25%] rounded-xl overflow-hidden bg-black">
        <iframe
          src={embed}
          title={title || "video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: 0 }}
        />
      </div>
    );
  }
  if (url && (url.startsWith("blob:") || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url))) {
    return <video controls src={url} className="w-full max-h-[420px] rounded-xl bg-black block" />;
  }
  if (url) {
    return (
      <div className="p-7 text-center bg-black text-white rounded-xl">
        Vidéo externe
        <br />
        <a href={url} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] font-bold">
          Ouvrir la vidéo ↗
        </a>
      </div>
    );
  }
  return (
    <div
      className="p-7 text-center bg-[var(--color-surface-2)] rounded-xl text-[var(--color-text-muted)]"
      style={{ border: "1px dashed var(--color-border)" }}
    >
      Aucune vidéo. Colle un lien YouTube, Vimeo ou Loom.
    </div>
  );
}
