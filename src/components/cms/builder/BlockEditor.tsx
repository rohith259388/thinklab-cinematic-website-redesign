'use client';
import { useState, type ComponentType } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  MessageCircleQuestionMark,
  MousePointerClick,
  Pilcrow,
  Plus,
  SeparatorHorizontal,
  TextQuote,
  Trash,
} from 'lucide-react';
import type { Block } from '@/lib/cms/schema';
import { blockCatalog, emptyItem, newSection } from '@/lib/cms/blocks';
import ImageField from '../ImageField';
import FaqEditor from './FaqEditor';

const newFaqBlock = (): Block => ({
  type: 'faqs',
  text: 'Frequently asked questions',
  items: newSection('faq').items,
});
import { LinkField, type SiteLink } from './shared';

type Asset = { id: string; name: string; mime: string; alt: string };

const icons: Record<string, ComponentType<{ size?: number }>> = {
  p: Pilcrow,
  h2: Heading2,
  h3: Heading3,
  h4: Heading3,
  h5: Heading3,
  li: List,
  ol: ListOrdered,
  img: ImageIcon,
  quote: TextQuote,
  faq: MessageCircleQuestionMark,
  faqs: MessageCircleQuestionMark,
  button: MousePointerClick,
  divider: SeparatorHorizontal,
};
const labelOf = (type: string) =>
  blockCatalog.find((b) => b.type === type)?.label ?? (type === 'h4' || type === 'h5' ? 'Small heading' : type);

