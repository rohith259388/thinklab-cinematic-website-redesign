/**
 * An endless current of signal — brands, disciplines, values.
 */
export default function Marquee({ items, className = '', glow = false }: { items: string[]; className?: string; glow?: boolean }) {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={`${key}-${i}`} className="flex items-center">
          <span className={`whitespace-nowrap px-8 font-display text-2xl tracking-tight md:text-4xl ${glow ? 'text-[#c5b0ff]' : 'text-[#e9e3dc]'}`}>
            {item}
          </span>
          <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 text-[#7e6ff0]" aria-hidden="true">
            <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" opacity="0.8" />
          </svg>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`group relative overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row('a')}
        {row('b')}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#050505] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050505] to-transparent" />
    </div>
  );
}
