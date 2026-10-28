'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
type Article = { slug: string; title: string; image: string; category: string; date: string };
export default function ArticleLibrary({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(articles.map(a => a.category))];
  const shown = articles.filter(a => (category === 'All' || a.category === category) && `${a.title} ${a.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="editorial-wrap"><div className="editorial-toolbar"><input type="search" aria-label="Search articles" placeholder="Find an idea…" value={query} onChange={e => setQuery(e.target.value)} />{categories.map(c => <button key={c} className="filter-button" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}<p className="article-count" role="status">{shown.length} {shown.length === 1 ? 'article' : 'articles'}</p></div><div className="article-grid">{shown.map(a => <Link key={a.slug} className="article-card" href={`/blog/${a.slug}`}>{a.image && <div className="article-image"><Image src={a.image} alt="" fill sizes="(max-width: 700px) 90vw, (max-width: 900px) 45vw, 30vw" /></div>}<span className="micro-label">{a.category}</span><h2>{a.title}</h2><span className="article-read">{a.date}<span>Read article <ArrowUpRight className="inline ml-2" size={15} /></span></span></Link>)}</div>{!shown.length && <p className="py-20 text-center">No articles found. Try another topic or city.</p>}</div>;
}
