import { MongoClient, Db } from "mongodb";

function normalizeMongoUri(rawUri: string): string {
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

const globalForMongo = globalThis as typeof globalThis & {
  __mongoClientPromise?: Promise<MongoClient>;
};

export async function getMongoClient(): Promise<MongoClient> {
  const rawUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!rawUri) {
    throw new Error("MONGODB_URI or DATABASE_URL is not configured.");
  }
  const uri = normalizeMongoUri(rawUri);

  if (process.env.NODE_ENV === "development") {
    if (!globalForMongo.__mongoClientPromise) {
      const client = new MongoClient(uri);
      globalForMongo.__mongoClientPromise = client.connect();
    }
    return globalForMongo.__mongoClientPromise;
  }

  if (!globalForMongo.__mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.__mongoClientPromise = client.connect();
  }
  return globalForMongo.__mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db("thinklab");
}

export default getDb;
