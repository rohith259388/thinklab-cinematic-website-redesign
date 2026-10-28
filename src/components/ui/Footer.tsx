import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { BRAND, NAV } from '@/lib/content';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top"><span className="micro-label">HAVE A CHALLENGE IN MIND?</span><span className="micro-label"><span className="status-dot" /> LET’S FIND WHAT’S POSSIBLE.</span></div>
      <Link href="/contact" className="footer-invitation">Let’s make<br /><span>an impact.</span><span className="footer-arrow"><ArrowUpRight strokeWidth={1} /></span></Link>
      <div className="footer-grid">
        <div><span className="micro-label">BASED IN TWO PLACES. THINKING EVERYWHERE.</span><p>Vijayawada, India<br />Sydney, Australia</p></div>
        <div><span className="micro-label">START A CONVERSATION</span>{BRAND.phones.map(p => <a key={p.href} href={p.href}>{p.label}<ArrowUpRight size={14} /></a>)}<a className="break-all" href={`mailto:${BRAND.email}`}>{BRAND.email}<ArrowUpRight size={14} /></a></div>
        <nav aria-label="Footer navigation">{NAV.filter(n => n.href !== '/').map(n => <Link key={n.href} href={n.href}>{n.label}<ArrowUpRight size={14} /></Link>)}</nav>
      </div>
      <div className="footer-social"><a href="https://www.instagram.com/thinklab_digital_solutions" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://au.linkedin.com/company/think-lab-digital-solutions" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://www.facebook.com/share/1CL8BgY2jp/" target="_blank" rel="noreferrer">Facebook ↗</a><a href="https://events.thinklabdigitalsolutions.com">Thinklab Events ↗</a></div>
      <div className="footer-baseline"><span>© {new Date().getFullYear()} Thinklab Digital Solutions</span><span>STRATEGY · DESIGN · TECHNOLOGY</span><a href="#main">Back to top ↑</a></div>
    </footer>
  );
}
