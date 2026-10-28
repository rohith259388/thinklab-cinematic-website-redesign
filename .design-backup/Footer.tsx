import Link from 'next/link';
import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { BRAND, NAV, SERVICES } from '@/lib/content';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[rgba(197,176,255,0.08)] bg-[#050505]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1500px] px-5 py-16 md:px-10 md:py-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[10.5px] tracking-[0.4em] text-[#7e6ff0] uppercase">The cycle continues</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-[#fcfcf7] md:text-6xl">
              Ideas never
              <span className="italic text-[#c5b0ff]"> stop moving.</span>
            </h2>
            <Link href="/contact" className="btn-drop sheen mt-8 px-7 py-3.5 text-sm font-medium">
              {`What's your idea?`}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-16">
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] text-[#545454] uppercase">Navigate</p>
              <ul className="mt-5 space-y-2.5">
                {NAV.map((n) => (
                  <li key={n.label}>
                    <Link href={n.href} className="text-[13.5px] text-[#9a97a8] transition-colors hover:text-[#fcfcf7]">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] text-[#545454] uppercase">Services</p>
              <ul className="mt-5 space-y-2.5">
                {SERVICES.map((s) => (
                  <li key={s.id}>
                    <Link href={`/services#${s.id}`} className="text-[13.5px] text-[#9a97a8] transition-colors hover:text-[#fcfcf7]">
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="font-mono text-[10px] tracking-[0.3em] text-[#545454] uppercase">Contact</p>
              <ul className="mt-5 space-y-3">
                {BRAND.phones.map((p) => (
                  <li key={p.href}>
                    <a href={p.href} className="flex items-center gap-2.5 text-[13.5px] text-[#9a97a8] transition-colors hover:text-[#fcfcf7]">
                      <Phone className="h-3.5 w-3.5 text-[#7e6ff0]" />
                      {p.label}
                      <span className="font-mono text-[10px] text-[#545454]">{p.region}</span>
                    </a>
                  </li>
                ))}
                {BRAND.locations.map((l) => (
                  <li key={l} className="flex items-center gap-2.5 text-[13.5px] text-[#9a97a8]">
                    <MapPin className="h-3.5 w-3.5 text-[#7e6ff0]" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="hairline mt-16" />
        <div className="mt-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <p className="font-mono text-[10.5px] tracking-[0.14em] text-[#545454]">{BRAND.copyright}</p>
          <p className="font-mono text-[10.5px] tracking-[0.14em] text-[#545454]">
            Grown from molten glass · <span className="text-[#a280ff]">The Living Idea</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
