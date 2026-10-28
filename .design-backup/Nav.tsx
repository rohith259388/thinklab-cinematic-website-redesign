'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import gsap from 'gsap';
import { NAV, SERVICES, BRAND } from '@/lib/content';

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlay.current,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power4.inOut' },
      );
      gsap.fromTo(
        linksRef.current?.querySelectorAll('[data-menu-item]') ?? [],
        { y: 44, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.055, delay: 0.25, ease: 'power3.out' },
      );
    });
    return () => ctx.revert();
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] transition-all duration-700 ${
          scrolled ? 'backdrop-blur-xl bg-[#050505]/55 border-b border-[rgba(197,176,255,0.08)]' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 md:px-10 md:py-5">
          <Link href="/" className="group flex items-center gap-3" aria-label="Thinklab Digital Solutions — Home">
            <span className="spark-core block h-3.5 w-3.5" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[19px] tracking-tight text-[#fcfcf7]">
                Thinklab
              </span>
              <span className="font-mono text-[8.5px] tracking-[0.34em] text-[#9a97a8] uppercase mt-1">
                Digital Solutions
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              const isServices = item.label === 'Services';
              return (
                <div key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className={`relative font-mono text-[11px] tracking-[0.22em] uppercase transition-colors duration-500 ${
                      active ? 'text-[#c5b0ff]' : 'text-[#9a97a8] group-hover:text-[#fcfcf7]'
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-all duration-500 ${
                        active
                          ? 'bg-[#a280ff] opacity-100 shadow-[0_0_10px_rgba(162,128,255,0.9)]'
                          : 'bg-[#a280ff] opacity-0 group-hover:opacity-60'
                      }`}
                    />
                  </Link>
                  {isServices && (
                    <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-6 opacity-0 transition-all duration-500 group-hover:visible group-hover:opacity-100">
                      <div className="glass sheen p-3">
                        {SERVICES.map((s) => (
                          <Link
                            key={s.id}
                            href={`/services#${s.id}`}
                            className="flex items-center justify-between rounded-xl px-4 py-2.5 text-[13px] text-[#c9c7d4] transition-colors hover:bg-[rgba(126,111,240,0.10)] hover:text-[#fcfcf7]"
                          >
                            {s.title}
                            <ArrowUpRight className="h-3.5 w-3.5 text-[#7e6ff0]" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/contact" className="btn-drop sheen hidden px-5 py-2.5 text-[12.5px] font-medium tracking-wide md:inline-flex">
              Start a project
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="btn-ghost flex h-10 w-10 items-center justify-center !rounded-full lg:hidden"
            >
              {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="btn-ghost hidden h-10 items-center gap-2 rounded-full px-4 font-mono text-[10.5px] tracking-[0.22em] uppercase lg:flex"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              {open ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div ref={overlay} className="fixed inset-0 z-[75] bg-[#070608]/92 backdrop-blur-2xl" style={{ clipPath: 'inset(0% 0% 100% 0%)' }}>
          <div ref={linksRef} className="mx-auto flex h-full max-w-[1500px] flex-col justify-center px-6 pt-20 md:px-12">
            <p data-menu-item className="font-mono text-[10.5px] tracking-[0.4em] text-[#7e6ff0] uppercase">
              The laboratory
            </p>
            <div className="mt-6 flex flex-col">
              {NAV.map((item, i) => (
                <Link
                  key={item.label}
                  href={item.href}
                  data-menu-item
                  className="group flex items-baseline gap-5 border-b border-[rgba(197,176,255,0.08)] py-4 md:py-5"
                >
                  <span className="font-mono text-[11px] text-[#545454]">0{i + 1}</span>
                  <span className="font-display text-4xl tracking-tight text-[#e9e3dc] transition-all duration-500 group-hover:translate-x-3 group-hover:text-[#c5b0ff] md:text-6xl">
                    {item.label}
                  </span>
                  <ArrowUpRight className="ml-auto h-6 w-6 self-center text-[#545454] transition-all duration-500 group-hover:text-[#a280ff]" />
                </Link>
              ))}
            </div>
            <div data-menu-item className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              {BRAND.phones.map((p) => (
                <a key={p.href} href={p.href} className="font-mono text-[11px] tracking-[0.18em] text-[#9a97a8] hover:text-[#c5b0ff]">
                  {p.label} · {p.region}
                </a>
              ))}
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#545454]">{BRAND.locations.join('  ·  ')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
