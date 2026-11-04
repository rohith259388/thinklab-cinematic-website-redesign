import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!uri) {
  throw new Error("MONGODB_URI or DATABASE_URL is required");
}

const globalForMongo = globalThis as typeof globalThis & {
  __mongoClientPromise?: Promise<MongoClient>;
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!globalForMongo.__mongoClientPromise) {
    client = new MongoClient(uri);
    globalForMongo.__mongoClientPromise = client.connect();
  }
  clientPromise = globalForMongo.__mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db("thinklab");
}
