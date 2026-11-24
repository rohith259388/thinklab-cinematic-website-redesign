import type { Block } from './schema';

/**
 * Converts legacy block arrays into clean, semantic HTML in original order.
 * This migration is completely non-destructive and preserves original blocks
 * as a backup.
 */
export function blocksToHtml(blocks: Block[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';
  const htmlParts: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b) continue;

    if (b.type === 'li' || b.type === 'ol') {
      const isOrdered = b.type === 'ol';
      const listItems: string[] = [`<li>${escapeHtml(b.text)}</li>`];
      while (blocks[i + 1]?.type === b.type) {
        i++;
        listItems.push(`<li>${escapeHtml(blocks[i].text)}</li>`);
      }
      const tag = isOrdered ? 'ol' : 'ul';
      htmlParts.push(`<${tag}>${listItems.join('')}</${tag}>`);
    } else if (b.type === 'h2' || b.type === 'h3' || b.type === 'h4' || b.type === 'h5') {
      const tag = b.type === 'h4' || b.type === 'h5' ? 'h3' : b.type;
      htmlParts.push(`<${tag}>${escapeHtml(b.text)}</${tag}>`);
    } else if (b.type === 'quote') {
      htmlParts.push(`<blockquote>${escapeHtml(b.text)}</blockquote>`);
    } else if (b.type === 'divider') {
      htmlParts.push('<hr />');
    } else if (b.type === 'img') {
      if (b.text) {
        const caption = b.extra ? `<figcaption>${escapeHtml(b.extra)}</figcaption>` : '';
        htmlParts.push(
          `<figure><img src="${escapeHtml(b.text)}" alt="${escapeHtml(b.extra || '')}" loading="lazy" />${caption}</figure>`
        );
      }
    } else if (b.type === 'button') {
      if (b.text) {
        const href = b.extra || '/contact';
        htmlParts.push(
          `<p><a href="${escapeHtml(href)}" class="btn-drop px-7 py-4">${escapeHtml(b.text)}</a></p>`
        );
      }
    } else if (b.type === 'faq' || b.type === 'faqs') {
      if (b.type === 'faqs' && Array.isArray(b.items)) {
        htmlParts.push(`<h3>${escapeHtml(b.text || 'Frequently asked questions')}</h3>`);
        for (const item of b.items) {
          htmlParts.push(`<h4>${escapeHtml(item.title)}</h4>`);
          htmlParts.push(`<p>${escapeHtml(item.body)}</p>`);
        }
      } else if (b.type === 'faq') {
        htmlParts.push(`<h4>${escapeHtml(b.text)}</h4>`);
        if (b.extra) htmlParts.push(`<p>${escapeHtml(b.extra)}</p>`);
      }
    } else {
      // Paragraph(s)
      const paras = b.text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0);
      if (paras.length > 1) {
        for (const p of paras) {
          htmlParts.push(`<p>${escapeHtml(p)}</p>`);
        }
      } else if (b.text.trim()) {
        htmlParts.push(`<p>${escapeHtml(b.text)}</p>`);
      }
    }
  }

  return htmlParts.join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
