'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash } from 'lucide-react';
import type { SectionItem } from '@/lib/cms/schema';
import { emptyItem, faqGroups, flattenFaqGroups } from '@/lib/cms/blocks';

type Group = { name: string; items: SectionItem[] };

/** Category → questions editor for the FAQ section. */
export default function FaqEditor({
  items,
  onChange,
  pathPrefix = '',
  focus,
}: {
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
  /** Prefix of preview edit paths, e.g. "s:<section id>:" or "b:<block index>:". */
  pathPrefix?: string;
  focus?: { path: string; tick: number };
}) {
  const grouped = faqGroups(items);
  const groups: Group[] = grouped.map((g) => ({
    name: g.name,
    items: g.questions.map((q) => q.item),
  }));
  // Position of each question in the stored list, which preview clicks refer to.
  const flatIndex = (gi: number, qi: number) => grouped[gi]?.questions[qi]?.index ?? -1;
  const [openGroup, setOpenGroup] = useState<number | null>(0);
  // Open question as "group:index".
  const [openQ, setOpenQ] = useState<string | null>(null);
  // A click on a question or answer in the preview opens it here.
  const [seenTick, setSeenTick] = useState(0);
  if (focus && focus.tick !== seenTick) {
    setSeenTick(focus.tick);
    if (pathPrefix && focus.path.startsWith(pathPrefix + 'items:')) {
      const k = Number(focus.path.slice(pathPrefix.length).split(':')[1]);
      grouped.forEach((g, gi) =>
        g.questions.forEach((q, qi) => {
          if (q.index === k) {
            setOpenGroup(gi);
            setOpenQ(`${gi}:${qi}`);
          }
        }),
      );
    }
  }

  const commit = (next: Group[]) => onChange(flattenFaqGroups(next));
  const setGroup = (gi: number, patch: Partial<Group>) =>
    commit(groups.map((g, j) => (j === gi ? { ...g, ...patch } : g)));
  const swap = <T,>(list: T[], a: number, b: number) => {
    const next = [...list];
    [next[a], next[b]] = [next[b], next[a]];
    return next;
  };
  const newQuestion = (): SectionItem => ({ ...emptyItem(), title: 'New question?', body: 'Write the answer here.' });

  return (
    <div className="cms-faq-editor">
      <div className="cms-items-head">
        <strong>
          Categories ({groups.length}) · Questions ({items.length})
        </strong>
        <small>Visitors pick a category, then open a question to read the answer.</small>
      </div>

      {groups.map((g, gi) => {
        const open = openGroup === gi;
        return (
          <div key={gi} className={`cms-faq-group ${open ? 'open' : ''}`}>
            <div className="cms-item-row">
              <button type="button" className="cms-item-toggle" onClick={() => setOpenGroup(open ? null : gi)}>
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>
                  <strong>{g.name || 'General'}</strong> · {g.items.length} question{g.items.length === 1 ? '' : 's'}
                </span>
              </button>
              <button type="button" title="Move category up" disabled={gi === 0} onClick={() => { commit(swap(groups, gi, gi - 1)); setOpenGroup(gi - 1); }}>
                <ArrowUp size={13} />
              </button>
              <button type="button" title="Move category down" disabled={gi === groups.length - 1} onClick={() => { commit(swap(groups, gi, gi + 1)); setOpenGroup(gi + 1); }}>
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                title="Delete category"
                className="danger"
                onClick={() => {
                  if (confirm(`Delete the “${g.name || 'General'}” category and its ${g.items.length} question(s)?`))
                    commit(groups.filter((_, j) => j !== gi));
                }}
              >
                <Trash size={13} />
              </button>
            </div>

            {open && (
              <div className="cms-item-body">
                <label className="cms-field">
                  Category name
                  <input
                    value={g.name}
                    placeholder="e.g. Pricing"
                    onChange={(e) => setGroup(gi, { name: e.target.value })}
                  />
                </label>

                {g.items.map((q, qi) => {
                  const key = `${gi}:${qi}`;
                  const qOpen = openQ === key;
                  const setQ = (patch: Partial<SectionItem>) =>
                    setGroup(gi, { items: g.items.map((x, j) => (j === qi ? { ...x, ...patch } : x)) });
                  return (
                    <div
                      key={qi}
                      data-edit-path={pathPrefix ? `${pathPrefix}items:${flatIndex(gi, qi)}` : undefined}
                      className={`cms-item ${qOpen ? 'open' : ''}`}
                    >
                      <div className="cms-item-row">
                        <button type="button" className="cms-item-toggle" onClick={() => setOpenQ(qOpen ? null : key)}>
                          {qOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span>{q.title || `Question ${qi + 1}`}</span>
                        </button>
                        <button type="button" title="Move up" disabled={qi === 0} onClick={() => { setGroup(gi, { items: swap(g.items, qi, qi - 1) }); setOpenQ(`${gi}:${qi - 1}`); }}>
                          <ArrowUp size={13} />
                        </button>
                        <button type="button" title="Move down" disabled={qi === g.items.length - 1} onClick={() => { setGroup(gi, { items: swap(g.items, qi, qi + 1) }); setOpenQ(`${gi}:${qi + 1}`); }}>
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          title="Delete question"
                          className="danger"
                          onClick={() => {
                            if (!confirm('Delete this question?')) return;
                            if (g.items.length === 1) commit(groups.filter((_, j) => j !== gi));
                            else setGroup(gi, { items: g.items.filter((_, j) => j !== qi) });
                          }}
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                      {qOpen && (
                        <div className="cms-item-body">
                          <label
                            className="cms-field"
                            data-edit-path={pathPrefix ? `${pathPrefix}items:${flatIndex(gi, qi)}:title` : undefined}
                          >
                            Question
                            <input value={q.title} onChange={(e) => setQ({ title: e.target.value })} />
                          </label>
                          <label
                            className="cms-field"
                            data-edit-path={pathPrefix ? `${pathPrefix}items:${flatIndex(gi, qi)}:body` : undefined}
                          >
                            Answer
                            <textarea rows={4} value={q.body} onChange={(e) => setQ({ body: e.target.value })} />
                          </label>
                          <button
                            type="button"
                            className="cms-add-between"
                            onClick={() => {
                              const next = [...g.items];
                              next.splice(qi + 1, 0, newQuestion());
                              setGroup(gi, { items: next });
                              setOpenQ(`${gi}:${qi + 1}`);
                            }}
                          >
                            <Plus size={12} /> Insert question below
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="cms-add-wide"
                  disabled={items.length >= 200}
                  onClick={() => {
                    setGroup(gi, { items: [...g.items, newQuestion()] });
                    setOpenQ(`${gi}:${g.items.length}`);
                  }}
                >
                  <Plus size={14} /> Add question to “{g.name || 'General'}”
                </button>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        className="cms-add-wide cms-add-faq"
        disabled={items.length >= 200}
        onClick={() => {
          const taken = new Set(groups.map((g) => g.name));
          let name = 'New category';
          for (let n = 2; taken.has(name); n++) name = `New category ${n}`;
          commit([...groups, { name, items: [newQuestion()] }]);
          setOpenGroup(groups.length);
          setOpenQ(`${groups.length}:0`);
        }}
      >
        <Plus size={15} /> Add category
      </button>
    </div>
  );
}
