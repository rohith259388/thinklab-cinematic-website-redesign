import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { query, transaction, documents, document } from "@/lib/cms/store";
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
  type Kind,
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
    if (action === "session") return json(u);
    if (action === "media")
      return json(
        (
          await query(
            "SELECT id,name,mime,alt,created FROM cms_media ORDER BY created DESC",
          )
        ).rows,
      );
    if (action === "versions") {
      const id = req.nextUrl.searchParams.get("id");
      return json(
        (
          await query(
            "SELECT id,content,action,actor,created FROM cms_versions WHERE document_id=$1 ORDER BY created DESC LIMIT 100",
            [id],
          )
        ).rows,
      );
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
          : message.includes("duplicate key")
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
      await query(
        "INSERT INTO cms_media(id,name,mime,bytes,alt) VALUES($1,$2,$3,$4,$5)",
        [
          id,
          file.name.slice(0, 200),
          mime,
          cleaned,
          String(form.get("alt") || "").slice(0, 1000),
        ],
      );
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
        await transaction(async (c) => {
          await c.query("LOCK TABLE cms_users IN EXCLUSIVE MODE");
          if ((await c.query("SELECT id FROM cms_users LIMIT 1")).rowCount)
            throw new Error("Setup is already complete");
          await c.query("INSERT INTO cms_users VALUES($1,$2,$3,$4)", [
            randomUUID(),
            email,
            hashPassword(b.password),
            "admin",
          ]);
        });
      }
      const key = hashToken(email);
      const attempts = await query(
        "INSERT INTO cms_login_attempts(key,attempts,expires) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN cms_login_attempts.expires<now() THEN 1 ELSE cms_login_attempts.attempts+1 END,expires=CASE WHEN cms_login_attempts.expires<now() THEN now()+interval '15 minutes' ELSE cms_login_attempts.expires END RETURNING attempts",
        [key],
      );
      if (attempts.rows[0].attempts > 10)
        return json(
          { error: "Too many attempts. Try again in 15 minutes." },
          429,
        );
      const user = (
        await query("SELECT * FROM cms_users WHERE email=$1", [email])
      ).rows[0];
      if (
        !verifyPassword(
          b.password,
          user?.password || hashPassword("invalid-credentials"),
        ) ||
        !user
      )
        return json({ error: "Invalid email or password" }, 401);
      await query("DELETE FROM cms_sessions WHERE expires<now()");
      await query(
        "DELETE FROM cms_login_attempts WHERE key=$1 OR expires<now()",
        [key],
      );
      const token = randomBytes(32).toString("hex");
      await query(
        "INSERT INTO cms_sessions VALUES($1,$2,now()+interval '8 hours')",
        [hashToken(token), user.id],
      );
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
        await query("DELETE FROM cms_sessions WHERE token=$1", [
          hashToken(token),
        ]);
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
      await query("INSERT INTO cms_users VALUES($1,$2,$3,$4)", [
        randomUUID(),
        b.email.trim().toLowerCase(),
        hashPassword(b.password),
        b.role,
      ]);
      return json({ ok: true });
    }
    if (action === "media-alt") {
      await query("UPDATE cms_media SET alt=$1 WHERE id=$2", [
        String(b.alt).slice(0, 1000),
        b.id,
      ]);
      return json({ ok: true });
    }
    if (action === "media-delete") {
      if (user.role === "editor") throw new Error("Forbidden");
      const refs = await query(
        "SELECT id FROM cms_documents WHERE draft::text LIKE $1 OR published::text LIKE $1 UNION ALL SELECT id FROM cms_versions WHERE content::text LIKE $1",
        ["%/api/cms-media/" + b.id + "%"],
      );
      if (refs.rowCount)
        throw new Error(
          "This asset is in use. Remove references before deleting.",
        );
      await query("DELETE FROM cms_media WHERE id=$1", [b.id]);
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
      await query(
        "INSERT INTO cms_documents(id,kind,slug,draft) VALUES($1,$2,$3,$4)",
        [
          id,
          b.kind,
          slug,
          JSON.stringify(validateContent(emptyContent(b.title || slug))),
        ],
      );
      return json(await document(id));
    }
    if (
      !["save", "publish", "unpublish", "restore", "delete"].includes(
        action || "",
      )
    )
      throw new Error("Unknown action");
    await transaction(async (c) => {
      const d = (
        await c.query("SELECT * FROM cms_documents WHERE id=$1 FOR UPDATE", [
          b.id,
        ])
      ).rows[0];
      if (!d || d.deleted) throw new Error("Document not found");
      if (b.revision !== d.revision)
        throw new Error("Conflict: reload the latest draft before saving.");
      let content = d.draft;
      if (action === "save") content = validateContent(b.content);
      if (action === "restore") {
        const v = (
          await c.query(
            "SELECT content FROM cms_versions WHERE id=$1 AND document_id=$2",
            [b.version, b.id],
          )
        ).rows[0];
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
      await c.query(
        "INSERT INTO cms_versions(id,document_id,content,action,actor) VALUES($1,$2,$3,$4,$5)",
        [
          randomUUID(),
          b.id,
          JSON.stringify(
            action === "save" || action === "restore" ? d.draft : content,
          ),
          action,
          user.email,
        ],
      );
      await c.query(
        "UPDATE cms_documents SET draft=$1,published=$2,deleted=$3,revision=revision+1,updated=now() WHERE id=$4",
        [
          JSON.stringify(content),
          action === "publish"
            ? JSON.stringify(validateContent(content))
            : action === "unpublish" || action === "delete"
              ? null
              : d.published === null
                ? null
                : JSON.stringify(d.published),
          action === "delete",
          b.id,
        ],
      );
      if (
        action === "publish" ||
        action === "unpublish" ||
        action === "delete"
      ) {
        revalidatePath(documentPath(d));
        revalidatePath("/", "layout");
        revalidatePath("/sitemap.xml");
      }
    });
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
