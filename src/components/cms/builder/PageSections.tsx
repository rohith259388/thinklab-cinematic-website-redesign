'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Eye, EyeOff, Plus, Trash } from 'lucide-react';
import type { Section, SectionType } from '@/lib/cms/schema';
import { newSection, sectionCatalog } from '@/lib/cms/blocks';
import SectionEditor from './SectionEditor';
import SectionPicker from './SectionPicker';
import { sectionIcons, type SiteLink } from './shared';

type Asset = { id: string; name: string; mime: string; alt: string };

/** The page outline: every section, with add / reorder / duplicate / hide / delete. */
export default function PageSections({
  sections,
  onChange,
  selectedId,
  onSelect,
  assets,
  links,
  disabled,
  intro,
  focus,
}: {
  sections: Section[];
  onChange: (sections: Section[]) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  assets: Asset[];
  links: SiteLink[];
  disabled?: boolean;
  intro: string;
  focus?: { path: string; tick: number };
}) {
  // Index to insert a new section at; null when the picker is closed.
  const [insertAt, setInsertAt] = useState<number | null>(null);

  const update = (i: number, next: Section) => onChange(sections.map((s, j) => (j === i ? next : s)));
  const move = (i: number, d: number) => {
    const next = [...sections];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const add = (type: SectionType) => {
    const s = newSection(type);
    const at = insertAt ?? sections.length;
    const next = [...sections];
    next.splice(at, 0, s);
    onChange(next);
    setInsertAt(null);
    onSelect(s.id);
  };

  return (
    <div className="cms-outline">
      <p className="cms-hint">{intro}</p>
      {sections.length === 0 && (
        <div className="cms-outline-empty">
          <strong>No sections yet</strong>
          <span>Add your first building block: a hero banner, text, images, FAQ and more.</span>
        </div>
      )}
      {sections.map((s, i) => {
        const def = sectionCatalog[s.type];
        const Icon = sectionIcons[s.type];
        const open = selectedId === s.id;
        return (
          <div
            key={s.id}
            data-edit-path={`s:${s.id}`}
            className={`cms-outline-item ${open ? 'open' : ''} ${s.hidden ? 'is-hidden' : ''}`}
          >
            <div className="cms-outline-row">
              <button type="button" className="cms-outline-toggle" onClick={() => onSelect(open ? '' : s.id)}>
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Icon size={15} />
                <span>
                  <strong>{def.label}</strong>
                  <small>{s.title || s.kicker || s.body.slice(0, 40) || '—'}</small>
                </span>
              </button>
              <div className="cms-outline-actions">
                <button type="button" title="Move up" disabled={disabled || i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={13} />
                </button>
                <button type="button" title="Move down" disabled={disabled || i === sections.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  title={s.hidden ? 'Show to visitors' : 'Hide from visitors'}
                  disabled={disabled}
                  onClick={() => update(i, { ...s, hidden: !s.hidden })}
                >
                  {s.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  type="button"
                  title="Duplicate"
                  disabled={disabled}
                  onClick={() => {
                    const copy = { ...structuredClone(s), id: newSection(s.type).id };
                    const next = [...sections];
                    next.splice(i + 1, 0, copy);
                    onChange(next);
                    onSelect(copy.id);
                  }}
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  title="Delete section"
                  className="danger"
                  disabled={disabled}
                  onClick={() => {
                    if (confirm(`Delete the “${def.label}” section?`)) onChange(sections.filter((x) => x.id !== s.id));
                  }}
                >
                  <Trash size={13} />
                </button>
              </div>
            </div>
            {open && (
              <>
                <SectionEditor
                  section={s}
                  onChange={(next) => update(i, next)}
                  assets={assets}
                  links={links}
                  disabled={disabled}
                  focus={focus}
                />
                <button type="button" className="cms-add-between" disabled={disabled} onClick={() => setInsertAt(i + 1)}>
                  <Plus size={13} /> Add a section below this one
                </button>
              </>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="cms-add-wide cms-add-section"
        disabled={disabled || sections.length >= 60}
        onClick={() => setInsertAt(sections.length)}
      >
        <Plus size={15} /> Add section
      </button>
      {!sections.some((s) => s.type === 'faq') && (
        <button
          type="button"
          className="cms-add-wide cms-add-faq"
          disabled={disabled || sections.length >= 60}
          onClick={() => {
            const s = newSection('faq');
            // Place the FAQ before a closing call-to-action or contact form, if there is one.
            const last = sections[sections.length - 1];
            const at = last && (last.type === 'cta' || last.type === 'contact') ? sections.length - 1 : sections.length;
            const next = [...sections];
            next.splice(at, 0, s);
            onChange(next);
            onSelect(s.id);
          }}
        >
          <Plus size={15} /> Add FAQ section
        </button>
      )}
      {insertAt !== null && <SectionPicker onPick={add} onClose={() => setInsertAt(null)} />}
    </div>
  );
}
