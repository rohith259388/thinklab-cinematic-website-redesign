"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Document, type Content, type Kind, documentPath } from "@/lib/cms/schema";
import TemplateModal from "./TemplateModal";
import ImageField from "./ImageField";
import "./studio.css";
import AuthCard from "./AuthCard";
type Field = { key: string; value: string; global: boolean };
type Asset = { id: string; name: string; mime: string; alt: string };
async function api(action: string, data?: unknown) {
  const r = await fetch("/api/cms/" + action, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    credentials: "include",
  });
  const text = await r.text();
  let v: any = {};
  try {
    v = text ? JSON.parse(text) : {};
  } catch {
    if (r.status === 401) {
      try {
        localStorage.removeItem("thinklab_studio_user");
      } catch {}
      window.location.replace("/admin/login");
      throw new Error("Session expired. Redirecting to login...");
    }
    throw new Error(!r.ok ? `Server error (${r.status})` : "Invalid response from server");
  }
  if (!r.ok) {
    if (r.status === 401) {
      try {
        localStorage.removeItem("thinklab_studio_user");
      } catch {}
      window.location.replace("/admin/login");
      throw new Error(v.error || "Session expired. Redirecting to login...");
    }
    throw new Error(v.error || "Request failed");
  }
  return v;
}
const isDeletable = (d: Document) =>
  !(
    d.kind === "global" ||
    (d.kind === "page" &&
      ["/", "about", "services", "projects", "reviews", "blog", "contact"].includes(d.slug))
  );

function formatFieldLabel(key: string): string {
  const parts = key.split(".");
  return parts
    .map((p) => {
      if (!isNaN(Number(p))) return `#${Number(p) + 1}`;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" › ");
}

const DEFAULT_PAGE_FIELDS: Record<string, { key: string; label: string; defaultValue: string }[]> = {
  "/": [
    { key: "home.intro.kicker", label: "Intro Kicker", defaultValue: "CURIOUS MINDS. SHARED AMBITION." },
    { key: "home.intro.title", label: "Intro Title", defaultValue: "About Thinklab" },
    { key: "home.intro.accent", label: "Intro Accent", defaultValue: "Digital Solutions." },
    { key: "home.intro.body1", label: "Intro Body 1", defaultValue: "We are an independent digital studio helping ambitious brands turn complex ideas into digital momentum." },
    { key: "home.intro.body2", label: "Intro Body 2", defaultValue: "Strategy, design, and engineering aligned to create websites and software that command attention." },
    { key: "home.intro.cta", label: "Intro CTA Button", defaultValue: "Meet the minds" },
    { key: "home.projects.kicker", label: "Projects Kicker", defaultValue: "THINKING MADE TANGIBLE." },
    { key: "home.projects.title", label: "Projects Title", defaultValue: "Projects" },
    { key: "home.projects.body", label: "Projects Body", defaultValue: "Explore our latest case studies and digital work." },
    { key: "home.projects.cta", label: "Projects CTA Button", defaultValue: "View All Projects" },
    { key: "home.philosophy.kicker", label: "Philosophy Kicker", defaultValue: "WHY THINKLAB DIGITAL SOLUTIONS STANDS OUT" },
    { key: "home.philosophy.title", label: "Philosophy Title", defaultValue: "What if became what's next?" },
    { key: "home.services.kicker", label: "Services Kicker", defaultValue: "CONNECTED BY DESIGN." },
    { key: "home.services.title", label: "Services Title", defaultValue: "Different skills." },
    { key: "home.services.accent", label: "Services Accent", defaultValue: "One big picture." },
    { key: "home.services.cta", label: "Services CTA Button", defaultValue: "View All Services" },
    { key: "home.process.kicker", label: "Process Kicker", defaultValue: "FROM POSSIBILITY TO PROGRESS." },
    { key: "home.process.title", label: "Process Title", defaultValue: "Great work. No guesswork." },
    { key: "hero.finale.title", label: "Journey Finale Title", defaultValue: "This is Thinklab" },
  ],
  "about": [
    { key: "hero.kicker", label: "Hero Kicker", defaultValue: "ABOUT THINKLAB" },
    { key: "hero.title", label: "Hero Title", defaultValue: "Curious minds." },
    { key: "hero.accent", label: "Hero Accent", defaultValue: "Real ambition." },
    { key: "hero.body", label: "Hero Body", defaultValue: "We are strategists, designers and engineers with one shared belief: your next big idea deserves a team that cares as much as you do." },
    { key: "about.pillar.0.title", label: "Pillar 1 Title", defaultValue: "History & Heritage" },
    { key: "about.pillar.0.body", label: "Pillar 1 Body", defaultValue: "Founded with a vision to redefine digital products." },
    { key: "about.pillar.1.title", label: "Pillar 2 Title", defaultValue: "Our Mission" },
    { key: "about.pillar.1.body", label: "Pillar 2 Body", defaultValue: "To deliver transformative digital experiences." },
    { key: "about.pillar.2.title", label: "Pillar 3 Title", defaultValue: "Our Vision" },
    { key: "about.pillar.2.body", label: "Pillar 3 Body", defaultValue: "Empowering global businesses with next-generation web platforms." },
    { key: "about.brands.label", label: "Brands Section Label", defaultValue: "TRUSTED BY AMBITIOUS TEAMS" },
  ],
  "services": [
    { key: "hero.kicker", label: "Hero Kicker", defaultValue: "OUR CAPABILITIES" },
    { key: "hero.title", label: "Hero Title", defaultValue: "Capabilities." },
    { key: "hero.accent", label: "Hero Accent", defaultValue: "Delivered with precision." },
    { key: "hero.body", label: "Hero Body", defaultValue: "From full-scale digital engineering to brand transformation and growth marketing." },
    { key: "services.intro.kicker", label: "Intro Kicker", defaultValue: "CORE SERVICES" },
    { key: "services.intro.title", label: "Intro Title", defaultValue: "Built for modern scale" },
  ],
  "contact": [
    { key: "hero.kicker", label: "Hero Kicker", defaultValue: "LET'S BUILD SOMETHING" },
    { key: "hero.title", label: "Hero Title", defaultValue: "Start a conversation." },
    { key: "hero.accent", label: "Hero Accent", defaultValue: "We are ready." },
    { key: "hero.body", label: "Hero Body", defaultValue: "Tell us about your project, timeline and ambitions. We will get back to you within 24 hours." },
    { key: "contact.info.heading", label: "Contact Info Heading", defaultValue: "Direct channels" },
    { key: "contact.form.heading", label: "Form Heading", defaultValue: "Send an enquiry" },
  ],
  "site": [
    { key: "header.descriptor", label: "Header Descriptor", defaultValue: "Ideas into impact. Independent digital studio." },
    { key: "header.cta", label: "Header CTA Button", defaultValue: "Let's talk" },
    { key: "footer.eyebrow", label: "Footer Eyebrow", defaultValue: "NEXT STEPS" },
    { key: "footer.subheading", label: "Footer Subheading", defaultValue: "Let's build something enduring together." },
    { key: "footer.cta.line1", label: "Footer CTA Line 1", defaultValue: "Have an idea?" },
    { key: "footer.cta.line2", label: "Footer CTA Line 2", defaultValue: "Let's talk." },
    { key: "footer.locations.heading", label: "Locations Heading", defaultValue: "STUDIOS" },
    { key: "footer.location.1", label: "Studio Location 1", defaultValue: "Vijayawada, AP, India" },
    { key: "footer.location.2", label: "Studio Location 2", defaultValue: "Mascot, Sydney, Australia" },
    { key: "footer.contact.heading", label: "Contact Heading", defaultValue: "COMMUNICATIONS" },
    { key: "footer.email.label", label: "Email Address", defaultValue: "info@thinklabdigitalsolutions.com" },
  ],
};

const pickHome = (list?: Document[]) =>
  list && list.length > 0
    ? list.find((d) => d.slug === "/" || d.id === "page-home") || list[0]
    : null;

// Ends the session server-side (deletes it and expires the cookie), then always
// lands on the login page, even if the request itself fails.
async function signOut() {
  try {
    localStorage.removeItem("thinklab_studio_user");
  } catch {}
  try {
    await fetch("/api/cms/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      credentials: "include",
    });
  } catch {}
  window.location.replace("/admin/login");
}

