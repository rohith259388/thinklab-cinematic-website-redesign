// Single MongoDB helper for the whole app (Workers-safe; see src/lib/cms/store.ts).
export { getDb, getClient as getMongoClient, releaseDb } from "@/lib/cms/store";
export { getDb as default } from "@/lib/cms/store";
