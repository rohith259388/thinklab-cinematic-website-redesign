'use client';

import { CmsText, CmsLink, useCanvasContent } from '@/components/cms/Canvas';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import { NAV, BRAND } from '@/lib/content';
import LiquidGlass from '@/components/ui/LiquidGlass';

/** Relative luminance (0–1) of an `rgb()/rgba()` colour, or null if mostly transparent. */
function luminance(color: string): number | null {
  const m = color.match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  const [r, g, b, a = '1'] = m;
  if (parseFloat(a) < 0.5) return null;
  const lin = (v: string) => {
    const c = parseFloat(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Is the page surface directly behind the header light? Samples the element
 * stack at three points along the header and reads the first opaque
 * background colour (sections marked [data-light-surface] always count as light).
 */
function isLightBehind(header: HTMLElement | null): boolean {
  if (!header) return false;
  const box = header.getBoundingClientRect();
  const y = Math.max(1, box.top + box.height / 2);
  // Logo, centre and action buttons; the majority decides.
  const points = [box.left + 60, box.left + box.width / 2, box.right - 60];
  let votes = 0;
  for (const x of points) {
    for (const el of document.elementsFromPoint(x, y)) {
      if (header.contains(el)) continue;
      if (el.closest('[data-light-surface]')) { votes++; break; }
      const lum = luminance(getComputedStyle(el).backgroundColor);
      if (lum === null) continue;
      if (lum > 0.45) votes++;
      break;
    }
  }
  return votes >= 2;
}

export default function Nav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [light, setLight] = useState(false);
  const { menu } = useCanvasContent();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      // Hide while scrolling down, reveal on any scroll back up (ignore tiny jitter).
      if (y < 80) setHidden(false);
      else if (delta > 4) setHidden(true);
      else if (delta < -4) setHidden(false);
      if (Math.abs(delta) > 4 || y < 80) lastY = y;
      setLight(isLightBehind(header.current));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    // Re-check the moment the page content changes (route streamed in, loader
    // swapped for the page, lazy sections mounted) instead of waiting for a scroll.
    const main = document.getElementById('main');
    const observer = new MutationObserver(onScroll);
    if (main) observer.observe(main, { childList: true, subtree: true });
    // Safety net for late layout shifts (fonts, images) that don't touch the DOM tree.
    const settle = window.setTimeout(onScroll, 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const el = dialog.current;
    el?.showModal();
    const returnFocus = toggle.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el?.close();
      document.body.style.overflow = previous;
      returnFocus?.focus();
    };
  }, [open]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <LiquidGlass target={header} />
      <header ref={header} className={`site-header${hidden && !open ? ' is-hidden' : ''}${light ? ' header-light' : ''}`}>
        <Link href="/" className="wordmark flex items-center" aria-label="Thinklab — Home">
          {/* Thinklab Digital Solutions Brand Logo (adaptive dark/light) */}
          <div className="relative h-9 sm:h-10 w-auto flex items-center">
            {/* Black logo on light backgrounds */}
            <img
              src="/images/thinklab-logo-black.png"
              alt="Thinklab Digital Solutions"
              className="h-8 sm:h-9 w-auto object-contain hidden [.header-light_&]:block"
            />
            {/* White logo on dark backgrounds */}
            <img
              src="/images/thinklab-logo-white.png"
              alt="Thinklab Digital Solutions"
              className="h-8 sm:h-9 w-auto object-contain block [.header-light_&]:hidden"
            />
          </div>
        </Link>
        <span className="nav-descriptor">
          <CmsText global field="header.descriptor">
            Ideas into impact.<br />Independent digital studio.
          </CmsText>
        </span>
        <div className="nav-actions">
          <CmsLink global field="header.cta" href="/contact" className="nav-contact">
            <CmsText global field="header.cta">Let’s talk</CmsText> <ArrowUpRight size={16} />
          </CmsLink>
          <button ref={toggle} onClick={() => setOpen(true)} className="menu-toggle" aria-label="Open menu" aria-expanded={open} aria-controls="site-menu">Menu <span className="menu-dots"><i /><i /></span></button>
        </div>
      </header>
      <dialog ref={dialog} id="site-menu" aria-label="Site navigation" className="menu-dialog" style={{ '--menu-count': NAV.length + (menu?.length ?? 0) } as CSSProperties} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
        <div className="menu-top">
          <Link href="/" className="wordmark flex items-center" onClick={() => setOpen(false)} aria-label="Thinklab — Home">
            <img
              src="/images/thinklab-logo-black.png"
              alt="Thinklab Digital Solutions"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>
          <button className="menu-toggle" onClick={() => setOpen(false)} aria-label="Close menu">Close <X size={19} /></button>
        </div>
        <div className="menu-body">
          <div className="menu-note">
            <Plus size={32} />
            <p>
              <CmsText global field="menu.note">
                A little curiosity.<br />A whole new possibility.
              </CmsText>
            </p>
            <span className="micro-label">
              <CmsText global field="menu.kicker">INDIA ↔ AUSTRALIA</CmsText>
            </span>
          </div>
          <nav aria-label="Main navigation">{NAV.map((item, i) => <CmsLink global field={`nav.${i}`} key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setOpen(false)} style={{ animationDelay: `${i * 45}ms` }}><span className="micro-label">0{i + 1}</span><span><CmsText global field={`nav.${i}.label`}>{item.label}</CmsText></span><ArrowUpRight /></CmsLink>)}{(menu ?? []).map((item, j) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setOpen(false)} style={{ animationDelay: `${(NAV.length + j) * 45}ms` }}><span className="micro-label">{String(NAV.length + j + 1).padStart(2, '0')}</span><span>{item.title}</span><ArrowUpRight /></Link>)}</nav>
        </div>
        <div className="menu-bottom">
          <span><CmsText global field="menu.bottom">GOOD THINGS BEGIN WITH A CONVERSATION.</CmsText></span>
          {BRAND.phones.map(p => <a key={p.href} href={p.href}>{p.label} <span>{p.region}</span></a>)}
        </div>
      </dialog>
    </>
  );
}
