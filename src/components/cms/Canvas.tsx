"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type ComponentProps,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SplitWords } from "@/components/ui/Reveal";
import type { Content, Section } from "@/lib/cms/schema";
import { validateContent } from "@/lib/cms/schema";
const Context = createContext<{
  page: Content | null;
  global: Content | null;
  previewId?: string | null;
}>({ page: null, global: null, previewId: null });
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
}) {
  const [override, setOverride] = useState<{
    content: Content;
    global: boolean;
  } | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (!initial.previewId) return;
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== parent ||
        e.data?.id !== initial.previewId
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
        setOverride({
          content: validateContent(e.data.content),
          global: e.data.global === true,
        });
      } catch {}
    };
    const click = (e: MouseEvent) => {
      const el = (e.target as Element).closest<HTMLElement>(
        "[data-cms-field], [data-cms-entry], [data-cms-section]",
      );
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        parent.postMessage(
          {
            type: "cms:select",
            id: initial.previewId,
            key: el.dataset.cmsEntry
              ? "entry." + el.dataset.cmsEntry
              : el.dataset.cmsSection
                ? "section." + el.dataset.cmsSection
                : el.dataset.cmsField,
            value: el.dataset.cmsValue || el.textContent,
            global: el.dataset.cmsGlobal === "true",
          },
          location.origin,
        );
      } else if ((e.target as Element).closest("a")) e.preventDefault();
    };
    const register = () =>
      parent.postMessage(
        {
          type: "cms:ready",
          id: initial.previewId,
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
        },
        location.origin,
      );
    window.addEventListener("message", receive);
    if (registerCanvas) {
      document.addEventListener("click", click, true);
      register();
    }
    return () => {
      window.removeEventListener("message", receive);
      document.removeEventListener("click", click, true);
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
        <style>{`[data-cms-field],[data-cms-entry],[data-cms-section],.journey-caption,.journey-finale{pointer-events:auto !important}[data-cms-field]:hover,[data-cms-entry]:hover,[data-cms-section]:hover{outline:2px solid #8c64ff !important;outline-offset:3px;cursor:pointer !important;background:rgba(140,100,255,0.12);border-radius:4px}[data-cms-field]{scroll-margin-top:100px}`}</style>
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
export const sectionRegistry = {
  text: { label: "Editorial text" },
  hero: { label: "Statement" },
  cta: { label: "Call to action" },
  image: { label: "Image" },
} satisfies Record<Section["type"], { label: string }>;
export function CmsSections({ global = false }: { global?: boolean }) {
  const c = useContext(Context);
  return (
    <>
      {(global ? c.global : c.page)?.sections.map((s) => (
        <section
          key={s.id}
          data-cms-section={s.id}
          data-cms-global={global}
          className="section-pad"
          style={{
            background: s.background || undefined,
            color: s.color || undefined,
            padding: s.padding,
            textAlign: s.align,
          }}
        >
          {s.type === "image" && s.image && (
            <Image
              unoptimized={s.image.startsWith("/api/cms-media/")}
              src={s.image}
              alt={s.alt}
              width={1600}
              height={900}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 16,
                marginBottom: 24,
              }}
            />
          )}
          <h2
            style={{
              fontSize:
                s.type === "hero"
                  ? "clamp(40px,7vw,100px)"
                  : "clamp(26px,4vw,56px)",
              lineHeight: 1.1,
            }}
          >
            {s.title}
          </h2>
          <p style={{ marginTop: 24, whiteSpace: "pre-wrap", maxWidth: 900 }}>
            {s.body}
          </p>
          {s.type === "cta" && s.href && (
            <Link
              href={s.href}
              className="btn-drop"
              style={{ marginTop: 24, padding: 18 }}
            >
              Find out more ↗
            </Link>
          )}
        </section>
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
