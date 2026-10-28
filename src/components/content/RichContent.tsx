import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import type { ContentBlock } from '@/lib/live';

const localLinks: Record<string, string> = { '/projects': '/projects', '/case-studies': '/projects', '/services': '/services', '/contact-us': '/contact', '/about-us': '/about', '/blogs': '/blog' };
function linkedText(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
    if (!part.startsWith('http')) return part;
    const clean = part.replace(/[.,)]+$/, '');
    let href = clean;
    try { const url = new URL(clean); if (url.hostname.includes('thinklabdigitalsolutions.com') && localLinks[url.pathname]) href = localLinks[url.pathname]; } catch { return part; }
    return <Fragment key={i}><Link className="underline decoration-[#c5b0ff] underline-offset-4 break-words" href={href}>{href.startsWith('/') ? 'Explore Thinklab' : clean}</Link>{part.slice(clean.length)}</Fragment>;
  });
}
export default function RichContent({ blocks }: { blocks: ContentBlock[] }) {
  const result: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'li') {
      const list = [b];
      while (blocks[i + 1]?.type === 'li') list.push(blocks[++i]);
      result.push(<ul key={i}>{list.map((item, j) => <li key={j}>{linkedText(item.text)}</li>)}</ul>);
    } else if (b.type === 'h2' || b.type === 'h3') result.push(<h2 key={i}>{linkedText(b.text)}</h2>);
    else if (b.type === 'h4' || b.type === 'h5') result.push(<h3 key={i}>{linkedText(b.text)}</h3>);
    else result.push(<p key={i}>{linkedText(b.text)}</p>);
  }
  return <div className="rich-copy">{result}</div>;
}
