'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface GrowCtaCardProps {
  className?: string;
  spokespersonImage?: string;
  bgImage?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
}

export default function GrowCtaCard({
  className = '',
  spokespersonImage = '/images/grow-spokesperson.png',
  title = 'Are You Ready To Grow?',
  subtitle = 'Book A session with the team.',
  buttonText = 'Book Now',
  buttonHref = '/hammer-time',
}: GrowCtaCardProps) {
  return (
    <div
      className={`elementor-element elementor-element-742f775 e-con-full e-flex e-con e-child animated fadeIn group relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#141026] via-[#0d0a1a] to-[#07050e] p-6 md:p-8 min-h-[300px] shadow-[0_20px_50px_-15px_rgba(126,111,240,0.25)] transition-all duration-500 hover:border-[#c5b0ff]/40 hover:shadow-[0_25px_60px_-10px_rgba(126,111,240,0.4)] ${className}`}
      data-id="742f775"
      data-element_type="container"
      data-e-type="container"
      data-settings='{"background_background":"classic","animation":"fadeIn"}'
    >
      {/* Cinematic atmospheric lighting glows matching Thinklab brand */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-12 h-64 w-64 rounded-full bg-[#7e6ff0]/25 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-44 w-44 rounded-full bg-[#e4c390]/15 blur-2xl" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      </div>

      {/* Enhanced Spokesperson Cutout Image (White background completely removed) */}
      <div className="absolute right-[-8px] sm:right-2 bottom-0 h-[96%] w-auto max-w-[48%] pointer-events-none z-10 flex items-end justify-end">
        <Image
          src={spokespersonImage}
          alt="Thinklab Team Spokesperson"
          width={579}
          height={1000}
          priority
          className="h-full w-auto object-contain object-bottom transition-transform duration-700 ease-out group-hover:scale-105 group-hover:translate-x-1 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
        />
      </div>

      {/* Card Content - constrained to the left side so it never covers the spokesperson */}
      <div
        className="elementor-element elementor-element-db616a3 e-con-full e-flex e-con e-child relative z-20 flex flex-col justify-between h-full max-w-[58%] sm:max-w-[55%]"
        data-id="db616a3"
        data-element_type="container"
        data-e-type="container"
      >
        <div>
          {/* Micro Kicker */}
          <div className="flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7e6ff0] shadow-[0_0_8px_#7e6ff0] animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#c5b0ff] uppercase flex items-center gap-1.5">
              GROWTH SESSION <Sparkles size={11} className="text-[#e4c390]" />
            </span>
          </div>

          {/* Heading */}
          <div
            className="elementor-element elementor-element-ff7b5df elementor-widget__width-initial elementor-widget elementor-widget-heading"
            data-id="ff7b5df"
            data-element_type="widget"
            data-e-type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h3 className="elementor-heading-title elementor-size-default font-sans font-bold text-2xl lg:text-[26px] leading-[1.18] text-[#fcfcf7] tracking-[-0.03em]">
                {title}
              </h3>
            </div>
          </div>

          {/* Text Editor / Subtitle */}
          <div
            className="elementor-element elementor-element-02f5329 elementor-widget__width-initial elementor-widget elementor-widget-text-editor mt-2.5 mb-6"
            data-id="02f5329"
            data-element_type="widget"
            data-e-type="widget"
            data-widget_type="text-editor.default"
          >
            <div className="elementor-widget-container">
              <p className="font-sans text-[14px] md:text-[15px] leading-relaxed text-[#b9b4c4]">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Button Wrapper */}
        <div
          className="elementor-element elementor-element-ff12aaf elementor-align-left elementor-widget__width-initial elementor-widget elementor-widget-button"
          data-id="ff12aaf"
          data-element_type="widget"
          data-e-type="widget"
          data-widget_type="button.default"
        >
          <div className="elementor-widget-container">
            <div className="elementor-button-wrapper">
              <Link
                href={buttonHref}
                className="elementor-button elementor-button-link elementor-size-sm btn-drop px-6 py-3 text-[13px] font-medium tracking-wide uppercase inline-flex items-center gap-2 group/btn"
              >
                <span className="elementor-button-content-wrapper flex items-center gap-2">
                  <span className="elementor-button-text font-mono font-medium tracking-wider">
                    {buttonText}
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom subtle detail badge */}
        <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#8f8a9a]">
          <span>Strategy & Scale</span>
          <span className="text-[#c5b0ff]">Direct with Founders</span>
        </div>
      </div>
    </div>
  );
}
