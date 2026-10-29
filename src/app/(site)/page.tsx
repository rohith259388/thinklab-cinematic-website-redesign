import CmsPage from "@/components/cms/Page";
import { toProjectCard } from "@/lib/live";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { BRAND, SERVICES, STATS, HOME_FAQS, ABOUT } from "@/lib/content";
import StageSetter from "@/components/experience/StageSetter";
import HomeJourney from "@/components/home/HomeJourney";
import ProjectGallery from "@/components/home/ProjectGallery";
import { entries, siteContent } from "@/lib/cms/public";
import { CmsText } from "@/components/cms/Canvas";
import Accordion from "@/components/ui/Accordion";
import { Reveal, CountUp, SplitWords } from "@/components/ui/Reveal";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Thinklab — Small spark. Big impact.",
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
          <HomeJourney />
          <div className="studio-content">
            <section id="studio" className="studio-intro section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> 01 / THE STUDIO
                </span>
                <span>CURIOUS MINDS. SHARED AMBITION.</span>
              </div>
              <div className="intro-grid">
                <Reveal>
                  <span className="intro-symbol" aria-hidden="true">
                    ✳
                  </span>
                  <p className="small-note">
                    A digital partner for
                    <br />
                    what comes next.
                  </p>
                </Reveal>
                <div>
                  <h2 className="statement">
                    <CmsText field="studio.line1" split>
                      <SplitWords text="Good ideas deserve" />
                    </CmsText>
                    <br />
                    <span className="muted">
                      <CmsText field="studio.line2" split>
                        <SplitWords text="an extraordinary" delay={0.1} />
                      </CmsText>
                    </span>
                    <br />
                    <CmsText field="studio.line3" split>
                      <SplitWords text="way into the world." delay={0.2} />
                    </CmsText>
                  </h2>
                  <div className="intro-bottom">
                    <Reveal>
                      <p>
                        <CmsText field="studio.body">
                          We’re Thinklab. A team of strategists, designers and
                          builders turning business ambition into digital
                          experiences that connect, perform and grow.
                        </CmsText>
                      </p>
                    </Reveal>
                    <Reveal delay={0.15}>
                      <Link href="/about" className="round-link">
                        <CmsText field="studio.cta">Meet the minds</CmsText>{" "}
                        <span>
                          <ArrowUpRight size={20} />
                        </span>
                      </Link>
                    </Reveal>
                  </div>
                </div>
              </div>
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

            <section id="works" className="selected-work section-pad">
              <div className="section-index">
                <span>
                  <Plus size={14} /> 02 / SELECTED WORK
                </span>
                <span>THINKING MADE TANGIBLE.</span>
              </div>
              <div className="section-heading">
                <h2>
                  <CmsText field="projects.title" split>
                    <SplitWords text="Projects" />
                  </CmsText>
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
                    Explore all projects{" "}
                    <span>
                      <ArrowUpRight size={20} />
                    </span>
                  </Link>
                </Reveal>
              </div>
              <ProjectGallery projects={projectCards.slice(0, 6)} />
            </section>

            <section className="possibility-panel" aria-label="Our philosophy">
              <div className="possibility-orbit" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <span className="micro-label">A DIFFERENT WAY TO THINK.</span>
              <h2>
                <SplitWords text="What if" />
                <br />
                <SplitWords text="became" />
                <br />
                <em>
                  <SplitWords text="what’s next?" />
                </em>
              </h2>
              <p>
                Curiosity is our starting point.
                <br />
                Your growth is where it leads.
              </p>
              <Link
                href="/contact"
                className="possibility-link"
                aria-label="Explore what is possible together"
              >
                <ArrowUpRight size={36} />
              </Link>
            </section>

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
                    Our capabilities{" "}
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
                  {SERVICES.map((s) => (
                    <Reveal key={s.id} y={22}>
                      <Link href={`/services/${s.id}`} className="service-row">
                        <span className="micro-label">{s.index}</span>
                        <div>
                          <h3>
                            {s.title.replace("Workflow/AI", "AI & Workflow")}
                          </h3>
                          <p>{s.capabilities.slice(0, 3).join(" / ")}</p>
                        </div>
                        <ArrowUpRight size={23} />
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>

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
                {ABOUT.process.stages.map((s) => (
                  <Reveal key={s.index}>
                    <article>
                      <span className="process-number">{s.index}</span>
                      <h3>{s.title.replace(" & ", " + ")}</h3>
                      <p>{s.body}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>

            <section className="faq-section section-pad">
              <div>
                <span className="micro-label">A LITTLE MORE CLARITY</span>
                <h2>
                  Good
                  <br />
                  <span className="muted">questions.</span>
                </h2>
                <Link href="/contact" className="text-link">
                  Have another one? <ArrowUpRight size={17} />
                </Link>
              </div>
              <Accordion items={HOME_FAQS.slice(0, 4)} />
            </section>
            <div className="closing-strip">
              <span>BIG THINKING STARTS WITH A SMALL HELLO.</span>
              <Plus size={22} />
              <span>LET’S SEE WHERE IT TAKES US.</span>
              <Plus size={22} />
            </div>
          </div>
        </>
      }
    </CmsPage>
  );
}
