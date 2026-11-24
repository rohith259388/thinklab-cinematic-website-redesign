'use client';

import { CmsText, CmsLink, useCanvasContent } from '@/components/cms/Canvas';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import { NAV, BRAND } from '@/lib/content';

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [light, setLight] = useState(false);
  const { menu } = useCanvasContent();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const surfaces = Array.from(document.querySelectorAll<HTMLElement>('.studio-content, [data-light-surface]'));
    const update = () => {
      setScrolled(window.scrollY > 40);
      setLight(surfaces.some((s) => { const rect = s.getBoundingClientRect(); return rect.top < 80 && rect.bottom > 80; }));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
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
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}${light ? ' header-light' : ''}`}>
        <Link href="/" className="wordmark flex items-center" aria-label="Thinklab — Home">
          {/* Thinklab Digital Solutions Brand Logo (adaptive dark/light) */}
          <div className="relative h-9 sm:h-10 w-auto flex items-center">
            {/* Dark logo on light backgrounds */}
            <img
              src="/images/thinklab-logo-dark.png"
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
      <dialog ref={dialog} id="site-menu" aria-label="Site navigation" className="menu-dialog" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
        <div className="menu-top">
          <Link href="/" className="wordmark flex items-center" onClick={() => setOpen(false)} aria-label="Thinklab — Home">
            <img
              src="/images/thinklab-logo-white.png"
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
