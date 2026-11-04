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
  __cmsMongoClient?: MongoClient;
  __cmsMongoDb?: Db;
  __cmsReady?: Promise<void>;
};

export async function getDb(): Promise<Db> {
  if (g.__cmsMongoDb) return g.__cmsMongoDb;
  const rawUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!rawUri) {
    throw new Error("CMS database is not configured. Set MONGODB_URI in environment variables.");
  }
  const uri = normalizeMongoUri(rawUri);
  if (!g.__cmsMongoClient) {
    g.__cmsMongoClient = new MongoClient(uri);
    await g.__cmsMongoClient.connect();
  }
  g.__cmsMongoDb = g.__cmsMongoClient.db("thinklab");
  return g.__cmsMongoDb;
}

export async function initialize() {
  if (!g.__cmsReady) {
    g.__cmsReady = (async () => {
      const db = await getDb();

      // Ensure indexes
      await Promise.allSettled([
        db.collection("cms_documents").createIndex({ kind: 1, slug: 1 }, { unique: true }),
        db.collection("cms_documents").createIndex({ id: 1 }, { unique: true }),
        db.collection("cms_users").createIndex({ email: 1 }, { unique: true }),
        db.collection("cms_sessions").createIndex({ token: 1 }, { unique: true }),
        db.collection("cms_media").createIndex({ id: 1 }, { unique: true }),
        db.collection("cms_login_attempts").createIndex({ key: 1 }, { unique: true }),
      ]);

      // Seed collections from live-content.json
      for (const [kind, entries] of Object.entries({
        projects: data.projects,
        blog: data.articles,
        careers: data.careers,
      })) {
        for (const e of entries) {
          const slug = e.slug;
          const value = { ...emptyContent(), ...e, alt: e.title };
          await seed(db, kind as Kind, slug, value);
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
      ]) {
        await seed(
          db,
          "page",
          slug,
          emptyContent(slug === "/" ? "Home" : slug),
        );
      }

      await seed(db, "global", "site", emptyContent("Shared website content"));
    })().catch((e) => {
      g.__cmsReady = undefined;
      throw e;
    });
  }
  return g.__cmsReady;
}

async function seed(db: Db, kind: Kind, slug: string, value: Content) {
  await db.collection("cms_documents").updateOne(
    { kind, slug },
    {
      $setOnInsert: {
        id: randomUUID(),
        kind,
        slug,
        draft: value,
        published: value,
        revision: 1,
        deleted: false,
        updated: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function documents(kind?: string): Promise<Document[]> {
  await initialize();
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
  await initialize();
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
