import { MongoClient, Db } from "mongodb";
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

const g = globalThis as typeof globalThis & {
  __cmsClientPromise?: Promise<MongoClient> | null;
};

export async function getDb(): Promise<Db> {
  const rawUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!rawUri) {
    throw new Error("CMS database is not configured. Set MONGODB_URI in environment variables.");
  }
  const uri = normalizeMongoUri(rawUri);

  if (!g.__cmsClientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      maxPoolSize: 5,
    });
    g.__cmsClientPromise = client.connect().catch((err) => {
      g.__cmsClientPromise = null;
      if (uri !== rawUri) {
        const fallback = new MongoClient(rawUri, {
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 8000,
          socketTimeoutMS: 20000,
          maxPoolSize: 5,
        });
        g.__cmsClientPromise = fallback.connect().catch((fallbackErr) => {
          g.__cmsClientPromise = null;
          throw fallbackErr;
        });
        return g.__cmsClientPromise;
      }
      throw err;
    });
  }

  try {
    const client = await g.__cmsClientPromise;
    return client.db("thinklab");
  } catch (err) {
    g.__cmsClientPromise = null;
    throw err;
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
