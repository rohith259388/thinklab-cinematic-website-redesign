import dynamic from "next/dynamic";
import { Loader } from '@/components/ui/Loader';
import CmsPage from "@/components/cms/Page";
import { toProjectCard } from "@/lib/live";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, Mail, Phone, Plus, Star } from "lucide-react";
import {
  BRAND,
  SERVICES,
  STATS,
  HOME_FAQS,
  WHY_US,
  FEATURES,
  TESTIMONIALS,
  BLOGS,
} from "@/lib/content";
import StageSetter from "@/components/experience/StageSetter";
import HomeJourney from "@/components/home/HomeJourney";
import InsightsBento from "@/components/home/InsightsBento";
import { entries, siteContent } from "@/lib/cms/public";
import { CmsText } from "@/components/cms/Canvas";
import { Reveal, CountUp, SplitWords } from "@/components/ui/Reveal";

const ProjectBendGallery = dynamic(() => import("@/components/home/ProjectBendGallery"), {
  loading: () => <Loader minHeight={500} />,
});
const VerticalTestimonials = dynamic(() => import("@/components/home/VerticalTestimonials"), {
  loading: () => <Loader minHeight={300} />,
});
const Accordion = dynamic(() => import("@/components/ui/Accordion"), {
  loading: () => <Loader minHeight={200} />,
});
const LeadForm = dynamic(() => import("@/components/ui/LeadForm"), {
  loading: () => <div className="glass p-9"><Loader minHeight={420} /></div>,
});

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Thinklab — The Right Partner For Digital Growth",
    description: BRAND.descriptor,
    alternates: { canonical: "/" },
  };
  const { page } = await siteContent();
  return {
    ...fallback,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
    ...(page?.canonical ? { alternates: { canonical: page.canonical } } : {}),
  };
}

