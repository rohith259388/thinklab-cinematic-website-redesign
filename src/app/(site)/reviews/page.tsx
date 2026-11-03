import CmsPage from '@/components/cms/Page';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import { TESTIMONIALS } from '@/lib/content';
import { Reveal } from '@/components/ui/Reveal';
import { CmsText } from '@/components/cms/Canvas';

const defaultMetadata: Metadata = {
  title: 'Client Reviews',
  description: 'Hear from the clients and collaborators who work with Thinklab Digital Solutions.',
  alternates: { canonical: '/reviews' },
};
export async function generateMetadata():Promise<Metadata>{const {page}=await siteContent();return {...defaultMetadata,...(page?.seoTitle?{title:page.seoTitle}:{}),...(page?.seoDescription?{description:page.seoDescription}:{}),...(page?.canonical?{alternates:{canonical:page.canonical}}:{})};}

export default function ReviewsPage() {
  return (
    <CmsPage>
      <StageSetter page="about" />
      <PageHero
        page="about"
        kicker="In their own words"
        title="Good work."
        accent="Better partnerships."
        body="The people behind the projects. Hear what our clients have to say about working with Thinklab."
      />
      <section className="editorial-wrap">
        <div className="review-grid">
          {TESTIMONIALS.map((review, i) => (
            <Reveal key={review.name} delay={(i % 2) * 0.08}>
              <figure className="review-card">
                <span className="micro-label">
                  <CmsText field={`reviews.item.${i}.label`}>CLIENT PERSPECTIVE / 0{i + 1}</CmsText>
                </span>
                <blockquote>
                  “<CmsText field={`reviews.item.${i}.quote`}>{review.quote}</CmsText>”
                </blockquote>
                <figcaption>
                  <CmsText field={`reviews.item.${i}.name`}>{review.name}</CmsText>
                  <p>
                    <CmsText field={`reviews.item.${i}.role`}>{review.role}</CmsText>
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <Link className="btn-drop px-7 py-4 mt-10" href="/contact">
          <CmsText field="reviews.cta">Let’s build something together</CmsText> <ArrowUpRight size={18} />
        </Link>
      </section>
    </CmsPage>
  );
}
