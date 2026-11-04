import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getDb, documents, document } from "@/lib/cms/store";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  requireUser,
} from "@/lib/cms/auth";
import {
  kinds,
  validateContent,
  validateSlug,
  emptyContent,
  documentPath,
} from "@/lib/cms/schema";
import sharp from "sharp";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const json = (v: unknown, status = 200) =>
  NextResponse.json(v, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: NextRequest) {
  try {
    const u = await requireUser();
    const action = req.nextUrl.pathname.split("/").pop();
    const db = await getDb();

    if (action === "session") return json(u);
    if (action === "media") {
      const mediaList = await db
        .collection("cms_media")
        .find({}, { projection: { id: 1, name: 1, mime: 1, alt: 1, created: 1 } })
        .sort({ created: -1 })
        .toArray();
      return json(mediaList);
    }
    if (action === "versions") {
      const id = req.nextUrl.searchParams.get("id");
      const versions = await db
        .collection("cms_versions")
        .find({ document_id: id })
        .sort({ created: -1 })
        .limit(100)
        .toArray();
      return json(versions);
    }
    return json(await documents());
  } catch (e) {
    return failure(e);
  }
}

function failure(e: unknown) {
  const databaseError = typeof e === "object" && e !== null && "code" in e;
  const message = databaseError
    ? "Database operation failed. Check the server connection and logs."
    : e instanceof Error
      ? e.message
      : "Request failed";
  const status =
    message === "Unauthorized"
      ? 401
      : message === "Forbidden"
        ? 403
        : message === "Conflict: reload the latest draft before saving."
          ? 409
          : message.includes("configured") || databaseError
            ? 503
            : 400;
  console.error("[cms]", status);
  return json(
    {
      error:
        status === 503
          ? message
          : message.includes("duplicate key") || message.includes("E11000")
            ? "That slug is already used."
            : message,
    },
    status,
  );
}

