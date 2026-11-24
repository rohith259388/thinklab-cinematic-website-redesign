"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ComponentProps,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SplitWords } from "@/components/ui/Reveal";
import type { Content, Section } from "@/lib/cms/schema";
import { validateContent } from "@/lib/cms/schema";
import { SectionView } from "./Sections";

export type MenuLink = { title: string; href: string };
const Context = createContext<{
  page: Content | null;
  global: Content | null;
  previewId?: string | null;
  menu?: MenuLink[];
}>({ page: null, global: null, previewId: null, menu: [] });

/** Reads the raw (unformatted) value an inline-edit path points at. */
function readPath(content: Content | null, path: string): string | undefined {
  if (!content) return undefined;
  const [scope, a, b, c, d] = path.split(":");
  if (scope === "f") return content.fields[a];
  if (scope === "e") return String((content as unknown as Record<string, unknown>)[a] ?? "");
  if (scope === "b") {
    const block = content.blocks[Number(a)];
    if (block && b === "items") {
      const item = block.items?.[Number(c)];
      return item && (d === "title" || d === "body") ? item[d] : undefined;
    }
    return block ? (b === "extra" ? block.extra ?? "" : block.text) : undefined;
  }
  if (scope === "q") {
    // Blog FAQ: "q:heading" or "q:items:<index>:title|body"
    if (a === "heading") return content.faq?.heading ?? "";
    const item = content.faq?.items[Number(b)];
    return item && (c === "title" || c === "body") ? item[c] : undefined;
  }
  if (scope === "s") {
    const section = content.sections.find((x) => x.id === a);
    if (!section) return undefined;
    if (b === "items") {
      const item = section.items[Number(c)];
      return item ? String(item[d as keyof typeof item] ?? "") : undefined;
    }
    return String(section[b as keyof Section] ?? "");
  }
  return undefined;
}

/**
 * Framer-style inline editing: a text box drawn over the clicked text and styled
 * like it. It lives outside React's tree, so it can never corrupt rendered markup.
 */
function openInlineEditor(
  el: HTMLElement,
  value: string,
  multiline: boolean,
  commit: (value: string) => void,
) {
  document.getElementById("cms-inline-editor")?.remove();
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const box = document.createElement("div");
  box.id = "cms-inline-editor";
  const area = document.createElement("textarea");
  const hint = document.createElement("div");
  hint.textContent = multiline
    ? "Ctrl+Enter to save · Esc to cancel"
    : "Enter to save · Esc to cancel";
  area.value = value;
  Object.assign(box.style, {
    position: "fixed",
    left: Math.max(4, rect.left - 6) + "px",
    top: Math.max(26, rect.top - 6) + "px",
    width: Math.min(innerWidth - 8, Math.max(220, rect.width + 12)) + "px",
    zIndex: "2147483647",
  });
  Object.assign(area.style, {
    display: "block",
    width: "100%",
    minHeight: rect.height + 12 + "px",
    maxHeight: "70vh",
    padding: "6px",
    margin: "0",
    border: "2px solid #8c64ff",
    borderRadius: "6px",
    outline: "none",
    resize: "none",
    overflow: "auto",
    background: "rgba(14,12,22,0.96)",
    boxShadow: "0 12px 40px rgba(0,0,0,.45)",
    color: cs.color === "rgba(0, 0, 0, 0)" ? "#fff" : cs.color,
    fontSize: cs.fontSize,
    fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
    textAlign: cs.textAlign,
  });
  Object.assign(hint.style, {
    position: "absolute",
    top: "-22px",
    left: "0",
    padding: "2px 8px",
    borderRadius: "4px",
    background: "#8c64ff",
    color: "#fff",
    font: "600 11px/18px Arial, sans-serif",
    letterSpacing: "0",
    textTransform: "none",
    whiteSpace: "nowrap",
  });
  const grow = () => {
    area.style.height = "auto";
    area.style.height = area.scrollHeight + 4 + "px";
  };
  let done = false;
  const onScroll = (ev: Event) => {
    if (ev.target !== area) close(true);
  };
  function close(save: boolean) {
    if (done) return;
    done = true;
    if (save && area.value !== value) commit(area.value);
    box.remove();
    removeEventListener("scroll", onScroll, true);
  }
  area.addEventListener("input", grow);
  area.addEventListener("blur", () => close(true));
  area.addEventListener("keydown", (ev) => {
    ev.stopPropagation();
    if (ev.key === "Escape") close(false);
    else if (ev.key === "Enter" && (multiline ? ev.ctrlKey || ev.metaKey : !ev.shiftKey)) {
      ev.preventDefault();
      close(true);
    }
  });
  // Smooth-scroll handlers should not react while typing.
  area.addEventListener("wheel", (ev) => ev.stopPropagation());
  box.append(hint, area);
  document.body.append(box);
  grow();
  area.focus();
  area.setSelectionRange(area.value.length, area.value.length);
  addEventListener("scroll", onScroll, true);
}

