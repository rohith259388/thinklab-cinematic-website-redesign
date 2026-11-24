/**
 * Auto-layout for long-form CMS content.
 *
 * Editors paste plain copy — "•" bullets, "1." points, "Label: value" lines, a short title
 * followed by its description. This module reads that copy (from the rich-text editor's HTML
 * or from legacy blocks) and recognises those patterns, so the page can present them as
 * cards, stat tiles, fact tables, step timelines and quote cards instead of a wall of text.
 *
 * Pure and deterministic: the same content always produces the same layout, on the server and
 * in the browser. Nothing is invented — every word on the page is the editor's own.
 */

/** A piece of editor text. `html` (already sanitized) keeps inline links/bold; `src` is the block index for click-to-edit. */
export type Inline = { text: string; html?: string; src?: number };
export type CardItem = { title: Inline; body?: Inline };
export type StatItem = { value: string; label: Inline; body?: Inline };

export type Section<B = unknown> =
  | { kind: 'p'; c: Inline; lead?: boolean; emphasis?: boolean }
  | { kind: 'note'; label: string; c: Inline }
  | { kind: 'h'; level: 2 | 3; c: Inline; id: string; num?: string; kicker?: Inline }
  | { kind: 'checklist'; items: Inline[]; ordered?: boolean; intro?: Inline }
  | { kind: 'cards'; items: CardItem[]; intro?: Inline }
  | { kind: 'stats'; items: StatItem[]; intro?: Inline }
  | { kind: 'facts'; rows: { key: string; value: Inline }[]; intro?: Inline }
  | { kind: 'steps'; items: CardItem[]; intro?: Inline }
  | { kind: 'quotes'; items: { quote: Inline; name: string; role?: string }[]; intro?: Inline }
  | { kind: 'callout'; title: Inline; body?: Inline }
  | { kind: 'raw'; html: string }
  | { kind: 'block'; block: B };

export type TocEntry = { id: string; title: string; num?: string };
export type StructuredDoc<B = unknown> = { sections: Section<B>[]; toc: TocEntry[] };

/** Flat reading-order unit the pattern matcher works on. */
type Node<B> =
  | { tag: 'p'; c: Inline }
  | { tag: 'h'; level: 2 | 3; c: Inline }
  | { tag: 'li'; c: Inline; list: number; ordered: boolean }
  | { tag: 'raw'; html: string }
  | { tag: 'block'; block: B };

