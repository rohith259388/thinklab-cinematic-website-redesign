import { CmsText } from '@/components/cms/Canvas';
import type { PageKey } from '@/lib/motion';
import { Reveal, SplitWords, EnergyLine } from './Reveal';

export default function PageHero({ page, kicker, title, accent, body, children }: {
  page: PageKey;
  kicker: string;
  title: string;
  accent?: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="inner-hero" data-page={page}>
      <Reveal y={14}><span className="micro-label"><span className="status-dot" /><CmsText field="hero.kicker">{kicker}</CmsText> / THINKLAB®</span></Reveal>
      <h1><CmsText field="hero.title" split><SplitWords text={title} /></CmsText>{accent && <><br /><span><CmsText field="hero.accent" split><SplitWords text={accent} delay={0.12} /></CmsText></span></>}</h1>
      {body && <Reveal y={22} delay={0.25} className="inner-hero-body"><CmsText field="hero.body">{body}</CmsText></Reveal>}
      {children}
      <EnergyLine className="mt-14 md:mt-20" />
    </header>
  );
}
