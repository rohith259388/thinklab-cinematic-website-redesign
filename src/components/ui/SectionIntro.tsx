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
  const center = align === 'center';
  return (
    <div className={`relative ${center ? 'text-center' : ''}`}>
      <Reveal y={18}>
        <span className="chapter-chip inline-flex items-center gap-2.5 rounded-full px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a280ff] shadow-[0_0_12px_rgba(162,128,255,0.9)]" />
          <span className="font-mono text-[10.5px] tracking-[0.34em] text-[#c5b0ff] uppercase">{kicker}</span>
        </span>
      </Reveal>
      <h2
        className={`mt-6 font-display text-[clamp(2.1rem,5.2vw,4.2rem)] leading-[1.04] tracking-tight ${
          tone === 'light' ? 'text-[#fcfcf7]' : 'text-[#e9e3dc]'
        }`}
      >
        <SplitWords text={title} />
        {accent && (
          <>
            {' '}
            <em className="not-italic font-display italic text-[#c5b0ff]">
              <SplitWords text={accent} delay={0.18} stagger={0.07} />
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
          {body}
        </Reveal>
      )}
    </div>
  );
}
