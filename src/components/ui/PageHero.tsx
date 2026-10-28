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
      <Reveal y={14}><span className="micro-label"><span className="status-dot" />{kicker} / THINKLAB®</span></Reveal>
      <h1><SplitWords text={title} />{accent && <><br /><span><SplitWords text={accent} delay={0.12} /></span></>}</h1>
      {body && <Reveal y={22} delay={0.25} className="inner-hero-body">{body}</Reveal>}
      {children}
      <EnergyLine className="mt-14 md:mt-20" />
    </header>
  );
}