/** Article body editor: a vertical list of blocks with an “add” toolbar. */
export default function BlockEditor({
  blocks,
  onChange,
  assets,
  links,
  disabled,
  focus,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  assets: Asset[];
  links: SiteLink[];
  disabled?: boolean;
  focus?: { path: string; tick: number };
}) {
  // Where the “add” menu is open: an index to insert at, or null for none.
  const [menuAt, setMenuAt] = useState<number | null>(null);
  const set = (i: number, patch: Partial<Block>) =>
    onChange(
      blocks.map((b, j) => {
        if (j !== i) return b;
        const next = { ...b, ...patch };
        // Switching a block to "FAQ" gives it starter categories and questions.
        if (next.type === 'faqs' && !next.items) return { ...newFaqBlock(), text: next.text || newFaqBlock().text };
        return next;
      }),
    );
  /** Turns a run of old single-question FAQ blocks into one category FAQ block. */
  const convertFaqRun = (i: number) => {
    let start = i;
    let end = i;
    while (blocks[start - 1]?.type === 'faq') start--;
    while (blocks[end + 1]?.type === 'faq') end++;
    const items = blocks.slice(start, end + 1).map((b) => ({ ...emptyItem(), title: b.text, body: b.extra ?? '', group: 'General' }));
    const next = [...blocks];
    next.splice(start, end - start + 1, { type: 'faqs', text: 'Frequently asked questions', items });
    onChange(next);
  };
  const insert = (at: number, type: string) => {
    const next = [...blocks];
    next.splice(at, 0, type === 'faqs' ? newFaqBlock() : {
      type,
      text: '',
      ...(type === 'button' ? { extra: '/contact', text: 'Contact us' } : {}),
    });
    onChange(next);
    setMenuAt(null);
  };
  const move = (i: number, d: number) => {
    const next = [...blocks];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  const addMenu = (at: number) => (
    <div className="cms-block-menu">
      {blockCatalog.map((b) => {
        const Icon = icons[b.type];
        return (
          <button type="button" key={b.type} title={b.hint} onClick={() => insert(at, b.type)} disabled={disabled}>
            <Icon size={15} />
            <span>{b.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="cms-blocks">
      {blocks.length === 0 && <p className="cms-hint">This article is empty. Add a paragraph, heading, image or FAQ below.</p>}
      {blocks.map((b, i) => {
        const Icon = icons[b.type] ?? Pilcrow;
        return (
          <div key={i} data-edit-path={`b:${i}`} className={`cms-block cms-block-${b.type}`}>
            <div className="cms-block-head">
              <Icon size={13} />
              <select
                value={b.type}
                aria-label="Block type"
                onChange={(e) => set(i, { type: e.target.value })}
                disabled={disabled}
              >
                {blockCatalog.map((c) => (
                  <option key={c.type} value={c.type}>
                    {c.label}
                  </option>
                ))}
                {(b.type === 'h4' || b.type === 'h5') && <option value={b.type}>{labelOf(b.type)}</option>}
                {b.type === 'faq' && <option value="faq">Single question (old style)</option>}
              </select>
              <span className="cms-block-actions">
                <button type="button" title="Move up" disabled={disabled || i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={12} />
                </button>
                <button type="button" title="Move down" disabled={disabled || i === blocks.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={12} />
                </button>
                <button
                  type="button"
                  title="Duplicate"
                  disabled={disabled}
                  onClick={() => {
                    const next = [...blocks];
                    next.splice(i + 1, 0, { ...b });
                    onChange(next);
                  }}
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  title="Delete"
                  className="danger"
                  disabled={disabled}
                  onClick={() => onChange(blocks.filter((_, j) => j !== i))}
                >
                  <Trash size={12} />
                </button>
              </span>
            </div>

            {b.type === 'img' ? (
              <>
                <ImageField label="Image" value={b.text} onChange={(text) => set(i, { text })} assets={assets} disabled={disabled} />
                <label className="cms-field" data-edit-path={`b:${i}:extra`}>
                  Caption / description
                  <input value={b.extra ?? ''} onChange={(e) => set(i, { extra: e.target.value })} />
                </label>
              </>
            ) : b.type === 'faqs' ? (
              <>
                <label className="cms-field">
                  FAQ heading (optional)
                  <input value={b.text} onChange={(e) => set(i, { text: e.target.value })} />
                </label>
                <FaqEditor items={b.items ?? []} onChange={(items) => set(i, { items })} pathPrefix={`b:${i}:`} focus={focus} />
              </>
            ) : b.type === 'faq' ? (
              <>
                <label className="cms-field">
                  Question
                  <input value={b.text} onChange={(e) => set(i, { text: e.target.value })} />
                </label>
                <label className="cms-field" data-edit-path={`b:${i}:extra`}>
                  Answer
                  <textarea rows={3} value={b.extra ?? ''} onChange={(e) => set(i, { extra: e.target.value })} />
                </label>
                <button type="button" className="cms-add-wide cms-add-faq" disabled={disabled} onClick={() => convertFaqRun(i)}>
                  Convert to FAQ with categories
                </button>
              </>
            ) : b.type === 'button' ? (
              <>
                <label className="cms-field">
                  Button text
                  <input value={b.text} onChange={(e) => set(i, { text: e.target.value })} />
                </label>
                <LinkField label="Button link" value={b.extra ?? ''} links={links} onChange={(extra) => set(i, { extra })} />
              </>
            ) : b.type === 'divider' ? (
              <hr className="cms-block-divider" />
            ) : (
              <textarea
                className={`cms-block-text cms-block-text-${b.type}`}
                aria-label={labelOf(b.type)}
                rows={b.type === 'p' || b.type === 'quote' ? 3 : 1}
                placeholder={b.type.startsWith('h') ? 'Heading text' : 'Start typing…'}
                value={b.text}
                onChange={(e) => set(i, { text: e.target.value })}
              />
            )}

            <button
              type="button"
              className="cms-add-between"
              onClick={() => setMenuAt(menuAt === i + 1 ? null : i + 1)}
              disabled={disabled}
            >
              <Plus size={12} /> {menuAt === i + 1 ? 'Cancel' : 'Insert below'}
            </button>
            {menuAt === i + 1 && addMenu(i + 1)}
          </div>
        );
      })}
      <div className="cms-block-add">
        <strong>Add to the end of the article</strong>
        {addMenu(blocks.length)}
      </div>
    </div>
  );
}
