import { CmsText } from '@/components/cms/Canvas';
import { Reveal, SplitWords } from './Reveal';

/**
 * The chapter heading of every room in the laboratory.
 */
export default function SectionIntro({
  kicker,
  title,
  accent,
  body,
  align = 'left',
  tone = 'light',
}: {
  kicker: string;
  title: string;
  /** Italic closing words — the part of the sentence that glows. */
  accent?: string;
  body?: string;
  align?: 'left' | 'center';
  tone?: 'light' | 'dim';
}) {
  const field='section.'+kicker.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60);
  const center = align === 'center';
  return (
    <div className={`relative ${center ? 'text-center' : ''}`}>
      <Reveal y={18}>
        <span className="chapter-chip inline-flex items-center gap-2.5 rounded-full px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a280ff] shadow-[0_0_12px_rgba(162,128,255,0.9)]" />
          <span className="font-mono text-[10.5px] tracking-[0.34em] text-[#c5b0ff] uppercase"><CmsText field={field+'.kicker'}>{kicker}</CmsText></span>
        </span>
      </Reveal>
      <h2
        className={`mt-6 font-display text-[length:clamp(2.1rem,calc(5.2*var(--vw)),4.2rem)] leading-[1.04] tracking-tight ${
          tone === 'light' ? 'text-[#fcfcf7]' : 'text-[#e9e3dc]'
        }`}
      >
        <CmsText field={field+'.title'} split><SplitWords text={title} /></CmsText>
        {accent && (
          <>
            {' '}
            <em className="not-italic font-display italic text-[#c5b0ff]">
              <CmsText field={field+'.accent'} split><SplitWords text={accent} delay={0.18} stagger={0.07} /></CmsText>
            </em>
          </>
        )}
      </h2>
      {body && (
        <Reveal
          y={22}
          delay={0.25}
          className={`mt-6 max-w-2xl text-[15.5px] leading-relaxed text-[#9a97a8] md:text-[17px] ${center ? 'mx-auto' : ''}`}
        >
          <CmsText field={field+'.body'}>{body}</CmsText>
        </Reveal>
      )}
    </div>
  );
}
