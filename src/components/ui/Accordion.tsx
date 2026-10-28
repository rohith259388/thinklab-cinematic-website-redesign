'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { Reveal } from './Reveal';

export interface QA {
  q: string;
  a: string;
}

/**
 * FAQ — answers unfold like panels of smoked glass, never popping.
 */
export default function Accordion({ items }: { items: QA[] }) {
  const id = useId();
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="divide-y divide-[rgba(197,176,255,0.09)] border-y border-[rgba(197,176,255,0.09)]">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={item.q} y={20} delay={i * 0.04}>
            <div>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`${id}-${i}`}
                className="group flex w-full items-center gap-5 py-5 text-left md:py-6"
              >
                <span className="font-mono text-[10.5px] tracking-[0.2em] text-[#545454]">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className={`flex-1 text-[15.5px] font-medium tracking-tight transition-colors duration-500 md:text-lg ${
                    isOpen ? 'text-[#c5b0ff]' : 'text-[#e9e3dc] group-hover:text-[#fcfcf7]'
                  }`}
                >
                  {item.q}
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-700 ${
                    isOpen
                      ? 'rotate-[225deg] border-[rgba(162,128,255,0.6)] bg-[rgba(126,111,240,0.12)]'
                      : 'border-[rgba(197,176,255,0.18)] group-hover:border-[rgba(197,176,255,0.45)]'
                  }`}
                >
                  <Plus className={`h-4 w-4 transition-colors ${isOpen ? 'text-[#c5b0ff]' : 'text-[#9a97a8]'}`} />
                </span>
              </button>
              <div id={`${id}-${i}`} className="acc-panel" data-open={isOpen} aria-hidden={!isOpen}>
                <div>
                  <p className="max-w-3xl pr-4 pb-6 pl-[calc(1.25rem+1.25rem)] text-[14.5px] leading-relaxed text-[#9a97a8] md:text-[15.5px]">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
