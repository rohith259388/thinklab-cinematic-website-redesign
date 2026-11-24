'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  Plus,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
  Undo2,
  Redo2,
  List,
  ListOrdered,
  Image as ImageIcon,
  Video as VideoIcon,
  MousePointerClick,
  AlertTriangle,
  Upload,
  X,
} from 'lucide-react';
import { sanitizeArticleHtml } from '@/lib/cms/sanitize';

interface Asset {
  id: string;
  name: string;
  mime: string;
  alt?: string;
}

interface InsightRichEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  assets?: Asset[];
  disabled?: boolean;
}

/** Custom TipTap node for CTA buttons */
const CmsButton = Node.create({
  name: 'cmsButton',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      href: { default: '/contact' },
      text: { default: 'Learn More' },
      variant: { default: 'btn-drop' },
      target: { default: '_self' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cms-button"]',
        getAttrs: (el) => {
          const dom = el as HTMLElement;
          const a = dom.querySelector('a') || dom;
          return {
            href: a.getAttribute('href') || '/contact',
            text: a.textContent || 'Learn More',
            variant:
              a.getAttribute('data-variant') ||
              (a.className.includes('round-link') ? 'round-link' : 'btn-drop'),
            target: a.getAttribute('target') || '_self',
          };
        },
      },
      {
        tag: 'a[data-type="cms-button"]',
        getAttrs: (el) => {
          const a = el as HTMLElement;
          return {
            href: a.getAttribute('href') || '/contact',
            text: a.textContent || 'Learn More',
            variant:
              a.getAttribute('data-variant') ||
              (a.className.includes('round-link') ? 'round-link' : 'btn-drop'),
            target: a.getAttribute('target') || '_self',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const isRound = HTMLAttributes.variant === 'round-link';
    const classes = isRound
      ? 'round-link inline-flex items-center gap-2'
      : 'btn-drop px-7 py-4 inline-flex items-center gap-2';

    return [
      'div',
      { class: 'cms-button-block my-4', 'data-type': 'cms-button' },
      [
        'a',
        mergeAttributes(HTMLAttributes, {
          href: HTMLAttributes.href || '/contact',
          class: classes,
          target: HTMLAttributes.target || '_self',
          rel: HTMLAttributes.target === '_blank' ? 'noopener noreferrer' : undefined,
          'data-type': 'cms-button',
          'data-variant': HTMLAttributes.variant,
        }),
        HTMLAttributes.text || 'Learn More',
      ],
    ];
  },
});

/** Custom TipTap node for responsive YouTube/Vimeo video embeds */
const CmsVideo = Node.create({
  name: 'cmsVideo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      provider: { default: 'youtube' },
      title: { default: 'Embedded video' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cms-video"]',
        getAttrs: (el) => {
          const dom = el as HTMLElement;
          const iframe = dom.querySelector('iframe');
          return {
            src: dom.getAttribute('data-video') || iframe?.getAttribute('src') || '',
            provider: dom.getAttribute('data-provider') || 'youtube',
            title: iframe?.getAttribute('title') || 'Embedded video',
          };
        },
      },
      {
        tag: 'iframe[src*="youtube"], iframe[src*="vimeo"]',
        getAttrs: (el) => {
          const iframe = el as HTMLElement;
          return {
            src: iframe.getAttribute('src') || '',
            provider: iframe.getAttribute('src')?.includes('vimeo') ? 'vimeo' : 'youtube',
            title: iframe.getAttribute('title') || 'Embedded video',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src || '';
    let embedUrl = src;
    if (src.includes('youtube.com/watch') || src.includes('youtu.be/')) {
      const match = src.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match && match[1]) {
        embedUrl = `https://www.youtube-nocookie.com/embed/${match[1]}`;
      }
    } else if (src.includes('vimeo.com/') && !src.includes('player.vimeo.com')) {
      const match = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
      if (match && match[1]) {
        embedUrl = `https://player.vimeo.com/video/${match[1]}`;
      }
    }

    return [
      'div',
      {
        class: 'rich-video-wrapper my-6 relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg',
        'data-type': 'cms-video',
        'data-video': src,
        'data-provider': HTMLAttributes.provider,
      },
      [
        'iframe',
        {
          src: embedUrl,
          title: HTMLAttributes.title || 'Video player',
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          class: 'w-full h-full border-0 absolute inset-0',
        },
      ],
    ];
  },
});

export default function InsightRichEditor({
  initialHtml,
  onChange,
  assets = [],
  disabled = false,
}: InsightRichEditorProps) {
  // Modal states
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Link dialog form
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(false);

  // Button dialog form
  const [btnText, setBtnText] = useState('Explore Projects');
  const [btnUrl, setBtnUrl] = useState('/projects');
  const [btnVariant, setBtnVariant] = useState('btn-drop');
  const [btnNewTab, setBtnNewTab] = useState(false);

  // Image dialog form
  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  // Video dialog form
  const [videoUrl, setVideoUrl] = useState('');

  // Dropdown reference for click-outside
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Close plus menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as unknown as globalThis.Node)) {
        setShowPlusMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'underline decoration-[#c5b0ff] underline-offset-4',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-6',
        },
      }),
      CmsButton,
      CmsVideo,
    ],
    content: initialHtml || '<p>Write or paste your article here…</p>',
    editable: !disabled,
    editorProps: {
      transformPastedHTML(html) {
        return sanitizeArticleHtml(html);
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Sync external HTML if changed from outside (e.g. History revert)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (initialHtml && initialHtml !== currentHtml && !editor.isFocused) {
      editor.commands.setContent(initialHtml, { emitUpdate: false });
    }
  }, [initialHtml, editor]);

  if (!editor) return null;

  // Active heading level determination
  const getCurrentHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
    return 'p';
  };

  const currentHeading = getCurrentHeading();
  const hasH1 = editor.isActive('heading', { level: 1 }) || editor.getHTML().includes('<h1');

  const handleHeadingChange = (val: string) => {
    if (val === 'p') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(val.replace('h', ''), 10) as 1 | 2 | 3 | 4 | 5 | 6;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .setLink({
          href: linkUrl.trim(),
          target: linkNewTab ? '_blank' : '_self',
        })
        .run();
    }
    setShowLinkModal(false);
  };

  const handleButtonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!btnUrl.trim()) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'cmsButton',
        attrs: {
          text: btnText.trim() || 'Learn More',
          href: btnUrl.trim(),
          variant: btnVariant,
          target: btnNewTab ? '_blank' : '_self',
        },
      })
      .run();
    setShowButtonModal(false);
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgUrl.trim()) return;
    editor
      .chain()
      .focus()
      .setImage({
        src: imgUrl.trim(),
        alt: imgAlt.trim(),
        title: imgCaption.trim() || undefined,
      })
      .run();
    setShowImageModal(false);
    setImgUrl('');
    setImgAlt('');
    setImgCaption('');
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'cmsVideo',
        attrs: {
          src: videoUrl.trim(),
          provider: videoUrl.includes('vimeo') ? 'vimeo' : 'youtube',
          title: 'Embedded video',
        },
      })
      .run();
    setShowVideoModal(false);
    setVideoUrl('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('alt', file.name.replace(/\.[^/.]+$/, ''));
      const res = await fetch('/api/cms/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setImgUrl(`/api/cms-media/${data.id}`);
      if (!imgAlt) setImgAlt(file.name.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImg(false);
    }
  };

  return (
    <div className="cms-insight-editor-container flex flex-col h-full relative">
      {/* 1. STICKY TOP TOOLBAR */}
      <div className="cms-insight-toolbar sticky top-0 z-30 flex items-center flex-wrap gap-1.5 p-2 bg-[#0d0c13] border-b border-white/10 shadow-sm backdrop-blur-md">
        {/* + Insert Dropdown */}
        <div className="relative" ref={plusMenuRef}>
          <button
            type="button"
            className="cms-tb-btn primary flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#7e6ff0]/20 hover:bg-[#7e6ff0]/30 text-[#c5b0ff] border border-[#7e6ff0]/40 text-xs font-medium transition-colors"
            title="Insert element"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            disabled={disabled}
          >
            <Plus size={15} />
            <span>Insert</span>
          </button>

          {showPlusMenu && (
            <div className="absolute left-0 mt-1.5 w-52 bg-[#14121f] border border-white/15 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-[#dedce6]">
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 hover:bg-[#7e6ff0]/20 flex items-center gap-2.5 transition-colors"
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setShowPlusMenu(false);
                }}
              >
                <ListOrdered size={15} className="text-[#a280ff]" />
                <span>Numbered List</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 hover:bg-[#7e6ff0]/20 flex items-center gap-2.5 transition-colors"
                onClick={() => {
                  editor.chain().focus().toggleBulletList().run();
                  setShowPlusMenu(false);
                }}
              >
                <List size={15} className="text-[#a280ff]" />
                <span>Bullet List</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 hover:bg-[#7e6ff0]/20 flex items-center gap-2.5 transition-colors"
                onClick={() => {
                  setShowButtonModal(true);
                  setShowPlusMenu(false);
                }}
              >
                <MousePointerClick size={15} className="text-[#a280ff]" />
                <span>Button CTA</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 hover:bg-[#7e6ff0]/20 flex items-center gap-2.5 transition-colors"
                onClick={() => {
                  setShowImageModal(true);
                  setShowPlusMenu(false);
                }}
              >
                <ImageIcon size={15} className="text-[#a280ff]" />
                <span>Image</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 hover:bg-[#7e6ff0]/20 flex items-center gap-2.5 transition-colors"
                onClick={() => {
                  setShowVideoModal(true);
                  setShowPlusMenu(false);
                }}
              >
                <VideoIcon size={15} className="text-[#a280ff]" />
                <span>Video (YouTube/Vimeo)</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Heading Dropdown */}
        <select
          value={currentHeading}
          onChange={(e) => handleHeadingChange(e.target.value)}
          className="cms-heading-select bg-[#161424] text-xs text-[#eae8f2] border border-white/15 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#7e6ff0]"
          disabled={disabled}
          title="Format text heading level"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1 (H1)</option>
          <option value="h2">Heading 2 (H2)</option>
          <option value="h3">Heading 3 (H3)</option>
          <option value="h4">Heading 4 (H4)</option>
          <option value="h5">Heading 5 (H5)</option>
          <option value="h6">Heading 6 (H6)</option>
        </select>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Inline Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`cms-tb-btn p-1.5 rounded hover:bg-white/10 text-white/80 transition-colors ${
            editor.isActive('bold') ? 'bg-[#7e6ff0]/30 text-[#c5b0ff]' : ''
          }`}
          title="Bold (Ctrl+B)"
          disabled={disabled}
        >
          <Bold size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`cms-tb-btn p-1.5 rounded hover:bg-white/10 text-white/80 transition-colors ${
            editor.isActive('italic') ? 'bg-[#7e6ff0]/30 text-[#c5b0ff]' : ''
          }`}
          title="Italic (Ctrl+I)"
          disabled={disabled}
        >
          <Italic size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`cms-tb-btn p-1.5 rounded hover:bg-white/10 text-white/80 transition-colors ${
            editor.isActive('underline') ? 'bg-[#7e6ff0]/30 text-[#c5b0ff]' : ''
          }`}
          title="Underline (Ctrl+U)"
          disabled={disabled}
        >
          <UnderlineIcon size={15} />
        </button>

        <button
          type="button"
          onClick={() => {
            setLinkUrl(editor.getAttributes('link').href || '');
            setShowLinkModal(true);
          }}
          className={`cms-tb-btn p-1.5 rounded hover:bg-white/10 text-white/80 transition-colors ${
            editor.isActive('link') ? 'bg-[#7e6ff0]/30 text-[#c5b0ff]' : ''
          }`}
          title="Insert Link"
          disabled={disabled}
        >
          <LinkIcon size={15} />
        </button>

        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="cms-tb-btn p-1.5 rounded hover:bg-white/10 text-rose-400 transition-colors"
            title="Remove Link"
            disabled={disabled}
          >
            <Unlink size={15} />
          </button>
        )}

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="cms-tb-btn p-1.5 rounded hover:bg-white/10 text-white/80 transition-colors"
          title="Clear formatting"
          disabled={disabled}
        >
          <RemoveFormatting size={15} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
          className="cms-tb-btn p-1.5 rounded hover:bg-white/10 text-white/80 disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
          className="cms-tb-btn p-1.5 rounded hover:bg-white/10 text-white/80 disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={15} />
        </button>
      </div>

      {/* SEO H1 WARNING (Non-intrusive) */}
      {hasH1 && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-3.5 py-2 text-[11px] text-amber-200/90 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <span>
            <strong>SEO Recommendation:</strong> The article title is already the page H1. Using H2 for section headings preserves clean SEO hierarchy.
          </span>
        </div>
      )}

      {/* 2. ONE UNIFIED RICH CONTENT EDITOR CANVAS */}
      <div className="cms-editor-viewport flex-1 overflow-y-auto bg-[#0a0a0f] p-5 md:p-8">
        <EditorContent
          editor={editor}
          className="rich-copy prose prose-invert max-w-none focus:outline-none min-h-[500px]"
        />
      </div>

      {/* ——— MODALS ——— */}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#14121f] border border-white/15 rounded-xl max-w-md w-full p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Insert or Edit Link</h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 text-white/80">Destination URL</label>
                <input
                  type="text"
                  placeholder="https://... or /contact"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full bg-[#1b1929] border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-[#7e6ff0]"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="link-newtab"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                />
                <label htmlFor="link-newtab" className="text-white/80">
                  Open link in new browser tab
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3.5 py-1.5 rounded border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#7e6ff0] hover:bg-[#6e5fe0] text-white font-medium"
                >
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Button CTA Modal */}
      {showButtonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#14121f] border border-white/15 rounded-xl max-w-md w-full p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Insert Button CTA</h3>
              <button
                type="button"
                onClick={() => setShowButtonModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleButtonSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 text-white/80">Button Text</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule a Strategy Call"
                  value={btnText}
                  onChange={(e) => setBtnText(e.target.value)}
                  className="w-full bg-[#1b1929] border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-[#7e6ff0]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-1.5 text-white/80">Button URL / Link</label>
                <input
                  type="text"
                  placeholder="/contact or https://..."
                  value={btnUrl}
                  onChange={(e) => setBtnUrl(e.target.value)}
                  className="w-full bg-[#1b1929] border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-[#7e6ff0]"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-white/80">Button Style</label>
                <select
                  value={btnVariant}
                  onChange={(e) => setBtnVariant(e.target.value)}
                  className="w-full bg-[#1b1929] border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-[#7e6ff0]"
                >
                  <option value="btn-drop">Primary Drop Pill (Purple Glow)</option>
                  <option value="round-link">Minimalist Round Arrow Link</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="btn-newtab"
                  checked={btnNewTab}
                  onChange={(e) => setBtnNewTab(e.target.checked)}
                />
                <label htmlFor="btn-newtab" className="text-white/80">
                  Open button destination in new tab
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowButtonModal(false)}
                  className="px-3.5 py-1.5 rounded border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#7e6ff0] hover:bg-[#6e5fe0] text-white font-medium"
                >
                  Insert Button
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#14121f] border border-white/15 rounded-xl max-w-md w-full p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Insert Image</h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleImageSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 text-white/80">Image Source (URL or Upload)</label>
                <input
                  type="text"
                  placeholder="https://... or select uploaded media below"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  className="w-full bg-[#1b1929] border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-[#7e6ff0]"
                />
              </div>

              {/* Upload from PC */}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7e6ff0]/20 hover:bg-[#7e6ff0]/30 text-[#c5b0ff] border border-[#7e6ff0]/40 rounded font-medium transition-colors">
                  <Upload size={14} />
                  <span>{uploadingImg ? 'Uploading…' : 'Upload from PC'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImg}
                  />
                </label>
                {assets.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setImgUrl(e.target.value);
                    }}
                    className="flex-1 bg-[#1b1929] border border-white/15 rounded px-2.5 py-1.5 text-white focus:outline-none"
                  >
                    <option value="">Or pick media asset…</option>
                    {assets.map((a) => (
                      <option key={a.id} value={`/api/cms-media/${a.id}`}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block mb-1.5 text-white/80">Alt Text (Accessibility / SEO)</label>
                <input
                  type="text"
                  placeholder="Describe the image content..."
                  value={imgAlt}
                  onChange={(e) => setImgAlt(e.target.value)}
                  className="w-full bg-[#1b1929] border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-[#7e6ff0]"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-white/80">Caption (Optional)</label>
                <input
                  type="text"
                  placeholder="Image subtitle or credit..."
                  value={imgCaption}
                  onChange={(e) => setImgCaption(e.target.value)}
                  className="w-full bg-[#1b1929] border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-[#7e6ff0]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-3.5 py-1.5 rounded border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!imgUrl.trim()}
                  className="px-4 py-1.5 rounded bg-[#7e6ff0] hover:bg-[#6e5fe0] text-white font-medium disabled:opacity-40"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#14121f] border border-white/15 rounded-xl max-w-md w-full p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Insert Video</h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleVideoSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 text-white/80">YouTube or Vimeo Video Link</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-[#1b1929] border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-[#7e6ff0]"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-white/50">
                Direct YouTube or Vimeo links are automatically transformed into clean, responsive 16:9 embeds.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-3.5 py-1.5 rounded border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!videoUrl.trim()}
                  className="px-4 py-1.5 rounded bg-[#7e6ff0] hover:bg-[#6e5fe0] text-white font-medium disabled:opacity-40"
                >
                  Insert Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
