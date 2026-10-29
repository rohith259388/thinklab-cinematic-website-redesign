'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SERVICES } from '@/lib/content';

/**
 * Seven chambers, one panel. Instead of stacking seven long passages
 * over the live scene, the visitor drives the page: pick a chamber and
 * it opens on a solid, readable surface.
 */
export default function ServiceExplorer() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const service = SERVICES[active];

  const move = (next: number) => {
    const i = (next + SERVICES.length) % SERVICES.length;
    setActive(i);
    tabs.current[i]?.focus();
  };

  return (
    <div className="service-explorer">
      <div
        className="service-rail"
        role="tablist"
        aria-label="Services"
        aria-orientation="vertical"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); move(active + 1); }
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); move(active - 1); }
          if (e.key === 'Home') { e.preventDefault(); move(0); }
          if (e.key === 'End') { e.preventDefault(); move(SERVICES.length - 1); }
        }}
      >
        {SERVICES.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => { tabs.current[i] = el; }}
            id={`service-tab-${s.id}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls="service-panel"
            tabIndex={i === active ? 0 : -1}
            className="service-tab"
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
          >
            <span className="service-tab-index">{s.index}</span>
            <span className="service-tab-title">{s.title}</span>
          </button>
        ))}
      </div>

      <div
        key={service.id}
        id="service-panel"
        role="tabpanel"
        aria-labelledby={`service-tab-${service.id}`}
        tabIndex={-1}
        className="service-panel"
      >
        <span className="service-panel-index" aria-hidden="true">{service.index}</span>
        <p className="service-panel-layer">
          <span className="status-dot" />
          Chamber {service.index} · {service.layer}
        </p>
        <h2>{service.title}</h2>
        <p className="service-panel-summary">{service.summary}</p>
        <ul className="service-caps">
          {service.capabilities.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <Link href={`/services/${service.id}`} className="service-panel-link">
          Explore this service
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
