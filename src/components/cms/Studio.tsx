"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Document, type Content, documentPath } from "@/lib/cms/schema";
import "./studio.css";
type Field = { key: string; value: string; global: boolean };
type Asset = { id: string; name: string; mime: string; alt: string };
async function api(action: string, data?: unknown) {
  const r = await fetch("/api/cms/" + action, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const v = await r.json();
  if (!r.ok) throw new Error(v.error || "Request failed");
  return v;
}
export default function Studio() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(
      null,
    ),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [docs, setDocs] = useState<Document[]>([]),
    [doc, setDoc] = useState<Document | null>(null),
    [draft, setDraft] = useState<Content | null>(null),
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
    [setup, setSetup] = useState(false),
    [frameVersion, setFrameVersion] = useState(0),
    [canvasWidth, setCanvasWidth] = useState(700),
    [canUndo, setCanUndo] = useState(false),
    [canRedo, setCanRedo] = useState(false),
    [mediaSection, setMediaSection] = useState("");
  const canvasArea = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null),
    past = useRef<Content[]>([]),
    future = useRef<Content[]>([]),
    latest = useRef(draft);
  useEffect(() => {
    latest.current = draft;
  }, [draft]);
  const refresh = useCallback(async () => {
    const list = await api("documents");
    setDocs(list);
    return list as Document[];
  }, []);
  useEffect(() => {
    api("session")
      .then(async (u) => {
        setUser(u);
        await refresh();
      })
      .catch((e) => {
        if (e.message !== "Unauthorized") setError(e.message);
      })
      .finally(() => setLoading(false));
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
  const open = (d: Document) => {
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
  };
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
  const save = async () => {
    if (!doc || !latest.current) return;
    const updated = await api("save", {
      id: doc.id,
      revision: doc.revision,
      content: latest.current,
    });
    setDoc(updated);
    setDraft(updated.draft);
    setStatus("Saved");
    await refresh();
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
    await refresh();
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
          setError("Choose Shared content to edit header and footer content.");
          return;
        }
        setSelected(e.data.key);
        setPanel(e.data.key?.startsWith("entry.") ? "content" : "design");
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [doc]);
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
  if (loading) return <div className="cms-login">Loading Thinklab Studio…</div>;
  if (!user)
    return (
      <div className="cms-login">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run(async () => {
              await api(setup ? "setup" : "login", Object.fromEntries(f));
              setUser(await api("session"));
              await refresh();
            });
          }}
        >
          <div className="cms-brand">
            thinklab<span> / studio</span>
          </div>
          <h1>{setup ? "Create your first admin" : "Welcome back."}</h1>
          <p>A private workspace for your public ideas.</p>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={setup ? "new-password" : "current-password"}
              minLength={setup ? 14 : 1}
              required
            />
          </label>
          {setup && (
            <label>
              Setup secret
              <input name="secret" type="password" required />
              <small>Set CMS_SETUP_SECRET in .env.local first.</small>
            </label>
          )}
          {error && (
            <p role="alert" className="cms-error">
              {error}
            </p>
          )}
          <button disabled={busy} className="cms-primary">
            {busy ? "Connecting…" : setup ? "Create administrator" : "Sign in"}
          </button>
          <button type="button" onClick={() => setSetup(!setup)}>
            {setup ? "Back to sign in" : "First-time setup"}
          </button>
        </form>
      </div>
    );
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
          className="cms-primary"
          disabled={!doc || busy || user.role === "editor"}
          onClick={() =>
            void run(async () => {
              const d = await save();
              if (d) {
                const updated = await api("publish", {
                  id: d.id,
                  revision: d.revision,
                });
                setDoc(updated);
                setStatus("Published");
                await refresh();
                setFrameVersion((v) => v + 1);
              }
            })
          }
        >
          Publish ↗
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
          ["blog", "Journal"],
          ["careers", "Careers"],
          ["global", "Shared content"],
          ["media", "Media library"],
          ["users", "Team access"],
        ].map(([key, label]) => (
          <button
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => {
              setTab(key);
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
              {tab === "page" ? "PAGES" : "ENTRIES"}
              <button
                title="Create new entry"
                disabled={tab === "global" || busy}
                onClick={() => {
                  const title = prompt("Entry title");
                  if (!title) return;
                  const slug = prompt(
                    "URL slug (lowercase words separated by hyphens)",
                    title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  );
                  if (!slug) return;
                  void run(async () => {
                    const d = await api("create", { kind: tab, title, slug });
                    await refresh();
                    open(d);
                  });
                }}
              >
                ＋
              </button>
            </div>
            <div className="cms-documents">
              {docs
                .filter((d) => d.kind === tab)
                .map((d) => (
                  <button
                    key={d.id}
                    className={d.id === doc?.id ? "active" : ""}
                    onClick={() => open(d)}
                  >
                    <i className={d.published ? "published" : ""} />
                    <span>{d.draft.title}</span>
                  </button>
                ))}
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
            onClick={() =>
              void run(async () => {
                await api("logout", {});
                setUser(null);
                setDocs([]);
                setDoc(null);
                setDraft(null);
              })
            }
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
                    disabled={user.role === "editor"}
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
              disabled={busy || user.role !== "admin"}
              className="cms-primary"
            >
              Create user
            </button>
          </form>
        ) : doc && draft ? (
          <>
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
                  <p className="cms-hint">
                    Edit the page’s visible text and layout in Design. This
                    title identifies the document in your workspace.
                  </p>
                ) : (
                  <>
                    {field("summary", "Summary", true)}
                    {field("image", "Image path (or select in Media)")}
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
                  disabled={busy || user.role === "editor" || !doc.published}
                  onClick={() => {
                    if (confirm("Unpublish this entry?"))
                      void run(() => operation("unpublish"));
                  }}
                >
                  Unpublish
                </button>
                <button
                  disabled={busy || user.role === "editor"}
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
    </div>
  );
}
