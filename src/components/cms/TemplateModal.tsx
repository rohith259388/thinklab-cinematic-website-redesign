'use client';
import { useState } from 'react';
import type { Kind, Content } from '@/lib/cms/schema';
import {
  buildProjectContent,
  buildBlogContent,
  buildCareerContent,
} from '@/lib/cms/templates';

interface Asset {
  id: string;
  name: string;
  mime: string;
  alt: string;
}

interface TemplateModalProps {
  kind: Kind;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; slug: string; content?: Content }) => Promise<void>;
  assets: Asset[];
  busy: boolean;
}

export default function TemplateModal({
  kind,
  isOpen,
  onClose,
  onSubmit,
  assets,
  busy,
}: TemplateModalProps) {
  // Form States
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(kind === 'blog' ? 'Strategy' : '');
  const [tags, setTags] = useState(kind === 'projects' ? 'Design · Development · Strategy' : '');
  const [image, setImage] = useState(assets[0] ? `/api/cms-media/${assets[0].id}` : '');
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState(
    kind === 'blog'
      ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : kind === 'careers'
        ? 'Immediate'
        : new Date().getFullYear().toString()
  );

  // Project specific
  const [metric1Val, setMetric1Val] = useState('300%');
  const [metric1Lbl, setMetric1Lbl] = useState('Organic Growth');
  const [metric2Val, setMetric2Val] = useState('4.8x');
  const [metric2Lbl, setMetric2Lbl] = useState('Conversion Velocity');
  const [challenge, setChallenge] = useState('');
  const [solution, setSolution] = useState('');
  const [results, setResults] = useState('');
  const [source, setSource] = useState('');

  // Blog specific
  const [intro, setIntro] = useState('');
  const [mainBody, setMainBody] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [conclusion, setConclusion] = useState('');

  // Career specific
  const [location, setLocation] = useState('Vijayawada · Hybrid');
  const [jobType, setJobType] = useState('Full-time');
  const [apply, setApply] = useState('mailto:info@thinklabdigitalsolutions.com');
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');

  const [error, setError] = useState('');

  // Auto-generate slug when title changes
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required.');
      return;
    }

    try {
      setError('');
      let content: Content | undefined;

      if (kind === 'projects') {
        content = buildProjectContent({
          title,
          slug,
          category,
          tags,
          image,
          alt: title,
          summary,
          metric1Value: metric1Val,
          metric1Label: metric1Lbl,
          metric2Value: metric2Val,
          metric2Label: metric2Lbl,
          challenge,
          solution,
          results,
          source,
        });
      } else if (kind === 'blog') {
        content = buildBlogContent({
          title,
          slug,
          category,
          date,
          image,
          alt: title,
          summary,
          intro,
          mainBody,
          keyTakeaways,
          conclusion,
        });
      } else if (kind === 'careers') {
        content = buildCareerContent({
          title,
          slug,
          department: category || 'Engineering',
          location,
          type: jobType,
          date,
          apply,
          summary,
          responsibilities,
          requirements,
          benefits,
        });
      }

      await onSubmit({ title, slug, content });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
    }
  };

  const kindLabel =
    kind === 'projects'
      ? 'New Project Case Study'
      : kind === 'blog'
        ? 'New Insight / Article'
        : kind === 'careers'
          ? 'New Career Opportunity'
          : 'New Page';

  return (
    <div className="cms-modal-overlay" onClick={onClose}>
      <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cms-modal-header">
          <h2>{kindLabel}</h2>
          <button type="button" onClick={onClose} style={{ padding: '4px 8px' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="cms-modal-body">
            {error && (
              <div style={{ color: '#ff8a8a', background: 'rgba(255,0,0,0.15)', padding: '8px 12px', borderRadius: 6 }}>
                {error}
              </div>
            )}

            {/* Standard Identifiers */}
            <div className="cms-form-grid">
              <div className="cms-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clarins E-Commerce Platform"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div className="cms-form-group">
                <label>URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. clarins-ecommerce"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <small>Will be accessible at /{kind}/{slug || '...'}</small>
              </div>
            </div>

            {/* PROJECT TEMPLATE FIELDS */}
            {kind === 'projects' && (
              <>
                <div className="cms-form-grid">
                  <div className="cms-form-group">
                    <label>Industry / Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Real Estate, E-Commerce, Tech"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label>Tags</label>
                    <input
                      type="text"
                      placeholder="e.g. Design · Development · Strategy"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cms-form-grid">
                  <div className="cms-form-group">
                    <label>Cover Image</label>
                    {assets.length > 0 ? (
                      <select value={image} onChange={(e) => setImage(e.target.value)}>
                        <option value="">Select an uploaded media asset...</option>
                        {assets.map((a) => (
                          <option key={a.id} value={`/api/cms-media/${a.id}`}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="/images/live/project.webp or media ID"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="cms-form-group">
                    <label>Live URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://client-site.com"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cms-form-group full">
                  <label>Summary / Deck</label>
                  <textarea
                    placeholder="Short narrative highlighting the client, problem, and value created..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                <div className="cms-form-grid">
                  <div className="cms-form-group">
                    <label>Metric 1 Value</label>
                    <input
                      type="text"
                      placeholder="e.g. 300%"
                      value={metric1Val}
                      onChange={(e) => setMetric1Val(e.target.value)}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label>Metric 1 Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Organic Search Increase"
                      value={metric1Lbl}
                      onChange={(e) => setMetric1Lbl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cms-form-grid">
                  <div className="cms-form-group">
                    <label>Metric 2 Value</label>
                    <input
                      type="text"
                      placeholder="e.g. 4.8x"
                      value={metric2Val}
                      onChange={(e) => setMetric2Val(e.target.value)}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label>Metric 2 Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Average Session Duration"
                      value={metric2Lbl}
                      onChange={(e) => setMetric2Lbl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cms-form-group full">
                  <label>The Challenge & Context</label>
                  <textarea
                    placeholder="Describe the hurdles, legacy limitations, or market opportunity..."
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>Our Solution & Execution</label>
                  <textarea
                    placeholder="Explain the strategy, architecture, tools, and UX craft applied..."
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>Measurable Results</label>
                  <textarea
                    placeholder="Key business wins, client satisfaction, and long-term trajectory..."
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* INSIGHT / BLOG TEMPLATE FIELDS */}
            {kind === 'blog' && (
              <>
                <div className="cms-form-grid">
                  <div className="cms-form-group">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Strategy">Strategy</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Brand Strategy">Brand Strategy</option>
                      <option value="AI & Automation">AI & Automation</option>
                    </select>
                  </div>
                  <div className="cms-form-group">
                    <label>Display Date</label>
                    <input
                      type="text"
                      placeholder="e.g. November 2026"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cms-form-group full">
                  <label>Cover Image</label>
                  {assets.length > 0 ? (
                    <select value={image} onChange={(e) => setImage(e.target.value)}>
                      <option value="">Select an uploaded media asset...</option>
                      {assets.map((a) => (
                        <option key={a.id} value={`/api/cms-media/${a.id}`}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="/images/live/blog.webp or media ID"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  )}
                </div>

                <div className="cms-form-group full">
                  <label>Article Summary / Abstract</label>
                  <textarea
                    placeholder="2-3 sentence overview introducing the thesis..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>Introductory Paragraph</label>
                  <textarea
                    placeholder="Set the stage for the reader..."
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>Main Body & Strategic Perspectives</label>
                  <textarea
                    style={{ minHeight: 90 }}
                    placeholder="Core arguments, data points, or detailed reasoning..."
                    value={mainBody}
                    onChange={(e) => setMainBody(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>Key Takeaways (one per line)</label>
                  <textarea
                    placeholder="• First critical takeaway&#10;• Second actionable recommendation&#10;• Third key takeaway"
                    value={keyTakeaways}
                    onChange={(e) => setKeyTakeaways(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>Conclusion</label>
                  <textarea
                    placeholder="Closing summary and forward-looking action..."
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* CAREER TEMPLATE FIELDS */}
            {kind === 'careers' && (
              <>
                <div className="cms-form-grid">
                  <div className="cms-form-group">
                    <label>Department / Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering, Design, Marketing"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Vijayawada · Hybrid"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cms-form-grid">
                  <div className="cms-form-group">
                    <label>Employment Type</label>
                    <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="cms-form-group">
                    <label>Application Link / Email</label>
                    <input
                      type="text"
                      placeholder="mailto:careers@thinklabdigitalsolutions.com"
                      value={apply}
                      onChange={(e) => setApply(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cms-form-group full">
                  <label>Role Summary</label>
                  <textarea
                    placeholder="Brief overview of why this role exists and its impact..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>Key Responsibilities (one per line)</label>
                  <textarea
                    placeholder="• Lead the design and delivery of client web platforms&#10;• Work alongside developers to ensure 60fps interaction fidelity&#10;• Participate in client reviews and workshops"
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>Requirements & Qualifications (one per line)</label>
                  <textarea
                    placeholder="• 3+ years of experience with React / Next.js / TypeScript&#10;• Strong aesthetic sense and attention to detail&#10;• Demonstrated problem-solving and communication abilities"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                  />
                </div>

                <div className="cms-form-group full">
                  <label>What We Offer (one per line)</label>
                  <textarea
                    placeholder="• Competitive compensation package&#10;• High-agency culture with cutting-edge tools&#10;• Collaborative team on ambitious global brands"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="cms-modal-footer">
            <button type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="cms-primary" disabled={busy}>
              {busy ? 'Creating...' : `Create ${kind === 'page' ? 'Page' : 'Entry'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
