import { Pool, type PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import data from "../live-content.json";
import { emptyContent, type Document, type Content, type Kind } from "./schema";
const g = globalThis as typeof globalThis & {
  cmsPool?: Pool;
  cmsReady?: Promise<void>;
};
export function database() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "CMS database is not configured. Set DATABASE_URL in .env.local.",
    );
  return (g.cmsPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    connectionTimeoutMillis: 5000,
  }));
}
export async function initialize() {
  if (!g.cmsReady)
    g.cmsReady = (async () => {
      const c = await database().connect();
      try {
        await c.query("BEGIN");
        await c.query("SELECT pg_advisory_xact_lock(820461)");
        await c.query(`CREATE TABLE IF NOT EXISTS cms_users(id text PRIMARY KEY,email text UNIQUE NOT NULL,password text NOT NULL,role text NOT NULL CHECK(role IN ('admin','publisher','editor')));
CREATE TABLE IF NOT EXISTS cms_sessions(token text PRIMARY KEY,user_id text NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,expires timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS cms_documents(id text PRIMARY KEY,kind text NOT NULL,slug text NOT NULL,draft jsonb NOT NULL,published jsonb,revision integer NOT NULL DEFAULT 1,deleted boolean NOT NULL DEFAULT false,updated timestamptz NOT NULL DEFAULT now(),UNIQUE(kind,slug));
CREATE TABLE IF NOT EXISTS cms_versions(id text PRIMARY KEY,document_id text NOT NULL REFERENCES cms_documents(id) ON DELETE CASCADE,content jsonb NOT NULL,action text NOT NULL,actor text NOT NULL,created timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS cms_media(id text PRIMARY KEY,name text NOT NULL,mime text NOT NULL,bytes bytea NOT NULL,alt text NOT NULL DEFAULT '',created timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS cms_login_attempts(key text PRIMARY KEY,attempts integer NOT NULL,expires timestamptz NOT NULL);`);
        for (const [kind, entries] of Object.entries({
          projects: data.projects,
          blog: data.articles,
          careers: data.careers,
        })) {
          for (const e of entries) {
            const slug = e.slug;
            const value = { ...emptyContent(), ...e, alt: e.title };
            await seed(c, kind as Kind, slug, value);
          }
        }
        for (const slug of [
          "/",
          "about",
          "services",
          "projects",
          "reviews",
          "blog",
          "careers",
          "contact",
        ])
          await seed(
            c,
            "page",
            slug,
            emptyContent(slug === "/" ? "Home" : slug),
          );
        await seed(c, "global", "site", emptyContent("Shared website content"));
        await c.query("COMMIT");
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    })().catch((e) => {
      g.cmsReady = undefined;
      throw e;
    });
  return g.cmsReady;
}
async function seed(c: PoolClient, kind: Kind, slug: string, value: Content) {
  await c.query(
    "INSERT INTO cms_documents(id,kind,slug,draft,published) VALUES($1,$2,$3,$4,$4) ON CONFLICT(kind,slug) DO NOTHING",
    [randomUUID(), kind, slug, JSON.stringify(value)],
  );
}
export async function query(sql: string, params: unknown[] = []) {
  await initialize();
  return database().query(sql, params);
}
export async function transaction<T>(fn: (c: PoolClient) => Promise<T>) {
  await initialize();
  const c = await database().connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function documents(kind?: string): Promise<Document[]> {
  return (
    await query(
      "SELECT * FROM cms_documents WHERE deleted=false" +
        (kind ? " AND kind=$1" : "") +
        " ORDER BY updated DESC",
      kind ? [kind] : [],
    )
  ).rows;
}
export async function document(id: string): Promise<Document | undefined> {
  return (await query("SELECT * FROM cms_documents WHERE id=$1", [id])).rows[0];
}
