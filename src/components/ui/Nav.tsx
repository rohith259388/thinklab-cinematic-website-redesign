'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import { NAV, BRAND } from '@/lib/content';

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [light, setLight] = useState(false);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const surface = document.querySelector('.studio-content');
    const update = () => {
      const rect = surface?.getBoundingClientRect();
      setScrolled(window.scrollY > 40);
      setLight(Boolean(rect && rect.top < 80 && rect.bottom > 80));
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
        <Link href="/" className="wordmark" aria-label="Thinklab — Home">thinklab<span>®</span></Link>
        <span className="nav-descriptor">Ideas into impact.<br />Independent digital studio.</span>
        <div className="nav-actions">
          <Link href="/contact" className="nav-contact">Let’s talk <ArrowUpRight size={16} /></Link>
          <button ref={toggle} onClick={() => setOpen(true)} className="menu-toggle" aria-label="Open menu" aria-expanded={open} aria-controls="site-menu">Menu <span className="menu-dots"><i /><i /></span></button>
        </div>
      </header>
      <dialog ref={dialog} id="site-menu" aria-label="Site navigation" className="menu-dialog" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
        <div className="menu-top"><Link href="/" className="wordmark" onClick={() => setOpen(false)}>thinklab<span>®</span></Link><button className="menu-toggle" onClick={() => setOpen(false)} aria-label="Close menu">Close <X size={19} /></button></div>
        <div className="menu-body">
          <div className="menu-note"><Plus size={32} /><p>A little curiosity.<br />A whole new possibility.</p><span className="micro-label">INDIA ↔ AUSTRALIA</span></div>
          <nav aria-label="Main navigation">{NAV.map((item, i) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setOpen(false)} style={{ animationDelay: `${i * 45}ms` }}><span className="micro-label">0{i + 1}</span><span>{item.label}</span><ArrowUpRight /></Link>)}</nav>
        </div>
        <div className="menu-bottom"><span>GOOD THINGS BEGIN WITH A CONVERSATION.</span>{BRAND.phones.map(p => <a key={p.href} href={p.href}>{p.label} <span>{p.region}</span></a>)}</div>
      </dialog>
    </>
  );
}