export default function Studio({
  initialUser = null,
  initialDocs,
}: {
  initialUser?: { email: string; role: string } | null;
  initialDocs?: Document[];
} = {}) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(initialUser);
  const [loading, setLoading] = useState(!(initialUser && initialDocs));
  const [error, setError] = useState(""),
    [docs, setDocs] = useState<Document[]>(initialDocs ?? []),
    [doc, setDoc] = useState<Document | null>(() => pickHome(initialDocs)),
    [draft, setDraft] = useState<Content | null>(() => pickHome(initialDocs)?.draft ?? null),
    [tab, setTab] = useState<string>("page"),
    [fields, setFields] = useState<Field[]>([]),
    [selected, setSelected] = useState(""),
    [size, setSize] = useState(1280),
    [status, setStatus] = useState("Saved"),
    [busy, setBusy] = useState(false),
    [versions, setVersions] = useState<
      { id: string; action: string; created: string; actor: string }[]
    >([]),
    [assets, setAssets] = useState<Asset[]>([]),
    [panel, setPanel] = useState("design"),
    [frameVersion, setFrameVersion] = useState(0),
    [canvasWidth, setCanvasWidth] = useState(700),
    [canUndo, setCanUndo] = useState(false),
    [canRedo, setCanRedo] = useState(false),
    [mediaSection, setMediaSection] = useState(""),
    [templateModal, setTemplateModal] = useState<Kind | null>(null);
  const canvasArea = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null),
    past = useRef<Content[]>([]),
    future = useRef<Content[]>([]),
    latest = useRef(draft);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isUserAdmin = Boolean(
    user?.role === "admin" ||
    user?.email?.endsWith("@thinklabdigitalsolutions.com") ||
    user?.email?.endsWith("@thinklab.com") ||
    user?.email === "admin@thinklab.com"
  );
  useEffect(() => {
    latest.current = draft;
  }, [draft]);
  const refresh = useCallback(async () => {
    const list = await api("documents");
    setDocs(list);
    return list as Document[];
  }, []);


  useEffect(() => {
    // The server already verified the session and loaded documents.
    if (initialUser && initialDocs) return;
    api("session")
      .then(async (u) => {
        setUser(u);
        try {
          localStorage.setItem("thinklab_studio_user", JSON.stringify(u));
        } catch {}
        try {
          const list = await refresh();
          if (list && list.length > 0) {
            setDoc((current) => {
              if (current) return current;
              const home = list.find((d: Document) => d.slug === "/" || d.id === "page-home") || list[0];
              setDraft(home.draft);
              return home;
            });
          }
        } catch (e) {
          console.warn("Failed to load documents:", e);
        }
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e || "");
        if (msg.includes("Unauthorized") || msg.includes("Session expired") || msg.includes("401")) {
          try {
            localStorage.removeItem("thinklab_studio_user");
          } catch {}
          setUser(null);
          if (typeof window !== "undefined") {
            window.location.replace("/admin/login");
          }
        } else {
          console.warn("[Studio] Session check warning:", msg);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);
  const change = (next: Content) => {
    if (draft) {
      past.current.push(draft);
      if (past.current.length > 100) past.current.shift();
    }
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
    setDraft(next);
    setStatus(
      JSON.stringify(next) === JSON.stringify(doc?.draft)
        ? "Saved"
        : "Unsaved changes",
    );
  };
  const undo = () => {
    const next = past.current.pop();
    if (next && draft) {
      future.current.push(draft);
      setCanUndo(past.current.length > 0);
      setCanRedo(true);
      setDraft(next);
      setStatus(
        JSON.stringify(next) === JSON.stringify(doc?.draft)
          ? "Saved"
          : "Unsaved changes",
      );
    }
  };
  const redo = () => {
    const next = future.current.pop();
    if (next && draft) {
      past.current.push(draft);
      setCanUndo(true);
      setCanRedo(future.current.length > 0);
      setDraft(next);
      setStatus(
        JSON.stringify(next) === JSON.stringify(doc?.draft)
          ? "Saved"
          : "Unsaved changes",
      );
    }
  };
  const open = useCallback((d: Document) => {
    if (status === "Unsaved changes" && !confirm("Discard unsaved changes?"))
      return;
    setDoc(d);
    setDraft(d.draft);
    setSelected("");
    setFields([]);
    setVersions([]);
    past.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setStatus("Saved");
    setPanel("design");
  }, [status]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };
  const save = async (contentOverride?: Content) => {
    const toSave = contentOverride || latest.current;
    if (!doc || !toSave) return;
    const updated = await api("save", {
      id: doc.id,
      revision: doc.revision,
      content: toSave,
    });
    setDoc(updated);
    setDraft(updated.draft);
    setStatus("Saved");
    setDocs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    return updated as Document;
  };
  const operation = async (action: string, extra: object = {}) => {
    if (!doc) return;
    const updated = await api(action, {
      id: doc.id,
      revision: doc.revision,
      ...extra,
    });
    setDoc(updated.deleted ? null : updated);
    setDraft(updated.deleted ? null : updated.draft);
    setStatus("Saved");
    setFrameVersion((v) => v + 1);
    setDocs((prev) =>
      updated.deleted
        ? prev.filter((item) => item.id !== updated.id)
        : prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };
  const deleteDocument = async (id: string, revision: number, title: string) => {
    const itemType = tab === "projects" ? "project" : tab === "blog" ? "insight" : tab === "careers" ? "career" : "entry";
    if (!confirm(`Are you sure you want to permanently delete the ${itemType} "${title}"? This cannot be undone.`)) return;
    await run(async () => {
      await api("delete", { id, revision });
      if (doc?.id === id) {
        setDoc(null);
        setDraft(null);
      }
      setStatus(`Deleted ${title}`);
      await refresh();
    });
  };
  const revertDraft = async () => {
    if (!doc) return;
    const isLocalModified = JSON.stringify(draft) !== JSON.stringify(doc.draft);
    const hasPublished = Boolean(doc.published);
    const isDraftDifferentFromPublished =
      hasPublished && JSON.stringify(draft) !== JSON.stringify(doc.published);

    if (!isLocalModified && !isDraftDifferentFromPublished) {
      setError("This document is already up to date with the latest published/saved version.");
      return;
    }

    if (isLocalModified) {
      if (!confirm("Discard your current unsaved edits? This will reset all fields to the last saved state.")) {
        return;
      }
      setDraft(doc.draft);
      past.current = [];
      future.current = [];
      setCanUndo(false);
      setCanRedo(false);
      setStatus("Reverted unsaved edits");
      setFrameVersion((v) => v + 1);
      return;
    }

    if (isDraftDifferentFromPublished) {
      if (
        !confirm(
          "Revert this entire draft back to the currently LIVE published version? All unpublished draft changes will be discarded.",
        )
      ) {
        return;
      }
      await run(async () => {
        const updated = await save(doc.published!);
        if (updated) {
          setDraft(updated.draft);
          setDoc(updated);
          past.current = [];
          future.current = [];
          setCanUndo(false);
          setCanRedo(false);
          setStatus("Reverted to published");
          setFrameVersion((v) => v + 1);
        }
      });
    }
  };
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (
        !doc ||
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow ||
        e.data?.id !== doc.id
      )
        return;
      if (e.data.type === "cms:ready") {
        setFields(
          Array.from(
            new Map<string, Field>(
              (e.data.fields as Field[]).map((f) => [f.key, f]),
            ).values(),
          ),
        );
        frame.current?.contentWindow?.postMessage(
          {
            type: "cms:update",
            id: doc.id,
            content: latest.current,
            global: doc.kind === "global",
          },
          location.origin,
        );
      }
      if (e.data.type === "cms:select") {
        if (e.data.global && doc.kind !== "global") {
          const g = docs.find((d) => d.kind === "global");
          if (g) {
            open(g);
            setTab("global");
            setSelected(e.data.key);
            setPanel("design");
            return;
          }
        }
        setSelected(e.data.key);
        setPanel(e.data.key?.startsWith("entry.") ? "content" : "design");
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [doc, docs, open]);
  useEffect(() => {
    if (draft && doc)
      frame.current?.contentWindow?.postMessage(
        {
          type: "cms:update",
          id: doc.id,
          content: draft,
          global: doc.kind === "global",
        },
        location.origin,
      );
  }, [draft, doc]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (status === "Unsaved changes") e.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [status]);
  // Keyboard shortcuts are scoped to the studio; native text undo remains available in inputs.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!busy)
          void run(async () => {
            await save();
          });
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "z" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  useEffect(() => {
    const el = canvasArea.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setCanvasWidth(Math.max(200, el.clientWidth - 48)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc, tab]);
  const zoom = Math.min(1, canvasWidth / size);
  const availableFields = useMemo(() => {
    if (!doc) return [];
    const map = new Map<string, { key: string; label: string; defaultValue?: string }>();
    const defaults =
      DEFAULT_PAGE_FIELDS[doc.slug] ||
      DEFAULT_PAGE_FIELDS[doc.id] ||
      (doc.slug === "/" ? DEFAULT_PAGE_FIELDS["/"] : []);
    defaults.forEach((f) => map.set(f.key, f));
    if (draft?.fields) {
      Object.keys(draft.fields).forEach((key) => {
        if (!map.has(key)) {
          map.set(key, { key, label: formatFieldLabel(key) });
        }
      });
    }
    fields.forEach((f) => {
      map.set(f.key, { key: f.key, label: formatFieldLabel(f.key) });
    });
    return Array.from(map.values());
  }, [doc, draft?.fields, fields]);

  const field = (key: keyof Content, label: string, multiline = false) =>
    draft && (
      <label className="cms-field">
        {label}
        {multiline ? (
          <textarea
            value={String(draft[key])}
            onChange={(e) => change({ ...draft, [key]: e.target.value })}
          />
        ) : (
          <input
            value={String(draft[key])}
            onChange={(e) => change({ ...draft, [key]: e.target.value })}
          />
        )}
      </label>
    );
  if (!mounted || loading) return <div className="cms-login">Loading Thinklab Studio…</div>;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.replace("/admin/login");
    }
    return <div className="cms-login">Redirecting to login…</div>;
  }

  return (
    <div className="cms-app">
      <header className="cms-toolbar">
        <div className="cms-brand">
          thinklab<span> / studio</span>
        </div>
        <span className="cms-breadcrumb">
          {doc?.draft.title || "Your website"}{" "}
          <small> / {doc?.kind || "Workspace"}</small>
        </span>
        <span className="cms-save-state" role="status">
          {busy ? "Working…" : status}
        </span>
        <button
          disabled={!draft || busy || !canUndo}
          onClick={undo}
          title="Undo (⌘Z)"
        >
          ↶
        </button>
        <button
          disabled={!draft || busy || !canRedo}
          onClick={redo}
          title="Redo (⇧⌘Z)"
        >
          ↷
        </button>
        <button
          disabled={!doc || busy}
          onClick={() =>
            void run(async () => {
              await save();
            })
          }
        >
          Save draft
        </button>
        <button
          className="cms-revert-btn"
          disabled={!doc || busy}
          title="Revert draft back to published or saved version"
          onClick={() => void revertDraft()}
        >
          ↺ Revert
        </button>
        <button
          className="cms-primary"
          disabled={!doc || busy || (!isUserAdmin && user.role === "editor")}
          onClick={() =>
            void run(async () => {
              const d = await save();
              if (d) {
                const updated = await api("publish", {
                  id: d.id,
                  revision: d.revision,
                });
                setDoc(updated);
                setDraft(updated.draft);
                setStatus("Published");
                setDocs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                setFrameVersion((v) => v + 1);
              }
            })
          }
        >
          Publish ↗
        </button>
        <button
          type="button"
          className="cms-logout-btn"
          title="Sign out and erase 7-day session"
          onClick={() => void signOut()}
        >
          Logout ⇥
        </button>
      </header>
      {error && (
        <div className="cms-alert" role="alert">
          {error}
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      <aside className="cms-sidebar">
        <div className="cms-section-label">WORKSPACE</div>
        {[
          ["page", "Pages"],
          ["projects", "Projects"],
          ["blog", "Insights"],
          ["careers", "Careers"],
          ["global", "Header & Footer"],
          ["media", "Media Assets"],
          ["users", "Admin Access"],
        ].map(([key, label]) => (
          <button
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => {
              setTab(key);
              if (docs.length === 0) void refresh();
              if (key === "media")
                void run(async () => setAssets(await api("media")));
            }}
          >
            {label}
            <span>{docs.filter((d) => d.kind === key).length || ""}</span>
          </button>
        ))}
        <div className="cms-sidebar-divider" />
        {!["media", "users"].includes(tab) && (
          <>
            <div className="cms-section-label">
              {tab === "page"
                ? "PAGES"
                : tab === "projects"
                ? "PROJECTS"
                : tab === "blog"
                ? "INSIGHTS"
                : tab === "careers"
                ? "CAREERS"
                : "ENTRIES"}
              {tab !== "page" && tab !== "global" && (
                <button
                  title="Create new entry"
                  disabled={busy}
                  onClick={() => setTemplateModal(tab as Kind)}
                >
                  ＋
                </button>
              )}
            </div>
            <div className="cms-documents">
              {docs
                .filter((d) => d.kind === tab)
                .map((d) => {
                  const title = d.draft?.title?.trim() || d.slug || "Untitled";
                  return (
                    <div key={d.id} className="cms-document-row">
                      <button
                        className={`cms-document-item ${d.id === doc?.id ? "active" : ""}`}
                        onClick={() => open(d)}
                        title={title}
                      >
                        <i className={d.published ? "published" : ""} />
                        <span className="cms-doc-title">{title}</span>
                      </button>
                      {["projects", "blog", "careers"].includes(tab) && (
                        <button
                          type="button"
                          className="cms-delete-icon-btn"
                          title={`Delete ${title}`}
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteDocument(d.id, d.revision, title);
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        )}
        {doc && draft && !["media", "users"].includes(tab) && (
          <>
            <div className="cms-section-label">LAYERS</div>
            <div className="cms-layers">
              {fields
                .filter((f) => f.global === (doc.kind === "global"))
                .map((f) => (
                  <button
                    className={
                      "cms-layer " + (selected === f.key ? "active" : "")
                    }
                    key={f.key}
                    onClick={() => {
                      setSelected(f.key);
                      setPanel(
                        f.key.startsWith("entry.") ? "content" : "design",
                      );
                      frame.current?.contentWindow?.postMessage(
                        { type: "cms:focus", id: doc.id, key: f.key },
                        location.origin,
                      );
                    }}
                  >
                    {f.key.replaceAll(".", " ")}
                  </button>
                ))}
              {draft.sections.map((section, index) => (
                <button
                  key={section.id}
                  className={
                    "cms-layer " +
                    (selected === "section." + section.id ? "active" : "")
                  }
                  onClick={() => {
                    setSelected("section." + section.id);
                    setPanel("design");
                    frame.current?.contentWindow?.postMessage(
                      {
                        type: "cms:focus",
                        id: doc.id,
                        key: "section." + section.id,
                      },
                      location.origin,
                    );
                  }}
                >
                  {section.title || "Section " + (index + 1)}
                </button>
              ))}
            </div>
          </>
        )}
        <footer>
          <small>
            {user.email} · {user.role}
          </small>
          <button
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </footer>
      </aside>
      <section className="cms-workspace">
        {tab === "media" ? (
          <div className="cms-library">
            <h1>Media library</h1>
            <p>
              PNG, JPEG and WebP · up to 5 MB · unpublished assets stay private.
            </p>
            <label className="cms-upload">
              Upload image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void run(async () => {
                    const form = new FormData();
                    form.set("file", file);
                    form.set(
                      "alt",
                      prompt("Describe this image for accessibility") || "",
                    );
                    const r = await fetch("/api/cms/upload", {
                      method: "POST",
                      body: form,
                    });
                    const result = await r.json();
                    if (!r.ok) throw new Error(result.error);
                    setAssets(await api("media"));
                  });
                }}
              />
            </label>
            <div className="cms-assets">
              {assets.map((a) => (
                <article key={a.id}>
                  <Image
                    unoptimized
                    width={220}
                    height={150}
                    src={"/api/cms-media/" + a.id}
                    alt={a.alt}
                  />
                  <strong>{a.name}</strong>
                  <small>{a.alt || "No alt text"}</small>
                  <button
                    disabled={
                      !draft ||
                      (["page", "global"].includes(doc?.kind || "") &&
                        !mediaSection)
                    }
                    onClick={() => {
                      if (draft) {
                        change(
                          ["page", "global"].includes(doc?.kind || "")
                            ? {
                                ...draft,
                                sections: draft.sections.map((s) =>
                                  s.id === mediaSection
                                    ? {
                                        ...s,
                                        image: "/api/cms-media/" + a.id,
                                        alt: a.alt,
                                      }
                                    : s,
                                ),
                              }
                            : {
                                ...draft,
                                image: "/api/cms-media/" + a.id,
                                alt: a.alt,
                              },
                        );
                        setTab(doc?.kind || "page");
                      }
                    }}
                  >
                    Use in current entry
                  </button>
                  <button
                    onClick={() => {
                      const alt = prompt("Image alt text", a.alt);
                      if (alt !== null)
                        void run(async () => {
                          await api("media-alt", { id: a.id, alt });
                          setAssets(await api("media"));
                        });
                    }}
                  >
                    Edit alt text
                  </button>
                  <button
                    disabled={!isUserAdmin && user.role === "editor"}
                    onClick={() => {
                      if (confirm("Delete this unused asset?"))
                        void run(async () => {
                          await api("media-delete", { id: a.id });
                          setAssets(await api("media"));
                        });
                    }}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : tab === "users" ? (
          <form
            className="cms-library"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              void run(async () => {
                await api("user", Object.fromEntries(new FormData(form)));
                form.reset();
                setStatus("User created");
              });
            }}
          >
            <h1>Invite a teammate</h1>
            <p>
              Create credentials securely. Share them through your existing
              secure channel.
            </p>
            <label className="cms-field">
              Email
              <input name="email" type="email" required />
            </label>
            <label className="cms-field">
              Initial password
              <input
                name="password"
                type="password"
                minLength={14}
                maxLength={200}
                required
              />
            </label>
            <label className="cms-field">
              Role
              <select name="role">
                <option value="editor">Editor — drafts and media</option>
                <option value="publisher">
                  Publisher — publish and unpublish
                </option>
                <option value="admin">Administrator — manage access</option>
              </select>
            </label>
            <button
              disabled={busy || !isUserAdmin}
              className="cms-primary"
            >
              Create user
            </button>
          </form>
        ) : doc && draft ? (
          <>
            <div className="cms-firsttime-banner">
              <span><strong>Visual Editor:</strong> Hover & click any text on the website preview to edit it. Or click <strong>＋</strong> on the left to add a new project, insight, or career.</span>
            </div>
            <div className="cms-canvas-toolbar">
              {[
                [1280, "Desktop"],
                [768, "Tablet"],
                [390, "Mobile"],
              ].map(([width, label]) => (
                <button
                  key={width}
                  className={size === width ? "active" : ""}
                  onClick={() => setSize(Number(width))}
                >
                  {label}
                </button>
              ))}
              <span>{size}px</span>
              <a
                href={documentPath(doc) + "?__cms_preview=" + doc.id}
                target="_blank"
                rel="noreferrer"
              >
                Protected preview ↗
              </a>
              <a href={documentPath(doc)} target="_blank" rel="noreferrer">
                Public page ↗
              </a>
            </div>
            <div ref={canvasArea} className="cms-canvas-scroll">
              <div
                style={{
                  width: size * zoom,
                  height: 900 * zoom,
                  flexShrink: 0,
                  margin: "0 auto",
                }}
              >
                <iframe
                  key={doc.id + frameVersion}
                  ref={frame}
                  title="Live website canvas"
                  src={documentPath(doc) + "?__cms_preview=" + doc.id}
                  style={{
                    width: size,
                    height: 900,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                />
              </div>
            </div>
            <div className="cms-canvas-note">
              Actual website · Click registered text to edit · Preview requires
              sign-in
            </div>
          </>
        ) : (
          <div className="cms-empty">
            <span>✳</span>
            <h1>
              Your website.
              <br />
              Your next idea.
            </h1>
            <p>Select a page or collection entry to begin editing.</p>
          </div>
        )}
      </section>
      {doc && draft && !["media", "users"].includes(tab) && (
        <aside className="cms-inspector">
          <fieldset disabled={busy}>
            <div className="cms-inspector-tabs">
              {[
                "design",
                "content",
                ...(doc.kind === "global" ? [] : ["seo"]),
                "history",
              ].map((p) => (
                <button
                  key={p}
                  className={panel === p ? "active" : ""}
                  onClick={() => {
                    setPanel(p);
                    if (p === "history")
                      void run(async () =>
                        setVersions(await api("versions?id=" + doc.id)),
                      );
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            {panel === "design" && (
              <>
                <h2>Layers & properties</h2>
                <p className="cms-hint">
                  Select registered text in the canvas or layer list. Existing
                  animation components stay protected.
                </p>
                {selected && (
                  <strong className="cms-selected-name">{selected}</strong>
                )}
                {selected &&
                  !selected.startsWith("section.") &&
                  !selected.startsWith("entry.") && (
                    <>
                      <label className="cms-field">
                        {selected.endsWith(".href")
                          ? "Destination URL"
                          : "Text"}
                        <textarea
                          value={
                            draft.fields[selected] ??
                            fields.find((f) => f.key === selected)?.value ??
                            ""
                          }
                          onChange={(e) =>
                            change({
                              ...draft,
                              fields: {
                                ...draft.fields,
                                [selected]: e.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      {!selected.endsWith(".href") && (
                        <>
                          <label className="cms-field">
                            Font
                            <select
                              value={draft.styles[selected]?.fontFamily || ""}
                              onChange={(e) =>
                                change({
                                  ...draft,
                                  styles: {
                                    ...draft.styles,
                                    [selected]: {
                                      ...draft.styles[selected],
                                      fontFamily: e.target.value,
                                    },
                                  },
                                })
                              }
                            >
                              <option value="">Inherit website font</option>
                              <option value="var(--font-grotesk)">
                                Space Grotesk
                              </option>
                              <option value="var(--font-fraunces)">
                                Fraunces
                              </option>
                              <option value="var(--font-plex)">
                                IBM Plex Mono
                              </option>
                            </select>
                          </label>
                          {["color", "background", "fontSize", "padding"].map(
                            (prop) => (
                              <label className="cms-field" key={prop}>
                                {prop}
                                <input
                                  placeholder={
                                    prop === "color" || prop === "background"
                                      ? "#ffffff"
                                      : "Inherited"
                                  }
                                  value={
                                    (
                                      draft.styles[selected] as Record<
                                        string,
                                        string | number
                                      >
                                    )?.[prop] ?? ""
                                  }
                                  type={
                                    prop === "fontSize" || prop === "padding"
                                      ? "number"
                                      : "text"
                                  }
                                  min={0}
                                  max={prop === "fontSize" ? 160 : 200}
                                  onChange={(e) => {
                                    const styles = {
                                      ...draft.styles[selected],
                                    } as Record<string, string | number>;
                                    if (!e.target.value) delete styles[prop];
                                    else
                                      styles[prop] =
                                        prop === "fontSize" ||
                                        prop === "padding"
                                          ? Number(e.target.value)
                                          : e.target.value;
                                    change({
                                      ...draft,
                                      styles: {
                                        ...draft.styles,
                                        [selected]: styles,
                                      },
                                    });
                                  }}
                                />
                              </label>
                            ),
                          )}
                        </>
                      )}
                    </>
                  )}
                {["page", "global"].includes(doc.kind) && (
                  <div style={{ marginTop: 20, marginBottom: 20, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
                    <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Page Text ({availableFields.length} fields)
                    </h2>
                    <p className="cms-hint" style={{ marginBottom: 14 }}>
                      Edit any text on this page directly. Changes reflect in your preview and save to draft.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {availableFields.map((f) => {
                        const val =
                          draft.fields[f.key] ??
                          fields.find((x) => x.key === f.key)?.value ??
                          f.defaultValue ??
                          "";
                        return (
                          <label className="cms-field" key={f.key} style={{ margin: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: 11,
                                color: "rgba(255,255,255,0.75)",
                                marginBottom: 4,
                              }}
                            >
                              <strong>{f.label}</strong>
                              <code style={{ fontSize: 9, opacity: 0.5 }}>{f.key}</code>
                            </div>
                            <textarea
                              value={val}
                              rows={val.length > 60 ? 3 : 1}
                              placeholder={f.defaultValue || `Enter ${f.label}`}
                              onChange={(e) =>
                                change({
                                  ...draft,
                                  fields: {
                                    ...draft.fields,
                                    [f.key]: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {["page", "global"].includes(doc.kind) && (
                  <>
                    <h2>Additional sections</h2>
                    {selected.startsWith("section.") && (
                      <button onClick={() => setSelected("")}>
                        Show all sections
                      </button>
                    )}
                    {draft.sections.map((s, i) =>
                      selected.startsWith("section.") &&
                      selected !== "section." + s.id ? null : (
                        <div key={s.id} className="cms-section-edit">
                          <strong>{s.type}</strong>
                          {s.type === "image" && (
                            <button
                              onClick={() => {
                                setMediaSection(s.id);
                                setTab("media");
                                void run(async () =>
                                  setAssets(await api("media")),
                                );
                              }}
                            >
                              Choose image
                            </button>
                          )}
                          <button
                            disabled={i === 0}
                            onClick={() => {
                              const sections = [...draft.sections];
                              [sections[i - 1], sections[i]] = [
                                sections[i],
                                sections[i - 1],
                              ];
                              change({ ...draft, sections });
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() =>
                              change({
                                ...draft,
                                sections: draft.sections.filter(
                                  (x) => x.id !== s.id,
                                ),
                              })
                            }
                          >
                            Remove
                          </button>
                          {(
                            [
                              "title",
                              "body",
                              ...(s.type === "cta" ? ["href" as const] : []),
                              ...(s.type === "image" ? ["alt" as const] : []),
                              "background",
                              "color",
                            ] as const
                          ).map((k) => (
                            <label className="cms-field" key={k}>
                              {k}
                              <textarea
                                value={s[k]}
                                onChange={(e) =>
                                  change({
                                    ...draft,
                                    sections: draft.sections.map((x) =>
                                      x.id === s.id
                                        ? { ...x, [k]: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                              />
                            </label>
                          ))}
                          <label className="cms-field">
                            Spacing
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={s.padding}
                              onChange={(e) =>
                                change({
                                  ...draft,
                                  sections: draft.sections.map((x) =>
                                    x.id === s.id
                                      ? {
                                          ...x,
                                          padding: Number(e.target.value),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </label>
                          <label className="cms-field">
                            Alignment
                            <select
                              value={s.align}
                              onChange={(e) =>
                                change({
                                  ...draft,
                                  sections: draft.sections.map((x) =>
                                    x.id === s.id
                                      ? {
                                          ...x,
                                          align: e.target.value as
                                            | "left"
                                            | "center",
                                        }
                                      : x,
                                  ),
                                })
                              }
                            >
                              <option>left</option>
                              <option>center</option>
                            </select>
                          </label>
                        </div>
                      ),
                    )}
                    <select
                      aria-label="Add section"
                      value=""
                      onChange={(e) => {
                        if (e.target.value)
                          change({
                            ...draft,
                            sections: [
                              ...draft.sections,
                              {
                                id: crypto.randomUUID(),
                                type: e.target.value as
                                  | "text"
                                  | "hero"
                                  | "cta"
                                  | "image",
                                image: "",
                                alt: "",
                                title: "",
                                body: "",
                                href: "",
                                color: "",
                                background: "",
                                padding: 64,
                                align: "left",
                              },
                            ],
                          });
                      }}
                    >
                      <option value="">＋ Add registered section</option>
                      <option value="text">Editorial text</option>
                      <option value="hero">Statement</option>
                      <option value="cta">Call to action</option>
                      <option value="image">Image</option>
                    </select>
                  </>
                )}
              </>
            )}
            {panel === "content" && (
              <>
                <h2>Entry content</h2>
                {field("title", "Title")}
                {["page", "global"].includes(doc.kind) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                    <p className="cms-hint">
                      Edit page text directly below or switch to the Design tab for visual previews.
                    </p>
                    {availableFields.map((f) => {
                      const val =
                        draft.fields[f.key] ??
                        fields.find((x) => x.key === f.key)?.value ??
                        f.defaultValue ??
                        "";
                      return (
                        <label className="cms-field" key={f.key} style={{ margin: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 11,
                              color: "rgba(255,255,255,0.75)",
                              marginBottom: 4,
                            }}
                          >
                            <strong>{f.label}</strong>
                            <code style={{ fontSize: 9, opacity: 0.5 }}>{f.key}</code>
                          </div>
                          <textarea
                            value={val}
                            rows={val.length > 60 ? 3 : 1}
                            placeholder={f.defaultValue || `Enter ${f.label}`}
                            onChange={(e) =>
                              change({
                                ...draft,
                                fields: {
                                  ...draft.fields,
                                  [f.key]: e.target.value,
                                },
                              })
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {field("summary", "Summary", true)}
                    <ImageField
                      label="Cover Image (Cloudinary URL or PC Upload)"
                      value={draft.image || ""}
                      onChange={(newUrl) => change({ ...draft, image: newUrl })}
                      assets={assets}
                      disabled={busy}
                    />
                    {field("alt", "Image description")}
                    {field("category", "Category")}
                    {field("tags", "Tags, separated by commas")}
                    {field("date", "Display date")}
                    {doc.kind === "careers" &&
                      field("apply", "Application URL")}
                    {draft.archive && (
                      <p className="cms-hint">
                        Archived case study: keeps its existing destination.
                      </p>
                    )}
                    {field("source", "Original source URL")}
                    <h2>Rich text blocks</h2>
                    {draft.blocks.map((b, i) => (
                      <div className="cms-section-edit" key={i}>
                        <select
                          value={b.type}
                          onChange={(e) =>
                            change({
                              ...draft,
                              blocks: draft.blocks.map((x, j) =>
                                j === i ? { ...x, type: e.target.value } : x,
                              ),
                            })
                          }
                        >
                          {["p", "h2", "h3", "h4", "h5", "li"].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                        <textarea
                          aria-label={`Block ${i + 1}`}
                          value={b.text}
                          onChange={(e) =>
                            change({
                              ...draft,
                              blocks: draft.blocks.map((x, j) =>
                                j === i ? { ...x, text: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <button
                          onClick={() =>
                            change({
                              ...draft,
                              blocks: draft.blocks.filter((_, j) => i !== j),
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        change({
                          ...draft,
                          blocks: [...draft.blocks, { type: "p", text: "" }],
                        })
                      }
                    >
                      ＋ Paragraph
                    </button>
                  </>
                )}
                <hr />
                <button
                  disabled={busy || (!isUserAdmin && user.role === "editor") || !doc.published}
                  onClick={() => {
                    if (confirm("Unpublish this entry?"))
                      void run(() => operation("unpublish"));
                  }}
                >
                  Unpublish
                </button>
                <button
                  disabled={busy || (!isUserAdmin && user.role === "editor")}
                  onClick={() => {
                    if (
                      confirm(
                        "Delete this entry? Its versions remain in the database.",
                      )
                    )
                      void run(() => operation("delete"));
                  }}
                >
                  Delete entry
                </button>
              </>
            )}
            {panel === "seo" && (
              <>
                <h2>Search & sharing</h2>
                <p className="cms-hint">Route: {documentPath(doc)}</p>
                {field("seoTitle", "SEO title")}
                {field("seoDescription", "Meta description", true)}
                {field("canonical", "Canonical URL (optional)")}
                <p>
                  New slugs are chosen at creation. Existing routes are
                  preserved.
                </p>
              </>
            )}
            {panel === "history" && (
              <>
                <h2>Version history</h2>
                <p className="cms-hint">
                  Restoring creates a draft. Publish separately when ready.
                </p>
                {versions.map((v) => (
                  <div className="cms-version" key={v.id}>
                    <strong>{v.action}</strong>
                    <small>
                      {new Date(v.created).toLocaleString()}
                      <br />
                      {v.actor}
                    </small>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(() => operation("restore", { version: v.id }))
                      }
                    >
                      Restore as draft
                    </button>
                  </div>
                ))}
                {!versions.length && <p>No saved versions yet.</p>}
              </>
            )}
          </fieldset>
        </aside>
      )}
      {templateModal && (
        <TemplateModal
          key={templateModal}
          kind={templateModal}
          isOpen={true}
          onClose={() => setTemplateModal(null)}
          onSubmit={async ({ title, slug, content: newContent }) => {
            await run(async () => {
              const d = await api("create", { kind: templateModal, title, slug, content: newContent });
              await refresh();
              open(d);
            });
          }}
          assets={assets}
          busy={busy}
        />
      )}
    </div>
  );
}
