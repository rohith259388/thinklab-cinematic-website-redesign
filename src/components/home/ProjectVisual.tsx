import type { CSSProperties } from 'react';

/** Abstract, animated editorial artwork, not screenshots of client websites. */
export default function ProjectVisual({ index }: { index: number }) {
  return (
    <div className={`project-art project-art-${index}`} aria-hidden="true">
      <span className="art-corner">THINKLAB® / SELECTED WORK</span>
      {index === 0 && <><div className="paper-sculpture">{Array.from({ length: 11 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div><div className="art-title paper-title">A fresh<br /><em>perspective.</em></div><span className="art-foot">HREEMKAR PAPERS</span></>}
      {index === 1 && <><div className="elevex-structure"><i /><i /><i /><i /><i /></div><span className="elevex-title">ELEVEX<span>↑</span></span><span className="art-foot">BUILT TO MOVE YOU FORWARD.</span></>}
      {index === 2 && <><div className="orbit-object"><i /><i /><i /></div><div className="art-title geeta-title">Everyday.<br /><em>Extraordinary.</em></div><span className="art-foot">GEETA HOME APPLIANCES</span></>}
      {index === 3 && <><div className="architecture">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div><div className="art-title amara-title">amara<span>one</span></div><span className="art-foot">A DIFFERENT POINT OF VIEW.</span></>}
      <span className="art-marker">+</span>
    </div>
  );
}
