import { MongoClient, Db } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  __mongoClientPromise?: Promise<MongoClient>;
};

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("MONGODB_URI or DATABASE_URL is not configured.");
  }

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
