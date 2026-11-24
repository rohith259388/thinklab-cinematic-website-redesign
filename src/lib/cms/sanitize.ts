import sanitizeHtml from 'sanitize-html';

/**
 * Server-safe and client-safe HTML sanitizer for article content.
 * Enforces strict tag and attribute whitelists, safe URL protocols,
 * and restricts iframes exclusively to YouTube and Vimeo.
 */
export function sanitizeArticleHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'b', 'i', 'strong', 'em', 'u', 'strike', 's', 'del',
      'ul', 'ol', 'li', 'blockquote', 'hr', 'br',
      'img', 'figure', 'figcaption',
      'iframe', 'video', 'source',
      'div', 'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class', 'data-type'],
      img: ['src', 'alt', 'title', 'width', 'height', 'class', 'loading'],
      iframe: [
        'src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen',
        'title', 'class', 'data-type', 'data-video',
      ],
      video: ['src', 'controls', 'width', 'height', 'poster', 'class'],
      source: ['src', 'type'],
      div: ['class', 'data-*'],
      span: ['class', 'data-*'],
      figure: ['class'],
      figcaption: ['class'],
      p: ['class'],
      h1: ['class'],
      h2: ['class'],
      h3: ['class'],
      h4: ['class'],
      h5: ['class'],
      h6: ['class'],
      blockquote: ['class'],
    },
    allowedIframeHostnames: [
      'www.youtube.com',
      'youtube.com',
      'www.youtube-nocookie.com',
      'player.vimeo.com',
      'vimeo.com',
    ],
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === '_blank') {
          attribs.rel = 'noopener noreferrer';
        }
        return { tagName, attribs };
      },
      iframe: (tagName, attribs) => {
        // Enforce secure attributes on allowed iframes
        attribs.allowfullscreen = 'true';
        if (!attribs.class) {
          attribs.class = 'rich-video-iframe';
        }
        return { tagName, attribs };
      },
    },
  });
}