export default async function HomePage() {
  const [projects, articles] = await Promise.all([
    entries("projects"),
    entries("blog"),
  ]);
  const projectCards = projects.map(toProjectCard);

  // Four primary services from main website
  const primaryServices = SERVICES.slice(0, 4);

  // Latest insights: newly created insights appear on top (5 blogs in balanced 2+3 Bento layout)
  const homeInsights = (articles && articles.length > 0)
    ? articles.slice(0, 5).map((a) => {
        const words = (a.blocks ?? []).reduce((sum, b) => sum + (b.text ? b.text.split(/\s+/).length : 0), 0);
        const mins = Math.max(2, Math.round(words / 160));
        return {
          title: a.title,
          date: a.date || '',
          tag: a.category || 'Insights',
          slug: a.slug,
          image: a.image,
          readTime: `${mins} min read`,
        };
      })
    : BLOGS.slice(0, 5);

  return (
    <CmsPage>
      {
        <>
          <StageSetter page="home" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: BRAND.name,
                url: "https://www.thinklabdigitalsolutions.com/",
                description: BRAND.descriptor,
              }),
            }}
          />
          {/* 1. HERO SECTION */}
          <HomeJourney />

          <div className="studio-content">
            {/* 1. SERVICES */}
            <section id="services" className="services-section section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> <CmsText field="home.services.number">01 / WHAT WE DO</CmsText>
                </span>
                <span><CmsText field="home.services.kicker">CONNECTED BY DESIGN.</CmsText></span>
              </div>
              <div className="services-grid">
                <div className="services-intro">
                  <h2>
                    <CmsText field="home.services.title" split><SplitWords text="Different skills." /></CmsText>
                    <br />
                    <span className="muted">
                      <CmsText field="home.services.accent" split><SplitWords text="One big picture." /></CmsText>
                    </span>
                  </h2>
                  <p>
                    <CmsText field="home.services.body">
                      From the first conversation to your next breakthrough.
                      Everything your brand needs, working together.
                    </CmsText>
                  </p>
                  <Link href="/services" className="round-link">
                    <CmsText field="home.services.cta">View All Services</CmsText>{" "}
                    <span className="round-arrow">
                      <ArrowUpRight size={18} />
                    </span>
                  </Link>
                  <div className="capability-mark" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="service-list">
                  {primaryServices.map((s, i) => (
                    <Reveal key={s.id} y={22}>
                      <Link href={`/services/${s.id}`} className="service-row">
                        <span className="micro-label">{s.index}</span>
                        <div>
                          <h3>
                            <CmsText field={`home.service.${i}.title`}>
                              {s.title.replace("Workflow/AI", "Workflow / AI")}
                            </CmsText>
                          </h3>
                          <p className="line-clamp-2">
                            <CmsText field={`home.service.${i}.desc`}>
                              {s.description}
                            </CmsText>
                          </p>
                        </div>
                        <ArrowUpRight size={23} />
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. HOW WE WORK (PROCESS) */}
            <section className="process-section section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> <CmsText field="home.process.number">02 / HOW WE THINK</CmsText>
                </span>
                <span><CmsText field="home.process.kicker">FROM POSSIBILITY TO PROGRESS.</CmsText></span>
              </div>
              <div className="section-heading">
                <h2>
                  <CmsText field="home.process.title" split><SplitWords text="Great work." /></CmsText>
                  <br />
                  <span className="muted">
                    <CmsText field="home.process.accent" split><SplitWords text="No guesswork." /></CmsText>
                  </span>
                </h2>
                <p>
                  <CmsText field="home.process.body">
                    A clear process. An open conversation.
                    <br />A shared commitment to getting it right.
                  </CmsText>
                </p>
              </div>
              <div className="process-grid">
                {FEATURES.map((stage, i) => (
                  <Reveal key={stage.title}>
                    <article>
                      <span className="process-number">0{i + 1}</span>
                      <h3><CmsText field={`home.feature.${i}.title`}>{stage.title}</CmsText></h3>
                      <p><CmsText field={`home.feature.${i}.desc`}>{stage.description}</CmsText></p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* 3. PROJECTS */}
            <section id="works" className="selected-work section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> <CmsText field="home.projects.number">03 / SELECTED WORK</CmsText>
                </span>
                <span><CmsText field="home.projects.kicker">THINKING MADE TANGIBLE.</CmsText></span>
              </div>
              <div className="section-heading">
                <h2>
                  <CmsText field="home.projects.title" split><SplitWords text="Projects" /></CmsText>
                  <span className="project-heading-count">
                    {" "}
                    / {projectCards.length}
                  </span>
                </h2>
                <Reveal>
                  <p>
                    <CmsText field="home.projects.body">
                      A few of the brands we’ve helped
                      <br />
                      find their next chapter.
                    </CmsText>
                  </p>
                  <Link href="/projects" className="round-link">
                    <CmsText field="home.projects.cta">View All Projects</CmsText>{" "}
                    <span className="round-arrow">
                      <ArrowUpRight size={18} />
                    </span>
                  </Link>
                </Reveal>
              </div>
              <ProjectBendGallery projects={projectCards.slice(0, 4)} pageBg="#f0f0e9" cardBg="#ffffff" />
            </section>

            {/* 4. TESTIMONIALS */}
            <section className="testimonials-section section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> <CmsText field="home.testimonials.number">04 / CLIENT FEEDBACK</CmsText>
                </span>
                <span><CmsText field="home.testimonials.kicker">PROVEN RESULTS. TRUSTED PARTNERSHIPS.</CmsText></span>
              </div>
              <div className="section-heading">
                <h2>
                  <CmsText field="home.testimonials.title" split><SplitWords text="In their" /></CmsText>
                  <br />
                  <span className="muted">
                    <CmsText field="home.testimonials.accent" split><SplitWords text="own words." /></CmsText>
                  </span>
                </h2>
                <Reveal>
                  <p>
                    <CmsText field="home.testimonials.body">
                      Hear what our clients have to say about
                      <br />
                      working with Thinklab.
                    </CmsText>
                  </p>
                  <Link href="/reviews" className="round-link">
                    <CmsText field="home.testimonials.cta">View All Reviews</CmsText>{" "}
                    <span className="round-arrow">
                      <ArrowUpRight size={18} />
                    </span>
                  </Link>
                </Reveal>
              </div>

              {/* Scroll-driven 3D testimonial ring (pins this section) */}
              <VerticalTestimonials />
            </section>

            {/* 5. ABOUT US */}
            <section id="studio" className="studio-intro section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> <CmsText field="home.intro.number">05 / WHO WE ARE</CmsText>
                </span>
                <span><CmsText field="home.intro.kicker">CURIOUS MINDS. SHARED AMBITION.</CmsText></span>
              </div>
              <div className="intro-grid">
                <Reveal>
                  <span className="intro-symbol" aria-hidden="true">
                    ✳
                  </span>
                  <p className="small-note">
                    <CmsText field="home.intro.note">
                      Helping Brands
                      <br />
                      Grow Faster Online.
                    </CmsText>
                  </p>
                </Reveal>
                <div>
                  <h2 className="statement">
                    <CmsText field="home.intro.title" split><SplitWords text="About Thinklab" /></CmsText>
                    <br />
                    <span className="muted">
                      <CmsText field="home.intro.accent" split><SplitWords text="Digital Solutions." delay={0.1} /></CmsText>
                    </span>
                  </h2>
                  <div className="intro-bottom">
                    <Reveal>
                      <div className="space-y-4 text-base md:text-lg leading-relaxed text-[#0b0b12]/80 dark:text-white/80">
                        <p>
                          <CmsText field="home.intro.body1">
                            Thinklab Digital Solutions is a full-service digital agency providing digital marketing, website development, automation, CRM, and strategic consulting services.
                          </CmsText>
                        </p>
                        <p>
                          <CmsText field="home.intro.body2">
                            We help businesses improve visibility, generate qualified leads, and streamline operations through data-driven solutions tailored to their growth goals.
                          </CmsText>
                        </p>
                      </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                      <Link href="/about" className="round-link">
                        <CmsText field="home.intro.cta">Meet the minds</CmsText>{" "}
                        <span className="round-arrow">
                          <ArrowUpRight size={18} />
                        </span>
                      </Link>
                    </Reveal>
                  </div>
                </div>
              </div>

              {/* STATISTICS SECTION */}
              <div className="stats-line">
                {STATS.map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.08}>
                    <p>
                      <CountUp
                        end={s.value}
                        prefix={s.prefix ?? ""}
                        suffix={s.suffix ?? ""}
                      />
                    </p>
                    <span className="micro-label">
                      <CmsText field={`home.stats.label.${i}`}>{s.label}</CmsText>
                    </span>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* 6. FAQ'S */}
            <section className="faq-section section-pad">
              <div>
                <span className="micro-label">
                  <CmsText field="home.faq.kicker">A LITTLE MORE CLARITY</CmsText>
                </span>
                <h2>
                  <CmsText field="home.faq.title">Frequently Asked</CmsText>
                  <br />
                  <span className="muted"><CmsText field="home.faq.accent">Questions.</CmsText></span>
                </h2>
                <Link href="/contact" className="text-link">
                  <CmsText field="home.faq.cta">Have another one?</CmsText> <ArrowUpRight size={17} />
                </Link>
              </div>
              <Accordion items={HOME_FAQS} />
            </section>

            {/* 7. INSIGHTS */}
            <section className="insights-section section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> <CmsText field="home.insights.number">06 / INSIGHTS</CmsText>
                </span>
                <span><CmsText field="home.insights.kicker">PERSPECTIVES &amp; STRATEGY.</CmsText></span>
              </div>
              <div className="section-heading">
                <h2>
                  <CmsText field="home.insights.title" split><SplitWords text="Dive into our collection of" /></CmsText>
                  <br />
                  <span className="muted">
                    <CmsText field="home.insights.accent" split><SplitWords text="engaging blog posts." /></CmsText>
                  </span>
                </h2>
                <Reveal>
                  <p>
                    <CmsText field="home.insights.body">
                      Strategic ideas, modern frameworks, and practical guides.
                    </CmsText>
                  </p>
                  <Link href="/blog" className="round-link">
                    <CmsText field="home.insights.cta">Read Blogs</CmsText>{" "}
                    <span className="round-arrow">
                      <ArrowUpRight size={18} />
                    </span>
                  </Link>
                </Reveal>
              </div>
              <InsightsBento insights={homeInsights} />
            </section>

            {/* 8. BANNER (BRAND PHILOSOPHY / WHY CHOOSE US) */}
            <section className="possibility-panel" aria-label="Why Thinklab Digital Solutions Stands Out">
              <div className="possibility-orbit" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <span className="micro-label">
                <CmsText field="home.philosophy.kicker">WHY THINKLAB DIGITAL SOLUTIONS STANDS OUT</CmsText>
              </span>
              <h2>
                <span className="block">
                  <CmsText field="home.philosophy.title" split><SplitWords text="What if" /></CmsText>
                </span>
                <span className="block">
                  <CmsText field="home.philosophy.title2" split><SplitWords text="became" /></CmsText>
                </span>
                <em className="block not-italic text-[#d0baff]">
                  <CmsText field="home.philosophy.accent" split><SplitWords text="what’s next?" /></CmsText>
                </em>
              </h2>
              <div className="relative z-10 max-w-xl space-y-4 my-6 text-white/80 text-left">
                <p>
                  <CmsText field="home.philosophy.body1">
                    We combine strategic digital marketing, high performance website development, and intelligent automation to help businesses increase traffic, generate qualified leads, and grow revenue consistently.
                  </CmsText>
                </p>
                <p>
                  <CmsText field="home.philosophy.body2">
                    Our approach focuses on measurable results, transparent reporting, and continuous optimisation to ensure long-term digital success.
                  </CmsText>
                </p>
              </div>

              <Link
                href="/contact"
                className="possibility-link"
                aria-label="Explore what is possible together"
              >
                <ArrowUpRight size={36} />
              </Link>
            </section>

            {/* 9. CONTACT */}
            <section id="contact" className="home-contact" aria-label="Contact Thinklab">
              <div className="home-contact-intro">
                <span className="micro-label">
                  <CmsText field="home.contact.kicker">07 / GET IN TOUCH</CmsText>
                </span>
                <h2>
                  <CmsText field="home.contact.title" split><SplitWords text="It starts with" /></CmsText>
                  <br />
                  <span className="muted">
                    <CmsText field="home.contact.accent" split><SplitWords text="a conversation." /></CmsText>
                  </span>
                </h2>
                <p>
                  <CmsText field="home.contact.body">
                    Share a few details about your project and our team will get back to you within one business day.
                  </CmsText>
                </p>
                <ul className="home-contact-lines">
                  <li>
                    <a href={`mailto:${BRAND.email}`}>
                      <span className="home-contact-icon"><Mail size={16} /></span>
                      {BRAND.email}
                    </a>
                  </li>
                  {BRAND.phones.map((p) => (
                    <li key={p.href}>
                      <a href={p.href}>
                        <span className="home-contact-icon"><Phone size={16} /></span>
                        {p.label} <span className="micro-label">{p.region}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <Reveal>
                <Suspense fallback={<div className="glass p-9"><Loader minHeight={420} /></div>}>
                  <LeadForm source="home" />
                </Suspense>
              </Reveal>
            </section>
          </div>
        </>
      }
    </CmsPage>
  );
}
