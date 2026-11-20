'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Plus, Trash } from 'lucide-react';
import type { Section, SectionItem } from '@/lib/cms/schema';
import { sectionCatalog, emptyItem, type SectionFieldKey, type ItemFieldKey } from '@/lib/cms/blocks';
import ImageField from '../ImageField';
import FaqEditor from './FaqEditor';
import { ColorField, LinkField, Segmented, type SiteLink } from './shared';

type Asset = { id: string; name: string; mime: string; alt: string };

const multiline: SectionFieldKey[] = ['body', 'title'];

export default function SectionEditor({
  section: s,
  onChange,
  assets,
  links,
  disabled,
  focus,
}: {
  section: Section;
  onChange: (next: Section) => void;
  assets: Asset[];
  links: SiteLink[];
  disabled?: boolean;
  focus?: { path: string; tick: number };
}) {
  const def = sectionCatalog[s.type];
  const [openItem, setOpenItem] = useState<number | null>(0);
  // A click on a card/number/etc. in the preview opens that item here.
  const [seenTick, setSeenTick] = useState(0);
  const prefix = `s:${s.id}:`;
  if (focus && focus.tick !== seenTick) {
    setSeenTick(focus.tick);
    const m = focus.path.startsWith(prefix + 'items:') ? focus.path.slice(prefix.length).split(':') : null;
    if (m) setOpenItem(Number(m[1]));
  }
  const [showStyle, setShowStyle] = useState(false);
  const set = (patch: Partial<Section>) => onChange({ ...s, ...patch });
  const setItems = (items: SectionItem[]) => set({ items });

  const field = (key: SectionFieldKey) => {
    const control = fieldControl(key);
    return control ? (
      <div key={key} data-edit-path={prefix + key}>
        {control}
      </div>
    ) : null;
  };
  const fieldControl = (key: SectionFieldKey) => {
    const label = def.fieldLabels?.[key] ?? key;
    if (key === 'image')
      return (
        <ImageField
          key={key}
          label={label}
          value={s.image}
          onChange={(image) => set({ image })}
          assets={assets}
          disabled={disabled}
        />
      );
    if (key === 'href')
      return <LinkField key={key} label={label} value={s.href} links={links} onChange={(href) => set({ href })} />;
    if (key === 'alt')
      return s.image ? (
        <label className="cms-field" key={key}>
          Describe the image (for Google and screen readers)
          <input value={s.alt} onChange={(e) => set({ alt: e.target.value })} />
        </label>
      ) : null;
    const value = s[key];
    return (
      <label className="cms-field" key={key}>
        {label}
        {multiline.includes(key) ? (
          <textarea
            rows={key === 'body' ? 5 : 2}
            value={value}
            onChange={(e) => set({ [key]: e.target.value })}
          />
        ) : (
          <input value={value} onChange={(e) => set({ [key]: e.target.value })} />
        )}
      </label>
    );
  };

  const itemField = (item: SectionItem, i: number, key: ItemFieldKey) => (
    <div key={key} data-edit-path={`${prefix}items:${i}:${key}`}>
      {itemControl(item, i, key)}
    </div>
  );
  const itemControl = (item: SectionItem, i: number, key: ItemFieldKey) => {
    const label = def.items!.labels[key] ?? key;
    const update = (v: string) => setItems(s.items.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
    if (key === 'image')
      return <ImageField key={key} label={label} value={item.image} onChange={update} assets={assets} disabled={disabled} />;
    if (key === 'href') return <LinkField key={key} label={label} value={item.href} links={links} onChange={update} />;
    return (
      <label className="cms-field" key={key}>
        {label}
        {key === 'body' ? (
          <textarea rows={3} value={item.body} onChange={(e) => update(e.target.value)} />
        ) : (
          <input value={item[key]} onChange={(e) => update(e.target.value)} />
        )}
      </label>
    );
  };

  const move = (i: number, d: number) => {
    const items = [...s.items];
    [items[i], items[i + d]] = [items[i + d], items[i]];
    setItems(items);
    setOpenItem(i + d);
  };

  return (
    <div className="cms-sec-editor">
      {def.fields.map(field)}

      {s.type === 'faq' && <FaqEditor items={s.items} onChange={setItems} pathPrefix={prefix} focus={focus} />}

      {def.items && s.type !== 'faq' && (
        <div className="cms-items">
          <div className="cms-items-head">
            <strong>
              {def.items.noun[0].toUpperCase() + def.items.noun.slice(1)}s ({s.items.length})
            </strong>
          </div>
          {s.items.map((item, i) => {
            const open = openItem === i;
            const name = item.title || item.body.slice(0, 40) || `${def.items!.noun} ${i + 1}`;
            return (
              <div key={i} data-edit-path={`${prefix}items:${i}`} className={`cms-item ${open ? 'open' : ''}`}>
                <div className="cms-item-row">
                  <button type="button" className="cms-item-toggle" onClick={() => setOpenItem(open ? null : i)}>
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>{name}</span>
                  </button>
                  <button type="button" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp size={13} />
                  </button>
                  <button type="button" title="Move down" disabled={i === s.items.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    title="Duplicate"
                    disabled={s.items.length >= def.items!.max}
                    onClick={() => {
                      const items = [...s.items];
                      items.splice(i + 1, 0, { ...item });
                      setItems(items);
                      setOpenItem(i + 1);
                    }}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    className="danger"
                    onClick={() => {
                      if (confirm(`Delete this ${def.items!.noun}?`)) setItems(s.items.filter((_, j) => j !== i));
                    }}
                  >
                    <Trash size={13} />
                  </button>
                </div>
                {open && (
                  <div className="cms-item-body">
                    {def.items!.fields.map((k) => itemField(item, i, k))}
                    <button
                      type="button"
                      className="cms-add-between"
                      disabled={s.items.length >= def.items!.max}
                      onClick={() => {
                        const items = [...s.items];
                        items.splice(i + 1, 0, emptyItem());
                        setItems(items);
                        setOpenItem(i + 1);
                      }}
                    >
                      <Plus size={12} /> Insert {def.items!.noun} below
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="cms-add-wide"
            disabled={s.items.length >= def.items.max}
            onClick={() => {
              setItems([...s.items, emptyItem()]);
              setOpenItem(s.items.length);
            }}
          >
            <Plus size={14} /> Add {def.items.noun}
          </button>
        </div>
      )}

      {def.layouts && (
        <Segmented
          label="Layout"
          value={s.layout || def.layouts[0].value}
          options={def.layouts}
          onChange={(layout) => set({ layout })}
        />
      )}

      <button type="button" className="cms-style-toggle" onClick={() => setShowStyle(!showStyle)}>
        {showStyle ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Style: colours, spacing, alignment
      </button>
      {showStyle && (
        <div className="cms-style-group">
          <Segmented
            label="Text alignment"
            value={s.align}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Centre' },
            ]}
            onChange={(align) => set({ align })}
          />
          <ColorField label="Background colour" value={s.background} fallback="#0a0910" onChange={(background) => set({ background })} />
          <ColorField label="Text colour" value={s.color} fallback="#f1f0eb" onChange={(color) => set({ color })} />
          <label className="cms-field">
            Space above and below: {s.padding}px
            <input
              type="range"
              min={0}
              max={200}
              step={4}
              value={s.padding}
              onChange={(e) => set({ padding: Number(e.target.value) })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
