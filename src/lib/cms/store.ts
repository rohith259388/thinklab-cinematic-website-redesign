import { MongoClient, Db } from "mongodb";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomUUID } from "node:crypto";
import data from "../live-content.json";
import { emptyContent, type Document, type Content, type Kind } from "./schema";

export function normalizeMongoUri(rawUri: string): string {
  // Cloudflare Workers (workerd) lacks native DNS SRV resolution for mongodb+srv://
  // Automatically convert cluster0.hkuapuu.mongodb.net to direct replicaSet shard hosts
  if (rawUri.startsWith("mongodb+srv://") && rawUri.includes("cluster0.hkuapuu.mongodb.net")) {
    const match = rawUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@cluster0\.hkuapuu\.mongodb\.net\/?([^?]*)(.*)$/);
    if (match) {
      const [, user, pass, dbName] = match;
      const db = dbName || "thinklab";
      return `mongodb://${user}:${pass}@ac-yirlxrd-shard-00-00.hkuapuu.mongodb.net:27017,ac-yirlxrd-shard-00-01.hkuapuu.mongodb.net:27017,ac-yirlxrd-shard-00-02.hkuapuu.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-ogeyta-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }
  return rawUri;
}

const CLIENT_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  socketTimeoutMS: 20000,
  maxPoolSize: 1,
  minPoolSize: 0,
  serverMonitoringMode: "poll" as const,
};

// Cloudflare Workers forbids using a socket opened during one request from another
// request: the second request hangs until the runtime kills it with a plain-text 500.
// So on workerd every request gets its own client, keyed by that request's
// ExecutionContext. Plain Node (next dev / next start) keeps one shared client.
const isWorkerd =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

const g = globalThis as typeof globalThis & {
  __cmsClientPromise?: Promise<MongoClient> | null;
};
const perRequest = new WeakMap<object, Promise<MongoClient>>();

function requestContext(): { waitUntil(p: Promise<unknown>): void } | null {
  try {
    return (getCloudflareContext().ctx as { waitUntil(p: Promise<unknown>): void }) ?? null;
  } catch {
    return null;
  }
}

async function connect(): Promise<MongoClient> {
  const rawUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!rawUri) {
    throw new Error("CMS database is not configured. Set MONGODB_URI in environment variables.");
  }
  const uri = normalizeMongoUri(rawUri);
  try {
    return await new MongoClient(uri, CLIENT_OPTIONS).connect();
  } catch (err) {
    if (uri === rawUri) throw err;
    return await new MongoClient(rawUri, CLIENT_OPTIONS).connect();
  }
}

export async function getClient(): Promise<MongoClient> {
  if (!isWorkerd) {
    if (!g.__cmsClientPromise) {
      g.__cmsClientPromise = connect().catch((err) => {
        g.__cmsClientPromise = null;
        throw err;
      });
    }
    return g.__cmsClientPromise;
  }
  const ctx = requestContext();
  if (!ctx) return connect();
  let p = perRequest.get(ctx);
  if (!p) {
    p = connect();
    perRequest.set(ctx, p);
    p.catch(() => perRequest.delete(ctx));
  }
  return p;
}

export async function getDb(): Promise<Db> {
  return (await getClient()).db("thinklab");
}

/**
 * Close this request's client on Workers (no-op on Node, where the client is shared).
 * Only call it from code that owns the whole request (API route handlers). Rendering
 * code never needs it: workerd closes a request's sockets when the request ends.
 */
export async function releaseDb(): Promise<void> {
  if (!isWorkerd) return;
  const ctx = requestContext();
  const p = ctx && perRequest.get(ctx);
  if (!p) return;
  perRequest.delete(ctx);
  const closing = p.then((c) => c.close()).catch(() => {});
  try {
    ctx.waitUntil(closing);
  } catch {
    await closing;
  }
}

export async function initialize() {
  // Database already contains seeded documents and indexes.
  // Kept as a lightweight no-op to avoid subrequest overhead in edge runtimes.
  return;
}

export async function documents(kind?: string): Promise<Document[]> {
  const db = await getDb();
  const filter: Record<string, unknown> = { deleted: false };
  if (kind) filter.kind = kind;
  const list = await db.collection("cms_documents").find(filter).sort({ updated: -1 }).toArray();
  return list.map((d) => ({
    id: d.id,
    kind: d.kind,
    slug: d.slug,
    draft: d.draft,
    published: d.published,
    revision: d.revision ?? 1,
    deleted: d.deleted ?? false,
    updated: d.updated instanceof Date ? d.updated.toISOString() : String(d.updated || ""),
  })) as Document[];
}

export async function document(id: string): Promise<Document | undefined> {
  const db = await getDb();
  const d = await db.collection("cms_documents").findOne({ id });
  if (!d) return undefined;
  return {
    id: d.id,
    kind: d.kind,
    slug: d.slug,
    draft: d.draft,
    published: d.published,
    revision: d.revision ?? 1,
    deleted: d.deleted ?? false,
    updated: d.updated instanceof Date ? d.updated.toISOString() : String(d.updated || ""),
  } as Document;
}
