'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { sectionTypes, type SectionType } from '@/lib/cms/schema';
import { sectionCatalog } from '@/lib/cms/blocks';
import { sectionIcons } from './shared';

const groups = ['Basics', 'Content', 'Social proof', 'Conversion'] as const;

/** Visual “Add a section” library. */
export default function SectionPicker({
  onPick,
  onClose,
}: {
  onPick: (type: SectionType) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="cms-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cms-modal cms-picker" role="dialog" aria-modal="true" aria-label="Add a section">
        <header>
          <div>
            <h2>Add a section</h2>
            <p>Choose a building block. You can change all the text, pictures and colours afterwards.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="cms-picker-body">
          {groups.map((g) => (
            <section key={g}>
              <h3>{g}</h3>
              <div className="cms-picker-grid">
                {sectionTypes
                  .filter((t) => sectionCatalog[t].group === g)
                  .map((t) => {
                    const Icon = sectionIcons[t];
                    return (
                      <button type="button" key={t} onClick={() => onPick(t)}>
                        <Icon size={22} />
                        <strong>{sectionCatalog[t].label}</strong>
                        <small>{sectionCatalog[t].description}</small>
                      </button>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
