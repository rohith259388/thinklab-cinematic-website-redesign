import { CmsText, CmsLink } from "@/components/cms/Canvas";
import { ArrowUpRight } from "lucide-react";
import { BRAND, NAV } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <span className="micro-label">
          <CmsText global field="footer.eyebrow">
            HAVE A CHALLENGE IN MIND?
          </CmsText>
        </span>
        <span className="micro-label">
          <span className="status-dot" />{" "}
          <CmsText global field="footer.subheading">
            LET’S FIND WHAT’S POSSIBLE.
          </CmsText>
        </span>
      </div>
      <CmsLink
        global
        field="footer.cta"
        href="/contact"
        className="footer-invitation"
      >
        <CmsText global field="footer.cta.line1">
          Let’s make
        </CmsText>
        <br />
        <span>
          <CmsText global field="footer.cta.line2">
            an impact.
          </CmsText>
        </span>
        <span className="footer-arrow">
          <ArrowUpRight strokeWidth={1} />
        </span>
      </CmsLink>
      <div className="footer-grid">
        <div>
          <span className="micro-label">
            <CmsText global field="footer.locations.heading">
              BASED IN TWO PLACES. THINKING EVERYWHERE.
            </CmsText>
          </span>
          <p>
            <CmsText global field="footer.location.1">
              Vijayawada, India
            </CmsText>
            <br />
            <CmsText global field="footer.location.2">
              Sydney, Australia
            </CmsText>
          </p>
        </div>
        <div>
          <span className="micro-label">
            <CmsText global field="footer.contact.heading">
              START A CONVERSATION
            </CmsText>
          </span>
          {BRAND.phones.map((p, i) => (
            <CmsLink
              global
              field={`footer.phone.${i}`}
              key={p.href}
              href={p.href}
            >
              <CmsText global field={`footer.phone.${i}.label`}>
                {p.label}
              </CmsText>
              <ArrowUpRight size={14} />
            </CmsLink>
          ))}
          <CmsLink
            global
            field="footer.email"
            className="break-all"
            href={`mailto:${BRAND.email}`}
          >
            <CmsText global field="footer.email.label">
              {BRAND.email}
            </CmsText>
            <ArrowUpRight size={14} />
          </CmsLink>
        </div>
        <nav aria-label="Footer navigation">
          {NAV.map((n, i) =>
            n.href === "/" ? null : (
              <CmsLink global field={`nav.${i}`} key={n.href} href={n.href}>
                <CmsText global field={`nav.${i}.label`}>
                  {n.label}
                </CmsText>
                <ArrowUpRight size={14} />
              </CmsLink>
            ),
          )}
        </nav>
      </div>
      <div className="footer-social">
        <a
          href="https://www.instagram.com/thinklab_digital_solutions"
          target="_blank"
          rel="noreferrer"
        >
          Instagram ↗
        </a>
        <a
          href="https://au.linkedin.com/company/think-lab-digital-solutions"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn ↗
        </a>
        <a
          href="https://www.facebook.com/share/1CL8BgY2jp/"
          target="_blank"
          rel="noreferrer"
        >
          Facebook ↗
        </a>
        <a href="https://events.thinklabdigitalsolutions.com">
          Thinklab Events ↗
        </a>
      </div>
      <div className="footer-baseline">
        <span>© {new Date().getFullYear()} Thinklab Digital Solutions</span>
        <span>STRATEGY · DESIGN · TECHNOLOGY</span>
        <a href="#main">Back to top ↑</a>
      </div>
    </footer>
  );
}