export function CanvasProvider({
  children,
  registerCanvas = true,
  ...initial
}: {
  children: ReactNode;
  registerCanvas?: boolean;
  page: Content | null;
  global: Content | null;
  previewId?: string | null;
  menu?: MenuLink[];
}) {
  const [override, setOverride] = useState<{
    content: Content;
    global: boolean;
  } | null>(null);
  const pathname = usePathname();
  const current = useRef<{ content: Content | null; global: boolean }>({
    content: initial.page,
    global: false,
  });
  useEffect(() => {
    if (!initial.previewId) return;
    const id = initial.previewId;
    const send = (data: Record<string, unknown>) =>
      parent.postMessage({ ...data, id }, location.origin);
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== parent ||
        e.data?.id !== id
      )
        return;
      if (e.data.type === "cms:focus" && typeof e.data.key === "string") {
        if (e.data.key.startsWith("hero.")) {
          window.scrollTo({ top: 0, behavior: "instant" });
          return;
        }
        document
          .querySelector<HTMLElement>(
            e.data.key.startsWith("entry.")
              ? `[data-cms-entry="${CSS.escape(e.data.key.slice(6))}"]`
              : e.data.key.startsWith("section.")
                ? `[data-cms-section="${CSS.escape(e.data.key.slice(8))}"]`
                : `[data-cms-field="${CSS.escape(e.data.key)}"]`,
          )
          ?.scrollIntoView({ block: "center" });
        return;
      }
      if (e.data.type !== "cms:update") return;
      try {
        const content = validateContent(e.data.content);
        const global = e.data.global === true;
        current.current = { content, global };
        setOverride({ content, global });
      } catch {}
    };
    const click = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest("#cms-inline-editor")) return;
      const el = target.closest<HTMLElement>(
        "[data-cms-edit], [data-cms-pick], [data-cms-field], [data-cms-entry], [data-cms-section]",
      );
      // Open/close controls (FAQ arrows) keep working in the preview, except
      // when the click lands on editable text inside them.
      const toggle = target.closest("[data-cms-toggle]");
      if (toggle && !(el?.dataset.cmsEdit && toggle.contains(el))) return;
      if (!el) {
        if (target.closest("a")) e.preventDefault();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const isGlobal = el.dataset.cmsGlobal === "true";
      // `path` opens the in-place text editor; `focus` tells the Studio which
      // control in the right-hand panel to reveal and highlight.
      let path = "";
      let key = "";
      let focus = "";
      const keyFor = (p: string) => {
        const [scope, a] = p.split(":");
        return scope === "s" ? "section." + a : scope === "b" ? "entry.blocks" : "entry." + a;
      };
      if (el.dataset.cmsEdit) {
        path = focus = el.dataset.cmsEdit;
        key = keyFor(path);
      } else if (el.dataset.cmsPick) {
        focus = el.dataset.cmsPick;
        key = keyFor(focus);
      } else if (el.dataset.cmsField) {
        key = el.dataset.cmsField;
        focus = "f:" + key;
        if (!key.endsWith(".href")) path = focus;
      } else if (el.dataset.cmsEntry) {
        key = "entry." + el.dataset.cmsEntry;
        focus = "e:" + el.dataset.cmsEntry;
        if (["title", "summary"].includes(el.dataset.cmsEntry)) path = focus;
      } else {
        key = "section." + el.dataset.cmsSection;
        focus = "s:" + el.dataset.cmsSection;
      }
      send({
        type: "cms:select",
        key,
        focus,
        value: el.dataset.cmsValue || el.textContent,
        global: isGlobal,
      });
      // Shared header/footer text is edited from the Header & Footer document.
      if (!path || isGlobal !== current.current.global) return;
      const raw = readPath(current.current.content, path) ?? el.textContent ?? "";
      const multiline =
        /(:body|:summary|:extra)$/.test(path) ||
        path.startsWith("b:") ||
        raw.includes("\n");
      openInlineEditor(el, raw, multiline, (value) =>
        send({ type: "cms:edit", path, value }),
      );
    };
    const register = () =>
      send({
        type: "cms:ready",
        fields: Array.from(
          document.querySelectorAll<HTMLElement>(
            "[data-cms-field], [data-cms-entry]",
          ),
        ).map((e) => ({
          key: e.dataset.cmsEntry
            ? "entry." + e.dataset.cmsEntry
            : e.dataset.cmsField,
          value: e.dataset.cmsValue || e.textContent,
          global: e.dataset.cmsGlobal === "true",
        })),
      });
    window.addEventListener("message", receive);
    if (registerCanvas) {
      document.addEventListener("click", click, true);
      register();
    }
    return () => {
      window.removeEventListener("message", receive);
      document.removeEventListener("click", click, true);
      document.getElementById("cms-inline-editor")?.remove();
    };
  }, [initial.previewId, pathname, registerCanvas]);
  return (
    <Context.Provider
      value={{
        ...initial,
        ...(override
          ? override.global
            ? { global: override.content }
            : { page: override.content }
          : {}),
      }}
    >
      {initial.previewId && (
        <style>{`[data-cms-field],[data-cms-entry],[data-cms-section],[data-cms-edit],[data-cms-pick],.journey-caption,.journey-finale{pointer-events:auto !important}[data-cms-field]:hover,[data-cms-entry]:hover,[data-cms-edit]:hover{outline:2px solid #8c64ff !important;outline-offset:3px;cursor:text !important;background:rgba(140,100,255,0.12);border-radius:4px}[data-cms-pick]:hover{outline:2px solid #8c64ff !important;outline-offset:3px;cursor:pointer !important}[data-cms-section]:hover{outline:1px dashed rgba(140,100,255,.7);outline-offset:-4px;cursor:pointer}[data-cms-field],[data-cms-section]{scroll-margin-top:100px}`}</style>
      )}
      {children}
    </Context.Provider>
  );
}
export function CmsText({
  field,
  children,
  global = false,
  split = false,
}: {
  field: string;
  children: ReactNode;
  global?: boolean;
  split?: boolean;
}) {
  const c = useContext(Context),
    d = global ? c.global : c.page;
  const value = d?.fields[field];
  return (
    <span
      data-cms-field={field}
      data-cms-global={global}
      style={d?.styles[field]}
    >
      {value === undefined ? (
        children
      ) : split ? (
        <SplitWords text={value} />
      ) : (
        value
      )}
    </span>
  );
}
export function CmsSections({ global = false }: { global?: boolean }) {
  const c = useContext(Context);
  return (
    <>
      {(global ? c.global : c.page)?.sections.map((s) => (
        <SectionView
          key={s.id}
          section={s}
          preview={Boolean(c.previewId)}
          global={global}
        />
      ))}
    </>
  );
}
export function useCanvasContent() {
  return useContext(Context);
}

export function CmsLink({
  field,
  global = false,
  href,
  ...props
}: ComponentProps<typeof Link> & { field: string; global?: boolean }) {
  const c = useContext(Context);
  const value = (global ? c.global : c.page)?.fields[field + ".href"];
  return (
    <Link
      {...props}
      href={value || href}
      data-cms-field={field + ".href"}
      data-cms-value={String(value || href)}
      data-cms-global={global}
    />
  );
}
