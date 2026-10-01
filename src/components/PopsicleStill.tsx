/**
 * The popsicle as a flat illustration, drawn to the 3D model's measurements
 * (100 px per scene unit) so the two line up exactly: a 150 × 260 bar with the
 * same domed top and grooves, on a 30-wide stick showing 120 below it.
 * Used while the 3D hero loads, when motion is reduced or WebGL is unavailable,
 * and on the flavour cards.
 */
const BAR =
  "M10.5 27.0 L12.3 22.8 L14.8 18.7 L17.7 14.7 L21.0 11.1 L24.5 7.9 L28.0 5.2 L31.6 2.9 L35.0 1.3 L38.3 0.3 L41.4 0.0 L52.6 0.0 L63.8 0.0 L75.0 0.0 L86.2 0.0 L97.4 0.0 L108.6 0.0 L111.7 0.3 L115.0 1.3 L118.4 2.9 L122.0 5.2 L125.5 7.9 L129.0 11.1 L132.3 14.7 L135.2 18.7 L137.7 22.8 L139.5 27.0 L142.6 36.4 L145.2 45.7 L147.2 55.1 L148.7 64.5 L149.6 73.8 L150.0 83.2 L150.0 92.5 L150.0 101.9 L150.0 111.3 L150.0 120.6 L150.0 130.0 L150.0 139.4 L150.0 148.7 L150.0 158.1 L150.0 167.5 L150.0 176.8 L150.0 186.2 L150.0 195.5 L150.0 204.9 L150.0 214.3 L150.0 223.6 L150.0 233.0 L149.7 237.2 L148.7 241.3 L147.1 245.3 L144.8 248.9 L142.1 252.1 L138.9 254.8 L135.3 257.1 L131.3 258.7 L127.2 259.7 L123.0 260.0 L99.0 260.0 L75.0 260.0 L51.0 260.0 L27.0 260.0 L22.8 259.7 L18.7 258.7 L14.7 257.1 L11.1 254.8 L7.9 252.1 L5.2 248.9 L2.9 245.3 L1.3 241.3 L0.3 237.2 L0.0 233.0 L0.0 223.6 L0.0 214.3 L0.0 204.9 L0.0 195.5 L0.0 186.2 L0.0 176.8 L0.0 167.5 L0.0 158.1 L0.0 148.7 L0.0 139.4 L0.0 130.0 L0.0 120.6 L0.0 111.3 L0.0 101.9 L0.0 92.5 L0.0 83.2 L0.4 73.8 L1.3 64.5 L2.8 55.1 L4.8 45.7 L7.4 36.4Z";

export default function PopsicleStill({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 150 380" className={className} aria-hidden="true">
      <rect x="60" y="240" width="30" height="140" rx="5" fill="var(--color-birch)" />
      <path d={BAR} fill={color} />
      {/* the two moulded grooves */}
      <rect x="41.5" y="72" width="13" height="150" rx="6.5" fill="#000" opacity="0.1" />
      <rect x="95.5" y="72" width="13" height="150" rx="6.5" fill="#000" opacity="0.1" />
      {/* highlight */}
      <path d="M13 96c0-38 7-62 22-76" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
