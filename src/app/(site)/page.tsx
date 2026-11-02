import CmsPage from "@/components/cms/Page";
import { toProjectCard } from "@/lib/live";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus, Star } from "lucide-react";
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
import ProjectGallery from "@/components/home/ProjectGallery";
import { entries, siteContent } from "@/lib/cms/public";
import { CmsText } from "@/components/cms/Canvas";
import Accordion from "@/components/ui/Accordion";
import { Reveal, CountUp, SplitWords } from "@/components/ui/Reveal";

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
  const projects = await entries("projects");
  const projectCards = projects.map(toProjectCard);

  // Four primary services from main website
  const primaryServices = SERVICES.slice(0, 4);

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
            {/* 2. COMPANY INTRODUCTION */}
            <section id="studio" className="studio-intro section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> 01 / WHO WE ARE
                </span>
                <span>CURIOUS MINDS. SHARED AMBITION.</span>
              </div>
              <div className="intro-grid">
                <Reveal>
                  <span className="intro-symbol" aria-hidden="true">
                    ✳
                  </span>
                  <p className="small-note">
                    Helping Brands
                    <br />
                    Grow Faster Online.
                  </p>
                </Reveal>
                <div>
                  <h2 className="statement">
                    <SplitWords text="About Thinklab" />
                    <br />
                    <span className="muted">
                      <SplitWords text="Digital Solutions." delay={0.1} />
                    </span>
                  </h2>
                  <div className="intro-bottom">
                    <Reveal>
                      <div className="space-y-4 text-base md:text-lg leading-relaxed text-[#0b0b12]/80 dark:text-white/80">
                        <p>
                          Thinklab Digital Solutions is a full-service digital agency providing digital marketing, website development, automation, CRM, and strategic consulting services.
                        </p>
                        <p>
                          We help businesses improve visibility, generate qualified leads, and streamline operations through data-driven solutions tailored to their growth goals.
                        </p>
                      </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                      <Link href="/about" className="round-link">
                        Meet the minds{" "}
                        <span>
                          <ArrowUpRight size={20} />
                        </span>
                      </Link>
                    </Reveal>
                  </div>
                </div>
              </div>

              {/* 3. STATISTICS SECTION */}
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
                    <span className="micro-label">{s.label}</span>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* 4. SELECTED PROJECTS */}
            <section id="works" className="selected-work section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> 02 / SELECTED WORK
                </span>
                <span>THINKING MADE TANGIBLE.</span>
              </div>
              <div className="section-heading">
                <h2>
                  <SplitWords text="Projects" />
                  <span className="project-heading-count">
                    {" "}
                    / {projectCards.length}
                  </span>
                </h2>
                <Reveal>
                  <p>
                    A few of the brands we’ve helped
                    <br />
                    find their next chapter.
                  </p>
                  <Link href="/projects" className="round-link">
                    View All Projects{" "}
                    <span>
                      <ArrowUpRight size={20} />
                    </span>
                  </Link>
                </Reveal>
              </div>
              <ProjectGallery projects={projectCards.slice(0, 4)} />
            </section>

            {/* 5. BRAND PHILOSOPHY / WHY CHOOSE US */}
            <section className="possibility-panel" aria-label="Why Thinklab Digital Solutions Stands Out">
              <div className="possibility-orbit" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <span className="micro-label">WHY THINKLAB DIGITAL SOLUTIONS STANDS OUT</span>
              <h2>
                <span className="block"><SplitWords text="What if" /></span>
                <span className="block"><SplitWords text="became" /></span>
                <em className="block not-italic text-[#d0baff]"><SplitWords text="what’s next?" /></em>
              </h2>
              <div className="relative z-10 max-w-xl space-y-4 my-6 text-white/80 text-left">
                <p>
                  We combine strategic digital marketing, high performance website development, and intelligent automation to help businesses increase traffic, generate qualified leads, and grow revenue consistently.
                </p>
                <p>
                  Our approach focuses on measurable results, transparent reporting, and continuous optimisation to ensure long-term digital success.
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

            {/* 6. SERVICES SECTION */}
            <section id="services" className="services-section section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> 03 / WHAT WE DO
                </span>
                <span>CONNECTED BY DESIGN.</span>
              </div>
              <div className="services-grid">
                <div className="services-intro">
                  <h2>
                    <SplitWords text="Different skills." />
                    <br />
                    <span className="muted">
                      <SplitWords text="One big picture." />
                    </span>
                  </h2>
                  <p>
                    From the first conversation to your next breakthrough.
                    Everything your brand needs, working together.
                  </p>
                  <Link href="/services" className="round-link">
                    View All Services{" "}
                    <span>
                      <ArrowUpRight size={20} />
                    </span>
                  </Link>
                  <div className="capability-mark" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="service-list">
                  {primaryServices.map((s) => (
                    <Reveal key={s.id} y={22}>
                      <Link href={`/services/${s.id}`} className="service-row">
                        <span className="micro-label">{s.index}</span>
                        <div>
                          <h3>
                            {s.title.replace("Workflow/AI", "Workflow / AI")}
                          </h3>
                          <p className="line-clamp-2">{s.description}</p>
                        </div>
                        <ArrowUpRight size={23} />
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>

            {/* 7. WORKING PROCESS SECTION */}
            <section className="process-section section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> 04 / HOW WE THINK
                </span>
                <span>FROM POSSIBILITY TO PROGRESS.</span>
              </div>
              <div className="section-heading">
                <h2>
                  <SplitWords text="Great work." />
                  <br />
                  <span className="muted">
                    <SplitWords text="No guesswork." />
                  </span>
                </h2>
                <p>
                  A clear process. An open conversation.
                  <br />A shared commitment to getting it right.
                </p>
              </div>
              <div className="process-grid">
                {FEATURES.map((stage, i) => (
                  <Reveal key={stage.title}>
                    <article>
                      <span className="process-number">0{i + 1}</span>
                      <h3>{stage.title}</h3>
                      <p>{stage.description}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* 8. CLIENT TESTIMONIALS SECTION */}
            <section className="testimonials-section section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> 05 / CLIENT FEEDBACK
                </span>
                <span>PROVEN RESULTS. TRUSTED PARTNERSHIPS.</span>
              </div>
              <div className="section-heading">
                <h2>
                  <SplitWords text="In their" />
                  <br />
                  <span className="muted">
                    <SplitWords text="own words." />
                  </span>
                </h2>
                <Reveal>
                  <p>
                    Hear what our clients have to say about
                    <br />
                    working with Thinklab.
                  </p>
                  <Link href="/reviews" className="round-link">
                    View All Reviews{" "}
                    <span>
                      <ArrowUpRight size={20} />
                    </span>
                  </Link>
                </Reveal>
              </div>
              <div className="review-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {TESTIMONIALS.slice(0, 6).map((t, i) => (
                  <Reveal key={t.name} delay={i * 0.08}>
                    <figure className="review-card p-7 rounded-2xl bg-white/75 border border-[#27291d]/15 shadow-sm hover:border-[#7e6ff0]/40 hover:shadow-md transition-all flex flex-col justify-between h-full">
                      <div className="flex items-center gap-1 text-amber-500 mb-4">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <blockquote className="text-[#20211f] text-sm md:text-base leading-relaxed mb-6 italic font-normal">
                        “{t.quote}”
                      </blockquote>
                      <figcaption className="border-t border-[#27291d]/12 pt-4">
                        <div className="font-semibold text-[#1a1b18] tracking-wide">
                          {t.name}
                        </div>
                        <div className="text-xs text-[#686b61] font-mono mt-0.5">
                          {t.role}, {t.company}
                        </div>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* 9. BLOG / INSIGHTS SECTION */}
            <section className="insights-section section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> 06 / INSIGHTS
                </span>
                <span>PERSPECTIVES &amp; STRATEGY.</span>
              </div>
              <div className="section-heading">
                <h2>
                  <SplitWords text="Dive into our collection of" />
                  <br />
                  <span className="muted">
                    <SplitWords text="engaging blog posts." />
                  </span>
                </h2>
                <Reveal>
                  <p>
                    Strategic ideas, modern frameworks, and practical guides.
                  </p>
                  <Link href="/blog" className="round-link">
                    Read Blogs{" "}
                    <span>
                      <ArrowUpRight size={20} />
                    </span>
                  </Link>
                </Reveal>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {BLOGS.map((blog, i) => (
                  <Reveal key={blog.title} delay={i * 0.07}>
                    <Link
                      href={blog.slug ? `/blog/${blog.slug}` : "/blog"}
                      className="group p-6 rounded-2xl bg-white/75 border border-[#27291d]/15 shadow-sm hover:border-[#7e6ff0]/50 hover:shadow-md transition-all flex flex-col justify-between h-full"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono text-[#686b61] mb-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#7e6ff0]/10 text-[#644be2] font-medium border border-[#7e6ff0]/20">{blog.tag}</span>
                          <span>{blog.date}</span>
                        </div>
                        <h3 className="text-base font-semibold text-[#1a1b18] group-hover:text-[#644be2] transition-colors leading-snug">
                          {blog.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#644be2] font-mono font-medium mt-6 group-hover:translate-x-1 transition-transform">
                        <span>Read article</span>
                        <ArrowUpRight size={14} />
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* 10. FAQ SECTION */}
            <section className="faq-section section-pad">
              <div>
                <span className="micro-label">A LITTLE MORE CLARITY</span>
                <h2>
                  Frequently Asked
                  <br />
                  <span className="muted">Questions.</span>
                </h2>
                <Link href="/contact" className="text-link">
                  Have another one? <ArrowUpRight size={17} />
                </Link>
              </div>
              <Accordion items={HOME_FAQS} />
            </section>
          </div>
        </>
      }
    </CmsPage>
  );
}
