/**
 * The wordmark: lowercase "stielvoll", with the i drawn as a small popsicle
 * on its stick. The popsicle takes the colour of the flavour picked in the hero.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-display leading-none font-extrabold tracking-[-0.03em] ${className}`}>
      st
      <svg viewBox="0 0 30 100" className="mx-[0.03em] h-[0.98em] w-auto translate-y-[0.02em]" aria-hidden="true">
        {/* stick = the stem of the i */}
        <rect x="9.5" y="46" width="11" height="54" rx="5.5" fill="var(--color-birch)" />
        {/* popsicle = the dot of the i */}
        <rect x="1" y="2" width="28" height="52" rx="12" className="fill-flavour transition-[fill] duration-300" />
      </svg>
      elvoll
    </span>
  );
}