/* ───────────────────────── text helpers ───────────────────────── */

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', bull: '•' };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
export const plain = (html: string) => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const BULLET = /^\s*[•*·▪●◦‣–-]\s+(?=\S)/;
const NUMBERED = /^\s*(\d{1,2})[.)]\s+(?=\S)/;
const TERM = /^([^:]{2,60}?):\s+(\S[\s\S]*)$/;
const KV = /^([A-Z][\w&/'’().\- ]{1,28}):\s+(\S.{0,90})$/;
const STAT = /^([₹$€£]?\d[\d,.]*\s*(?:%|\+|x|k|m|cr|lakh|L)?\+?)\s+(.+)$/i;
const EXAMPLE = /^(for example|for instance|example|e\.g\.)\b[,:]?\s*/i;
const PROCESS = /\b(process|stages?|steps?|how we work|approach|roadmap|journey|phases?)\b/i;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
/** Reads like a title: short, no sentence punctuation at the end, starts with a capital/number. */
const titleLike = (s: string, max = 80) =>
  s.length >= 3 && s.length <= max && words(s) <= 12 && !/[.!?:;,…]$/.test(s) && /^[\p{Lu}\d"“‘'(]/u.test(s) && !BULLET.test(s);

/** Remove a leading marker (bullet / number) from both the plain text and the HTML. */
function stripLead(c: Inline, re: RegExp): Inline {
  const text = c.text.replace(re, '');
  if (!c.html) return { ...c, text };
  const html = c.html.replace(new RegExp(`^((?:\\s*<[^>]+>)*)${re.source.replace(/^\^/, '')}`), '$1');
  return { ...c, text, html };
}

/** Split "Term: description" at the first colon outside of tags, keeping the body's inline HTML. */
function splitTerm(c: Inline): { title: Inline; body: Inline } | null {
  const m = c.text.match(TERM);
  if (!m) return null;
  const title: Inline = { text: m[1].trim(), src: c.src };
  let body: Inline = { text: m[2].trim(), src: c.src };
  if (c.html) {
    let inTag = false;
    for (let i = 0; i < c.html.length; i++) {
      const ch = c.html[i];
      if (ch === '<') inTag = true;
      else if (ch === '>') inTag = false;
      else if (ch === ':' && !inTag) {
        const rest = c.html.slice(i + 1).replace(/^(\s*<\/[a-z0-9]+>)+/i, '').trim();
        body = { ...body, html: rest };
        break;
      }
    }
  }
  return { title, body };
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';

/* ───────────────────────── HTML → nodes ───────────────────────── */

const VOID = new Set(['br', 'img', 'hr', 'source', 'wbr', 'input', 'meta', 'link', 'col']);
const INLINE = new Set(['#text', 'a', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'span', 'br', 'code', 'small', 'sup', 'sub', 'mark']);
type El = { tag: string; outer: string; inner: string };

/** Top-level elements of well-formed (sanitized) HTML. */
function topLevel(html: string): El[] {
  const out: El[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let depth = 0;
  let start = 0;
  let innerStart = 0;
  let tag = '';
  let last = 0;
  let m: RegExpExecArray | null;
  const text = (s: string) => {
    if (s.trim()) out.push({ tag: '#text', outer: s, inner: s });
  };
  while ((m = re.exec(html))) {
    const name = m[1].toLowerCase();
    const closing = m[0][1] === '/';
    const selfClose = VOID.has(name) || m[0].endsWith('/>');
    if (depth === 0) {
      text(html.slice(last, m.index));
      last = re.lastIndex;
      if (closing) continue;
      if (selfClose) {
        out.push({ tag: name, outer: m[0], inner: '' });
        continue;
      }
      tag = name;
      start = m.index;
      innerStart = re.lastIndex;
      depth = 1;
      continue;
    }
    if (selfClose) continue;
    if (closing) {
      if (--depth === 0) {
        out.push({ tag, outer: html.slice(start, re.lastIndex), inner: html.slice(innerStart, m.index) });
        last = re.lastIndex;
      }
    } else depth++;
  }
  if (depth === 0) text(html.slice(last));
  else out.push({ tag, outer: html.slice(start), inner: html.slice(innerStart) }); // unclosed tail
  return out;
}

/** Merge runs of inline top-level content into paragraphs. */
function groupInline(els: El[]): El[] {
  const out: El[] = [];
  let buf = '';
  const flush = () => {
    if (buf.trim()) out.push({ tag: 'p', outer: `<p>${buf}</p>`, inner: buf });
    buf = '';
  };
  for (const el of els) {
    if (INLINE.has(el.tag)) buf += el.outer;
    else {
      flush();
      out.push(el);
    }
  }
  flush();
  return out;
}

const unwrapP = (inner: string) => {
  const ps = topLevel(inner);
  if (ps.length && ps.every((e) => e.tag === 'p' || (e.tag === '#text' && !e.inner.trim())))
    return ps.filter((e) => e.tag === 'p').map((e) => e.inner).join('<br>');
  return inner;
};

function htmlNodes<B>(html: string, nodes: Node<B>[] = [], counter = { list: 0 }): Node<B>[] {
  for (const el of groupInline(topLevel(html))) {
    switch (el.tag) {
      case 'p': {
        // One paragraph holding several "•"/"1." lines separated by <br> → one node per line.
        const lines = el.inner.split(/<br\s*\/?>/i).filter((l) => plain(l));
        const listy = lines.filter((l) => BULLET.test(plain(l)) || NUMBERED.test(plain(l)) || KV.test(plain(l))).length;
        const parts = lines.length > 1 && listy >= Math.ceil(lines.length / 2) ? lines : [el.inner];
        for (const part of parts) {
          const text = plain(part);
          if (text) nodes.push({ tag: 'p', c: { text, html: part.trim() } });
        }
        break;
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const text = plain(el.inner);
        if (text) nodes.push({ tag: 'h', level: el.tag <= 'h3' ? 2 : 3, c: { text, html: el.inner } });
        break;
      }
      case 'ul':
      case 'ol': {
        const list = ++counter.list;
        for (const li of topLevel(el.inner)) {
          if (li.tag !== 'li') continue;
          const inner = unwrapP(li.inner);
          const text = plain(inner);
          if (text) nodes.push({ tag: 'li', c: { text, html: inner }, list, ordered: el.tag === 'ol' });
        }
        break;
      }
      case 'div':
        if (/class="[^"]*(video|embed|cms-)/.test(el.outer.slice(0, 200))) nodes.push({ tag: 'raw', html: el.outer });
        else htmlNodes(el.inner, nodes, counter);
        break;
      default:
        nodes.push({ tag: 'raw', html: el.outer });
    }
  }
  return nodes;
}

/* ───────────────────────── blocks → nodes ───────────────────────── */

export type SourceBlock = { type: string; text: string; i?: number };

function blockNodes<B extends SourceBlock>(blocks: B[]): Node<B>[] {
  const nodes: Node<B>[] = [];
  let list = 0;
  let prev = '';
  for (const b of blocks) {
    const src = b.i;
    if (b.type === 'li' || b.type === 'ol') {
      if (prev !== b.type) list++;
      nodes.push({ tag: 'li', c: { text: b.text.trim(), src }, list, ordered: b.type === 'ol' });
    } else if (b.type === 'h2' || b.type === 'h3' || b.type === 'h4' || b.type === 'h5') {
      if (b.text.trim()) nodes.push({ tag: 'h', level: b.type === 'h2' || b.type === 'h3' ? 2 : 3, c: { text: b.text.trim(), src } });
    } else if (b.type === 'p') {
      for (const para of b.text.split(/\r?\n\s*\r?\n/)) {
        const lines = para.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const listy = lines.filter((l) => BULLET.test(l) || NUMBERED.test(l) || KV.test(l)).length;
        const parts = lines.length > 1 && listy >= Math.ceil(lines.length / 2) ? lines : [lines.join(' ')];
        for (const text of parts) if (text) nodes.push({ tag: 'p', c: { text, src } });
      }
    } else nodes.push({ tag: 'block', block: b });
    prev = b.type;
  }
  return nodes;
}

/* ───────────────────────── pattern matching ───────────────────────── */

type PKind = 'bullet' | 'numbered' | 'kv' | 'title' | 'plain';
const kindOf = (text: string): PKind =>
  BULLET.test(text) ? 'bullet' : NUMBERED.test(text) ? 'numbered' : KV.test(text) ? 'kv' : titleLike(text) ? 'title' : 'plain';

/** Decide how a run of list items is best shown. */
function listSection<B>(raw: Inline[], ordered: boolean): Section<B> {
  const items = raw.map((c) => stripLead(stripLead(c, BULLET), NUMBERED));
  // Testimonials pasted as list items: quote, name, role, quote, name, role…
  if (items.length >= 3 && items.length % 3 === 0) {
    const triples = [];
    for (let i = 0; i < items.length; i += 3) triples.push(items.slice(i, i + 3));
    if (triples.every(([q, n, r]) => q.text.length > 50 && n.text.length <= 40 && !/[.!?]$/.test(n.text) && r.text.length <= 100))
      return { kind: 'quotes', items: triples.map(([q, n, r]) => ({ quote: q, name: n.text, role: r.text })) };
  }
  const terms = items.map(splitTerm);
  const termed = terms.filter((t) => t && t.title.text.length <= 60 && words(t.title.text) <= 8).length;
  if (items.length >= 2 && termed >= Math.ceil(items.length * 0.6)) {
    const pairs = items.map((c, i) => terms[i] ?? { title: c, body: undefined });
    const stats = pairs.map((p) => p.title.text.match(STAT));
    if (stats.every(Boolean))
      return {
        kind: 'stats',
        items: pairs.map((p, i) => ({ value: stats[i]![1].trim(), label: { text: stats[i]![2].trim(), src: p.title.src }, body: p.body })),
      };
    return ordered ? { kind: 'steps', items: pairs } : { kind: 'cards', items: pairs };
  }
  return { kind: 'checklist', items, ordered };
}

const isText = <B>(n: Node<B> | undefined): n is Extract<Node<B>, { tag: 'p' }> => n?.tag === 'p';
const isHead = <B>(n: Node<B> | undefined): n is Extract<Node<B>, { tag: 'h' }> => n?.tag === 'h';

export function structureNodes<B>(nodes: Node<B>[]): StructuredDoc<B> {
  const out: Section<B>[] = [];
  const ids = new Map<string, number>();
  const toc: TocEntry[] = [];
  let seenHeading = false;
  let leadDone = false;

  const heading = (c: Inline, level: 2 | 3, num?: string, kicker?: Inline) => {
    const base = slugify(c.text);
    const n = ids.get(base) ?? 0;
    ids.set(base, n + 1);
    const id = n ? `${base}-${n + 1}` : base;
    out.push({ kind: 'h', level, c, id, num, kicker });
    if (level === 2) toc.push({ id, title: c.text, num });
    seenHeading = true;
  };
  /** A "Some examples include:" line right before a group becomes that group's caption. */
  const group = (s: Section<B>) => {
    const prev = out[out.length - 1];
    if (prev?.kind === 'p' && !prev.lead && /:$/.test(prev.c.text) && prev.c.text.length <= 160) {
      out.pop();
      (s as { intro?: Inline }).intro = prev.c;
    }
    out.push(s);
  };

  const textAt = (k: number) => {
    const x = nodes[k];
    return x?.tag === 'p' ? x.c.text : undefined;
  };

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];

    if (n.tag === 'li') {
      const run = [n.c];
      while (nodes[i + 1]?.tag === 'li' && (nodes[i + 1] as typeof n).list === n.list) run.push((nodes[++i] as typeof n).c);
      group(listSection(run, n.ordered));
      continue;
    }

    if (n.tag === 'h') {
      // Heading + one paragraph, three or more times in a row → a card grid (or steps for a process).
      const pairs: CardItem[] = [];
      let j = i;
      while (isHead(nodes[j]) && isText(nodes[j + 1]) && kindOf(textAt(j + 1)!) === 'plain' && !isText(nodes[j + 2])) {
        pairs.push({ title: (nodes[j] as typeof n).c, body: (nodes[j + 1] as Extract<Node<B>, { tag: 'p' }>).c });
        j += 2;
      }
      if (pairs.length >= 3) {
        const prev = out[out.length - 1];
        const process = prev?.kind === 'h' && PROCESS.test(prev.c.text);
        out.push(process ? { kind: 'steps', items: pairs } : { kind: 'cards', items: pairs });
        i = j - 1;
        continue;
      }
      heading(n.c, n.level);
      continue;
    }

    if (n.tag !== 'p') {
      out.push(n.tag === 'raw' ? { kind: 'raw', html: n.html } : { kind: 'block', block: n.block });
      continue;
    }

    const text = n.c.text;
    const kind = kindOf(text);
    const next = nodes[i + 1];

    if (kind === 'bullet') {
      const run = [n.c];
      while (isText(nodes[i + 1]) && kindOf(textAt(i + 1)!) === 'bullet') run.push((nodes[++i] as typeof n).c);
      group(listSection(run, false));
      continue;
    }

    if (kind === 'numbered') {
      const run = [n.c];
      while (isText(nodes[i + 1]) && kindOf(textAt(i + 1)!) === 'numbered') run.push((nodes[++i] as typeof n).c);
      if (run.length >= 2) {
        group(listSection(run, true));
        continue;
      }
      // A lone "3. Short Title" followed by prose is a numbered chapter heading.
      const stripped = stripLead(n.c, NUMBERED);
      if (titleLike(stripped.text, 110) && isText(next)) {
        heading(stripped, 2, text.match(NUMBERED)![1].padStart(2, '0'));
        continue;
      }
    }

    if (kind === 'kv') {
      const run = [n.c];
      while (isText(nodes[i + 1]) && kindOf(textAt(i + 1)!) === 'kv') run.push((nodes[++i] as typeof n).c);
      if (run.length >= 2) {
        group({ kind: 'facts', rows: run.map((c) => ({ key: splitTerm(c)!.title.text, value: splitTerm(c)!.body })) });
        continue;
      }
    }

    if (kind === 'title') {
      // Short title + its description, two or more times → cards.
      const pairs: CardItem[] = [];
      let j = i;
      while (
        isText(nodes[j]) &&
        kindOf(textAt(j)!) === 'title' &&
        isText(nodes[j + 1]) &&
        kindOf(textAt(j + 1)!) === 'plain' &&
        textAt(j + 1)!.length > 40 &&
        !(isText(nodes[j + 2]) && kindOf(textAt(j + 2)!) === 'plain')
      ) {
        pairs.push({ title: (nodes[j] as typeof n).c, body: (nodes[j + 1] as typeof n).c });
        j += 2;
      }
      if (pairs.length >= 2) {
        group({ kind: 'cards', items: pairs });
        i = j - 1;
        continue;
      }
      if (isHead(next)) {
        // A small label right above a heading becomes that heading's kicker.
        const h = nodes[++i] as Extract<Node<B>, { tag: 'h' }>;
        heading(h.c, h.level, undefined, n.c);
        continue;
      }
      if (isText(next) && (seenHeading || leadDone) && words(text) >= 3) {
        heading(n.c, 2);
        continue;
      }
    }

    // A question near the end, with its answer → a closing call-out.
    if (/\?$/.test(text) && text.length <= 180 && i >= nodes.length - 3 && seenHeading) {
      const body = isText(next) && kindOf(next.c.text) === 'plain' ? next.c : undefined;
      if (body) i++;
      out.push({ kind: 'callout', title: n.c, body });
      continue;
    }

    // "For example, …" → an example card that breaks up the prose.
    if (EXAMPLE.test(text) && text.length > 60 && seenHeading) {
      out.push({ kind: 'note', label: 'Example', c: n.c });
      continue;
    }

    // A short, single-sentence statement between paragraphs reads as a highlight.
    const prevS = out[out.length - 1];
    if (
      seenHeading &&
      text.length <= 80 &&
      words(text) >= 4 &&
      /\.$/.test(text) &&
      !/\.\s/.test(text.slice(0, -1)) &&
      prevS?.kind === 'p' &&
      !prevS.emphasis &&
      isText(next) &&
      kindOf(next.c.text) === 'plain' &&
      !/:$/.test(next.c.text)
    ) {
      out.push({ kind: 'p', c: n.c, emphasis: true });
      continue;
    }

    const lead = !leadDone && !seenHeading && text.length > 80;
    leadDone = leadDone || text.length > 80;
    out.push({ kind: 'p', c: n.c, lead });
  }
  return { sections: out, toc };
}

/** Structure the editor's HTML (preferred) or the legacy block list. */
export function structureContent<B extends SourceBlock>(blocks: B[], html?: string, sanitize?: (h: string) => string): StructuredDoc<B> {
  if (html && html.trim()) return structureNodes<B>(htmlNodes<B>(sanitize ? sanitize(html) : html));
  return structureNodes<B>(blockNodes(blocks));
}