export async function POST(req: NextRequest) {
  try {
    const origin = process.env.CMS_ORIGIN || req.nextUrl.origin;
    if (req.headers.get("origin") !== origin)
      return json({ error: "Invalid origin" }, 403);
    if (Number(req.headers.get("content-length") || 0) > 8_000_000)
      return json({ error: "Request too large" }, 413);

    const action = req.nextUrl.pathname.split("/").pop();
    const db = await getDb();

    if (action === "upload") {
      await requireUser();
      const uploadBody = await limitedBody(req, 6_000_000);
      const form = await new Request(req.url, {
        method: "POST",
        headers: req.headers,
        body: new Uint8Array(uploadBody),
      }).formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size > 5_000_000 || file.size === 0)
        throw new Error("Upload a PNG, JPEG or WebP up to 5 MB");

      const bytes = Buffer.from(await file.arrayBuffer());
      const mime = bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "image/png"
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          ? "image/jpeg"
          : bytes.toString("ascii", 0, 4) === "RIFF" &&
              bytes.toString("ascii", 8, 12) === "WEBP"
            ? "image/webp"
            : "";
      if (!mime || mime !== file.type)
        throw new Error("Unsupported image format");

      const cleaned = await sharp(bytes, { limitInputPixels: 40_000_000 })
        .rotate()
        .toFormat(
          mime === "image/png"
            ? "png"
            : mime === "image/jpeg"
              ? "jpeg"
              : "webp",
        )
        .toBuffer();

      const id = randomUUID();
      await db.collection("cms_media").insertOne({
        id,
        name: file.name.slice(0, 200),
        mime,
        bytes: cleaned,
        alt: String(form.get("alt") || "").slice(0, 1000),
        created: new Date(),
      });
      return json({ id, url: `/api/cms-media/${id}` });
    }

    const body = (await limitedBody(req, 1_000_000)).toString("utf8");
    if (body.length > 1_000_000) throw new Error("Content too large");
    const b = JSON.parse(body);
    if (!b || typeof b !== "object" || Array.isArray(b))
      throw new Error("Invalid request");

    if (action === "login" || action === "setup") {
      if (
        typeof b.email !== "string" ||
        b.email.length > 254 ||
        !b.email.includes("@") ||
        typeof b.password !== "string" ||
        b.password.length > 200
      )
        throw new Error("Invalid credentials");
      const email = b.email.toLowerCase().trim();

      if (action === "setup") {
        if (
          !process.env.CMS_SETUP_SECRET ||
          process.env.CMS_SETUP_SECRET.length < 32 ||
          !timingSecret(b.secret, process.env.CMS_SETUP_SECRET)
        )
          throw new Error("Invalid setup secret");
        if (b.password.length < 14)
          throw new Error("Use a password of at least 14 characters");

        const existing = await db.collection("cms_users").countDocuments();
        if (existing > 0) throw new Error("Setup is already complete");

        await db.collection("cms_users").insertOne({
          id: randomUUID(),
          email,
          password: hashPassword(b.password),
          role: "admin",
        });
      }

      const key = hashToken(email);
      const now = new Date();
      const attemptDoc = await db.collection("cms_login_attempts").findOne({ key });
      let attempts = 1;
      if (attemptDoc && attemptDoc.expires > now) {
        attempts = (attemptDoc.attempts || 1) + 1;
        await db.collection("cms_login_attempts").updateOne(
          { key },
          { $set: { attempts } }
        );
      } else {
        await db.collection("cms_login_attempts").updateOne(
          { key },
          { $set: { attempts: 1, expires: new Date(Date.now() + 15 * 60 * 1000) } },
          { upsert: true }
        );
      }

      if (attempts > 10)
        return json(
          { error: "Too many attempts. Try again in 15 minutes." },
          429,
        );

      const user = await db.collection("cms_users").findOne({ email });
      if (
        !user ||
        !verifyPassword(
          b.password,
          user.password || hashPassword("invalid-credentials"),
        )
      )
        return json({ error: "Invalid email or password" }, 401);

      await db.collection("cms_sessions").deleteMany({ expires: { $lt: now } });
      await db.collection("cms_login_attempts").deleteOne({ key });

      const token = randomBytes(32).toString("hex");
      await db.collection("cms_sessions").insertOne({
        token: hashToken(token),
        user_id: user.id,
        expires: new Date(Date.now() + 8 * 3600 * 1000),
      });

      const response = json({ ok: true });
      response.cookies.set("cms_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 28800,
      });
      return response;
    }

    const user = await requireUser(
      ["publish", "unpublish", "delete", "user"].includes(action || ""),
    );

    if (action === "logout") {
      const token = req.cookies.get("cms_session")?.value;
      if (token)
        await db.collection("cms_sessions").deleteOne({
          token: hashToken(token),
        });
      const r = json({ ok: true });
      r.cookies.delete("cms_session");
      return r;
    }

    if (action === "user") {
      if (user.role !== "admin") throw new Error("Forbidden");
      if (
        !["admin", "publisher", "editor"].includes(b.role) ||
        typeof b.email !== "string" ||
        b.email.length > 254 ||
        !b.email.includes("@") ||
        typeof b.password !== "string" ||
        b.password.length < 14 ||
        b.password.length > 200
      )
        throw new Error("Invalid user");

      await db.collection("cms_users").insertOne({
        id: randomUUID(),
        email: b.email.trim().toLowerCase(),
        password: hashPassword(b.password),
        role: b.role,
      });
      return json({ ok: true });
    }

    if (action === "media-alt") {
      await db.collection("cms_media").updateOne(
        { id: b.id },
        { $set: { alt: String(b.alt).slice(0, 1000) } }
      );
      return json({ ok: true });
    }

    if (action === "media-delete") {
      if (user.role === "editor") throw new Error("Forbidden");
      const refs = await db.collection("cms_documents").findOne({
        $or: [
          { "draft.image": { $regex: b.id } },
          { "published.image": { $regex: b.id } },
        ],
      });
      if (refs)
        throw new Error(
          "This asset is in use. Remove references before deleting.",
        );
      await db.collection("cms_media").deleteOne({ id: b.id });
      return json({ ok: true });
    }

    if (action === "create") {
      if (!kinds.includes(b.kind) || b.kind === "global")
        throw new Error("Invalid collection");
      const slug = validateSlug(b.slug, b.kind);
      if (
        b.kind === "page" &&
        [
          "projects",
          "blog",
          "careers",
          "services",
          "about",
          "contact",
          "reviews",
        ].includes(slug)
      )
        throw new Error("This route is reserved");

      const id = randomUUID();
      const content =
        b.content && typeof b.content === "object"
          ? validateContent({ ...emptyContent(b.title || slug), ...b.content })
          : validateContent(emptyContent(b.title || slug));

      await db.collection("cms_documents").insertOne({
        id,
        kind: b.kind,
        slug,
        draft: content,
        published: null,
        revision: 1,
        deleted: false,
        updated: new Date(),
      });
      return json(await document(id));
    }

    if (
      !["save", "publish", "unpublish", "restore", "delete"].includes(
        action || "",
      )
    )
      throw new Error("Unknown action");

    const d = await db.collection("cms_documents").findOne({ id: b.id });
    if (!d || d.deleted) throw new Error("Document not found");
    if (b.revision !== d.revision)
      throw new Error("Conflict: reload the latest draft before saving.");

    let content = d.draft;
    if (action === "save") content = validateContent(b.content);
    if (action === "restore") {
      const v = await db.collection("cms_versions").findOne({
        id: b.version,
        document_id: b.id,
      });
      if (!v) throw new Error("Version not found");
      content = v.content;
    }
    if (
      action === "delete" &&
      (d.kind === "global" ||
        (d.kind === "page" &&
          [
            "/",
            "about",
            "services",
            "projects",
            "reviews",
            "blog",
            "careers",
            "contact",
          ].includes(d.slug)))
    )
      throw new Error("Built-in pages cannot be deleted");

    await db.collection("cms_versions").insertOne({
      id: randomUUID(),
      document_id: b.id,
      content: action === "save" || action === "restore" ? d.draft : content,
      action,
      actor: user.email,
      created: new Date(),
    });

    await db.collection("cms_documents").updateOne(
      { id: b.id },
      {
        $set: {
          draft: content,
          published:
            action === "publish"
              ? validateContent(content)
              : action === "unpublish" || action === "delete"
                ? null
                : d.published,
          deleted: action === "delete",
          updated: new Date(),
        },
        $inc: { revision: 1 },
      }
    );

    if (
      action === "publish" ||
      action === "unpublish" ||
      action === "delete"
    ) {
      revalidatePath(documentPath(d as any));
      revalidatePath("/", "layout");
      revalidatePath("/sitemap.xml");
    }

    return json(await document(b.id));
  } catch (e) {
    return failure(e);
  }
}

function timingSecret(a: unknown, b: string) {
  return (
    typeof a === "string" &&
    timingSafeEqual(
      Buffer.from(hashToken(a), "hex"),
      Buffer.from(hashToken(b), "hex"),
    )
  );
}

async function limitedBody(req: Request, limit: number) {
  const reader = req.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    parts.push(value);
  }
  return Buffer.concat(parts);
}
