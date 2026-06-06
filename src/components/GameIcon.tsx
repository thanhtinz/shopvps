// Renders a game's icon as an <img> when a URL is provided, otherwise a generic
// SVG game-controller icon. Avoids emoji entirely.
export default function GameIcon({ icon, size = 22 }: { icon?: string | null; size?: number }) {
  if (icon && /^https?:\/\//.test(icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" width={size} height={size} style={{ borderRadius: 6, objectFit: "cover", display: "block" }} />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 11h4 M8 9v4 M15 12h.01 M18 10h.01 M17.32 5H6.68a4 4 0 00-3.98 3.59l-.84 8A3 3 0 004.84 20a3 3 0 002.65-1.6l.72-1.4h7.58l.72 1.4A3 3 0 0019.16 20a3 3 0 003-3.41l-.84-8A4 4 0 0017.32 5z" />
    </svg>
  );
}
