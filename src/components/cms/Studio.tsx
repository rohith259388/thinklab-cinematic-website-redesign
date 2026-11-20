"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Document, type Content, type Kind, documentPath } from "@/lib/cms/schema";
import TemplateModal from "./TemplateModal";
import ImageField from "./ImageField";
import PageModal from "./builder/PageModal";
import PageSections from "./builder/PageSections";
import BlockEditor from "./builder/BlockEditor";
import SeoFields from "./builder/SeoFields";
import { baseLinks } from "./builder/shared";
import { builtInPages } from "@/lib/cms/blocks";
import "./studio.css";
import "./builder/builder.css";
type Field = { key: string; value: string; global: boolean };

/** Applies an inline edit made in the preview (see Canvas.tsx readPath for the path format). */
function applyPath(c: Content, path: string, value: string): Content | null {
  const [scope, a, b, idx, key] = path.split(":");
  if (scope === "f" && a) return { ...c, fields: { ...c.fields, [a]: value } };
  if (scope === "e" && (a === "title" || a === "summary")) return { ...c, [a]: value };
  if (scope === "b") {
    const i = Number(a);
    if (!c.blocks[i]) return null;
    if (b === "items") {
      if (key !== "title" && key !== "body") return null;
      const k = Number(idx);
      return {
        ...c,
        blocks: c.blocks.map((x, j) =>
          j === i
            ? { ...x, items: (x.items ?? []).map((it, m) => (m === k ? { ...it, [key]: value } : it)) }
            : x,
        ),
      };
    }
    return {
      ...c,
      blocks: c.blocks.map((x, j) =>
        j === i ? (b === "extra" ? { ...x, extra: value } : { ...x, text: value }) : x,
      ),
    };
  }
  if (scope === "s") {
    return {
      ...c,
      sections: c.sections.map((s) => {
        if (s.id !== a) return s;
        if (b === "items" && (key === "title" || key === "body")) {
          const k = Number(idx);
          return { ...s, items: s.items.map((it, j) => (j === k ? { ...it, [key]: value } : it)) };
        }
        if (["title", "body", "kicker", "label"].includes(b)) return { ...s, [b]: value };
        return s;
      }),
    };
  }
  return null;
}
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
  !(d.kind === "global" || (d.kind === "page" && builtInPages.includes(d.slug)));

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
    [templateModal, setTemplateModal] = useState<Kind | null>(null),
    [pageModal, setPageModal] = useState(false),
    // What was last clicked in the preview, so the panel can reveal it. `tick`
    // changes on every click so clicking the same thing twice still re-focuses.
    [focus, setFocus] = useState<{ path: string; tick: number }>({ path: "", tick: 0 }),
    [showPageText, setShowPageText] = useState(false);
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
  // Image pickers everywhere offer the media library, so load it once up front.
  useEffect(() => {
    if (!user) return;
    api("media")
      .then((list) => setAssets(list))
      .catch(() => {});
  }, [user]);
  const changeRef = useRef<(next: Content) => void>(() => {});
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
  useEffect(() => {
    changeRef.current = change;
  });
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
    setPanel(d.kind === "page" || d.kind === "global" ? "design" : "content");
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
    const itemType = tab === "projects" ? "project" : tab === "blog" ? "insight" : tab === "careers" ? "career" : tab === "page" ? "page" : "entry";
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
      if (
        e.data.type === "cms:edit" &&
        typeof e.data.path === "string" &&
        typeof e.data.value === "string" &&
        latest.current
      ) {
        const next = applyPath(latest.current, e.data.path, e.data.value);
        if (next) changeRef.current(next);
        return;
      }
      if (e.data.type === "cms:select") {
        setFocus({ path: typeof e.data.focus === "string" ? e.data.focus : "", tick: Date.now() });
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
  // Scroll the right-hand panel to the control for what was clicked and highlight it.
  // Collapsed parents open on the same click, so retry briefly until it renders.
  useEffect(() => {
    if (!focus.path) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const find = (root: Element) => {
      const parts = focus.path.split(":");
      for (let n = parts.length; n >= 2; n--) {
        const el = root.querySelector<HTMLElement>(
          `[data-edit-path="${CSS.escape(parts.slice(0, n).join(":"))}"]`,
        );
        if (el) return el;
      }
      return null;
    };
    const reveal = () => {
      const root = document.querySelector(".cms-inspector");
      const el = root && find(root);
      if ((!el || el.dataset.editPath !== focus.path) && tries++ < 8) {
        timer = setTimeout(reveal, 60);
        return;
      }
      if (!root || !el) return;
      root.querySelectorAll(".cms-focused").forEach((x) => x.classList.remove("cms-focused"));
      // Restart the flash animation even when the same element is clicked again.
      void el.offsetWidth;
      el.classList.add("cms-focused");
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    timer = setTimeout(reveal, 40);
    return () => clearTimeout(timer);
  }, [focus]);
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

  // Pages offered by every link picker: built-in pages plus pages created here.
  const links = useMemo(
    () => [
      ...baseLinks,
      ...docs
        .filter((d) => d.kind === "page" && !builtInPages.includes(d.slug))
        .map((d) => ({ label: d.draft?.title || d.slug, href: "/" + d.slug })),
    ],
    [docs],
  );

  const seoBox = () =>
    draft &&
    doc && (
      <SeoFields
        title={draft.seoTitle}
        description={draft.seoDescription}
        fallbackTitle={draft.title}
        fallbackDescription={draft.summary}
        path={documentPath(doc)}
        onChange={(p) => change({ ...draft, ...p })}
      />
    );

  const field = (key: keyof Content, label: string, multiline = false) =>
    draft && (
      <label className="cms-field" data-edit-path={"e:" + String(key)}>
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
              {tab !== "global" && (
                <button
                  title={tab === "page" ? "Create a new page" : "Create new entry"}
                  disabled={busy}
                  onClick={() =>
                    tab === "page" ? setPageModal(true) : setTemplateModal(tab as Kind)
                  }
                >
                  ＋
                </button>
              )}
            </div>
            {tab !== "global" && (
              <button
                className="cms-new-btn"
                disabled={busy}
                onClick={() =>
                  tab === "page" ? setPageModal(true) : setTemplateModal(tab as Kind)
                }
              >
                ＋ New{" "}
                {tab === "page"
                  ? "page"
                  : tab === "projects"
                    ? "project"
                    : tab === "blog"
                      ? "blog post"
                      : "job opening"}
              </button>
            )}
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
                      {(["projects", "blog", "careers"].includes(tab) ||
                        (tab === "page" && isDeletable(d))) && (
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
                  {({ design: doc.kind === "page" || doc.kind === "global" ? "Edit page" : "Styles", content: doc.kind === "page" || doc.kind === "global" ? "Publish" : "Content", seo: "SEO", history: "History" } as Record<string, string>)[p] ?? p}
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
                    <div data-edit-path={"f:" + selected} className="cms-focus-target">
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
                    </div>
                  )}
                {["page", "global"].includes(doc.kind) && (
                  <>
                    {doc.kind === "page" && !builtInPages.includes(doc.slug) && (
                      <div className="cms-page-settings">
                        <h2>Page settings</h2>
                        {field("title", "Page name")}
                        <p className="cms-hint">Address: {documentPath(doc)}</p>
                        <label className="cms-check">
                          <input
                            type="checkbox"
                            checked={draft.fields["page.menu"] === "show"}
                            onChange={(e) => {
                              const fields = { ...draft.fields };
                              if (e.target.checked) fields["page.menu"] = "show";
                              else delete fields["page.menu"];
                              change({ ...draft, fields });
                            }}
                          />
                          Show in the website menu
                        </label>
                        {draft.fields["page.menu"] === "show" && (
                          <label className="cms-field">
                            Menu label (optional)
                            <input
                              placeholder={draft.title}
                              value={draft.fields["page.menuLabel"] ?? ""}
                              onChange={(e) => {
                                const fields = { ...draft.fields };
                                if (e.target.value) fields["page.menuLabel"] = e.target.value;
                                else delete fields["page.menuLabel"];
                                change({ ...draft, fields });
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                    {doc.kind !== "global" && (
                      <div className="cms-page-settings">
                        <h2>Google search (SEO)</h2>
                        {seoBox()}
                      </div>
                    )}
                    <h2>
                      {doc.kind === "global" ? "Sections on every page" : "Page sections"}
                    </h2>
                    <PageSections
                      sections={draft.sections}
                      onChange={(sections) => change({ ...draft, sections })}
                      selectedId={selected.startsWith("section.") ? selected.slice(8) : ""}
                      onSelect={(id) => {
                        setSelected(id ? "section." + id : "");
                        if (id)
                          frame.current?.contentWindow?.postMessage(
                            { type: "cms:focus", id: doc.id, key: "section." + id },
                            location.origin,
                          );
                      }}
                      assets={assets}
                      links={links}
                      disabled={busy}
                      focus={focus}
                      intro={
                        doc.kind === "global"
                          ? "These sections appear above the footer on every page of the website."
                          : builtInPages.includes(doc.slug)
                            ? "Tip: click any text in the preview to change it. Sections you add here appear below this page's built-in content."
                            : "Tip: click any text in the preview to change it, or open a section below to edit its text, images and style."
                      }
                    />
                    {availableFields.length > 0 && (
                      <div className="cms-page-text">
                        <button
                          type="button"
                          className="cms-style-toggle"
                          onClick={() => setShowPageText(!showPageText)}
                        >
                          {showPageText ? "▾" : "▸"} All text on this page ({availableFields.length})
                        </button>
                        {showPageText && (
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
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {panel === "content" && (
              <>
                <h2>Content</h2>
                {field("title", "Title")}
                {["page", "global"].includes(doc.kind) ? (
                  <p className="cms-hint">
                    Publishing makes your saved draft visible to everyone. Unpublishing
                    hides the page from visitors but keeps it here so you can edit it.
                    {doc.published ? " This page is live." : " This page is not published yet."}
                  </p>
                ) : (
                  <>
                    {field("summary", "Short summary (shown under the title)", true)}
                    <div className="cms-page-settings">
                      <h2>Google search (SEO)</h2>
                      {seoBox()}
                    </div>
                    <div data-edit-path="e:image">
                      <ImageField
                        label="Cover image"
                        value={draft.image || ""}
                        onChange={(newUrl) => change({ ...draft, image: newUrl })}
                        assets={assets}
                        disabled={busy}
                      />
                    </div>
                    {draft.image && field("alt", "Describe the cover image")}
                    <h2>
                      {doc.kind === "blog"
                        ? "Article"
                        : doc.kind === "careers"
                          ? "Job description"
                          : "Case study"}
                    </h2>
                    <p className="cms-hint">
                      Build the body from blocks: paragraphs, headings, lists, images,
                      quotes, FAQs and buttons. You can also click any text in the preview
                      to edit it there.
                    </p>
                    <BlockEditor
                      focus={focus}
                      blocks={draft.blocks}
                      onChange={(blocks) => change({ ...draft, blocks })}
                      assets={assets}
                      links={links}
                      disabled={busy}
                    />
                    <h2>Details</h2>
                    {field("category", "Category")}
                    {field("tags", "Tags, separated by commas")}
                    {field("date", "Display date")}
                    {doc.kind === "careers" &&
                      field("apply", "Application link (web address or mailto:)")}
                    {draft.archive && (
                      <p className="cms-hint">
                        Archived case study: keeps its existing destination.
                      </p>
                    )}
                    {field("source", "Original source link (optional)")}
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
                <h2>Google search (SEO)</h2>
                <p className="cms-hint">Address: {documentPath(doc)}</p>
                {seoBox()}
                {field("canonical", "Canonical URL (optional, advanced)")}
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
      {pageModal && (
        <PageModal
          existingSlugs={docs.filter((d) => d.kind === "page").map((d) => d.slug)}
          busy={busy}
          onClose={() => setPageModal(false)}
          onSubmit={async ({ title, slug, content }) => {
            await run(async () => {
              const d = await api("create", { kind: "page", title, slug, content });
              setPageModal(false);
              setTab("page");
              await refresh();
              open(d);
              setStatus("Page created: add sections, then Publish");
            });
          }}
        />
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
