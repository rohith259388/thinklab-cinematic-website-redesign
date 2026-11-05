import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getDb, documents, document, releaseDb } from "@/lib/cms/store";
import { invalidatePublishedCache } from "@/lib/cms/public";
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
import { sendOtpEmail } from "@/lib/cms/mail";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 604,800s = 7 days
const SEVEN_DAYS_MS = SEVEN_DAYS_SECONDS * 1000;

function getTokenFromReq(req: NextRequest): string | undefined {
  const cookieVal = req.cookies.get("cms_session")?.value;
  if (cookieVal) return cookieVal;
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)cms_session=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();
  return undefined;
}

const json = (v: unknown, status = 200) =>
  NextResponse.json(v, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: NextRequest) {
  try {
    return await handleGet(req);
  } finally {
    await releaseDb();
  }
}

async function handleGet(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const action = segments.pop();

    // Public auth configuration (Google Client ID, allowed domain)
    if (action === "auth-config") {
      return json({
        googleClientId:
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          process.env.GOOGLE_CLIENT_ID ||
          "",
        allowedDomain: "thinklabdigitalsolutions.com",
      });
    }

    const token = getTokenFromReq(req);
    const u = await requireUser(false, token);
    if (action === "session") return json(u);

    const db = await getDb();
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
    if (action === "documents") {
      const kind = req.nextUrl.searchParams.get("kind") || undefined;
      return json(await documents(kind));
    }
    return json(await documents());
  } catch (e) {
    return failure(e, req);
  }
}

function failure(e: unknown, req?: NextRequest) {
  const errStr = e instanceof Error ? e.message : String(e || "");
  const isTimeout =
    errStr.includes("timed out") ||
    errStr.includes("Server selection") ||
    errStr.includes("ECONNREFUSED") ||
    errStr.includes("ENOTFOUND");
  const databaseError = typeof e === "object" && e !== null && ("code" in e || isTimeout);
  const message = isTimeout
    ? "Database connection timed out. Please allow 0.0.0.0/0 (Anywhere) in MongoDB Atlas > Network Access."
    : databaseError
      ? `Database operation failed: ${errStr || "Check server connection."}`
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
  const resp = json(
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
  if (status === 401) {
    const isSecure = req ? req.nextUrl.protocol === "https:" : true;
    resp.cookies.set("cms_session", "", {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }
  return resp;
}

export async function POST(req: NextRequest) {
  try {
    return await handlePost(req);
  } finally {
    await releaseDb();
  }
}

async function handlePost(req: NextRequest) {
  try {
    const reqOrigin = req.headers.get("origin") || "";
    const isOriginAllowed =
      !reqOrigin ||
      reqOrigin === process.env.CMS_ORIGIN ||
      reqOrigin === req.nextUrl.origin ||
      reqOrigin.includes("thinklabdigitalsolutions.com") ||
      reqOrigin.includes("thinklab.com") ||
      reqOrigin.includes("workers.dev") ||
      reqOrigin.includes("localhost") ||
      reqOrigin.includes("127.0.0.1");
    if (!isOriginAllowed)
      return json({ error: "Invalid origin" }, 403);
    if (Number(req.headers.get("content-length") || 0) > 8_000_000)
      return json({ error: "Request too large" }, 413);

    const action = req.nextUrl.pathname.split("/").filter(Boolean).pop();
    const db = await getDb();

    if (action === "upload") {
      const token = getTokenFromReq(req);
      await requireUser(false, token);
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

      let cleaned = bytes;
      try {
        const sharpModule = await import("sharp").then((m) => m.default || m).catch(() => null);
        if (sharpModule) {
          cleaned = await sharpModule(bytes, { limitInputPixels: 40_000_000 })
            .rotate()
            .toFormat(
              mime === "image/png"
                ? "png"
                : mime === "image/jpeg"
                  ? "jpeg"
                  : "webp",
            )
            .toBuffer();
        }
      } catch {}

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

    // 1. Step 1 of registration: validate email/password and dispatch OTP
    if (action === "register-otp") {
      const email = String(b.email || "").toLowerCase().trim();
      const password = String(b.password || "");
      const confirmPassword = String(b.confirmPassword || "");

      if (!email.includes("@")) throw new Error("Please enter a valid email address.");
      if (!email.endsWith("@thinklabdigitalsolutions.com")) {
        throw new Error("Registration is restricted to @thinklabdigitalsolutions.com email addresses.");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const existingUser = await db.collection("cms_users").findOne({ email });
      if (existingUser) {
        throw new Error("An account with this email already exists. Please sign in.");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = hashToken(otp);
      const tempPasswordHash = hashPassword(password);
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.collection("cms_otp_verifications").updateOne(
        { email },
        {
          $set: {
            email,
            otpHash,
            tempPasswordHash,
            expires,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      await sendOtpEmail(email, otp);

      return json({
        ok: true,
        message: `Verification code sent to ${email}`,
        debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      });
    }

    // 2. Resend OTP code
    if (action === "resend-otp") {
      const email = String(b.email || "").toLowerCase().trim();
      if (!email || !email.endsWith("@thinklabdigitalsolutions.com")) {
        throw new Error("Invalid email address.");
      }
      const pending = await db.collection("cms_otp_verifications").findOne({ email });
      if (!pending) {
        throw new Error("No pending registration found for this email. Please register again.");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = hashToken(otp);
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await db.collection("cms_otp_verifications").updateOne(
        { email },
        { $set: { otpHash, expires, updatedAt: new Date() } }
      );

      await sendOtpEmail(email, otp);
      return json({
        ok: true,
        message: "New verification code sent.",
        debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      });
    }

    // 3. Step 2 of registration: verify OTP code and create account
    if (action === "verify-otp") {
      const email = String(b.email || "").toLowerCase().trim();
      const otp = String(b.otp || "").trim();

      if (!email || !otp) throw new Error("Email and OTP code are required.");

      const record = await db.collection("cms_otp_verifications").findOne({ email });
      if (!record) {
        throw new Error("No pending verification found. Please register again.");
      }

      if (new Date() > new Date(record.expires)) {
        throw new Error("Verification code has expired. Please request a new code.");
      }

      if (hashToken(otp) !== record.otpHash) {
        throw new Error("Invalid verification code. Please check and try again.");
      }

      const existingUser = await db.collection("cms_users").findOne({ email });
      const userId =
        existingUser?.id ||
        (existingUser?._id ? String(existingUser._id) : randomUUID());
      // All @thinklabdigitalsolutions.com and @thinklab.com users are full admins
      const isAdminEmail =
        email.endsWith("@thinklabdigitalsolutions.com") ||
        email.endsWith("@thinklab.com") ||
        email === (process.env.DEFAULT_ADMIN_EMAIL || "admin@thinklab.com").toLowerCase().trim();
      const userRole = isAdminEmail ? "admin" : (existingUser ? String(existingUser.role) : "editor");

      if (!existingUser) {
        await db.collection("cms_users").insertOne({
          id: userId,
          email,
          password: record.tempPasswordHash,
          role: userRole,
          createdAt: new Date(),
        });
      } else {
        await db.collection("cms_users").updateOne(
          { email },
          {
            $set: {
              id: userId,
              ...(isAdminEmail ? { role: "admin" } : {}),
              ...(record.tempPasswordHash ? { password: record.tempPasswordHash } : {}),
              updatedAt: new Date(),
            },
          }
        );
      }

      await db.collection("cms_otp_verifications").deleteOne({ email });

      const token = randomBytes(32).toString("hex");
      await db.collection("cms_sessions").insertOne({
        token: hashToken(token),
        user_id: userId,
        email,
        expires: new Date(Date.now() + SEVEN_DAYS_MS),
      });

      const response = json({ ok: true, user: { id: userId, email, role: userRole } });
      const isSecure = req.nextUrl.protocol === "https:";
      response.cookies.set("cms_session", token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: SEVEN_DAYS_SECONDS,
      });
      return response;
    }

    // 4. Google Login authentication
    if (action === "google-login") {
      const credential = String(b.credential || "");
      if (!credential) throw new Error("Google credential token required.");

      let payload: { email?: string; email_verified?: boolean | string; verified_email?: boolean; sub?: string } = {};
      let verified = false;

      // 1) Try Google userinfo directly (works for all OAuth2 access tokens)
      try {
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${credential}` },
        });
        if (userinfoRes.ok) {
          payload = await userinfoRes.json();
          if (payload.email) verified = true;
        }
      } catch {}

      // 2) Try tokeninfo?id_token (works for Google Identity Services ID tokens)
      if (!verified) {
        try {
          const verifyRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
          );
          if (verifyRes.ok) {
            payload = await verifyRes.json();
            if (payload.email) verified = true;
          }
        } catch {}
      }

      // 3) Try tokeninfo?access_token fallback
      if (!verified) {
        try {
          const verifyRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(credential)}`
          );
          if (verifyRes.ok) {
            payload = await verifyRes.json();
            if (payload.email) verified = true;
          }
        } catch {}
      }

      if (!verified || !payload.email) {
        throw new Error("Google authentication failed or token expired. Please try again.");
      }

      const email = String(payload.email || "").toLowerCase().trim();
      const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || "admin@thinklab.com").toLowerCase().trim();

      // Authorization check: all @thinklabdigitalsolutions.com or @thinklab.com or default admin
      const isAllowed =
        email.endsWith("@thinklabdigitalsolutions.com") ||
        email.endsWith("@thinklab.com") ||
        email === adminEmail;

      if (!isAllowed) {
        throw new Error(`Google Sign-In with ${email} is not authorized. Please use your @thinklabdigitalsolutions.com account.`);
      }

      // All authorized @thinklabdigitalsolutions.com users are full admins
      const googleUserRole = "admin";

      const existingGoogleUser = await db.collection("cms_users").findOne({ email });
      const googleUserId =
        existingGoogleUser?.id ||
        (existingGoogleUser?._id ? String(existingGoogleUser._id) : randomUUID());

      if (!existingGoogleUser) {
        await db.collection("cms_users").insertOne({
          id: googleUserId,
          email,
          role: googleUserRole,
          googleSub: payload.sub,
          createdAt: new Date(),
        });
      } else {
        await db.collection("cms_users").updateOne(
          { email },
          {
            $set: {
              id: googleUserId,
              role: "admin",
              ...(payload.sub ? { googleSub: payload.sub } : {}),
              updatedAt: new Date(),
            },
          }
        );
      }

      const token = randomBytes(32).toString("hex");
      await db.collection("cms_sessions").insertOne({
        token: hashToken(token),
        user_id: googleUserId,
        email,
        expires: new Date(Date.now() + SEVEN_DAYS_MS),
      });

      const response = json({ ok: true, user: { id: googleUserId, email, role: "admin" } });
      const isSecure = req.nextUrl.protocol === "https:";
      response.cookies.set("cms_session", token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: SEVEN_DAYS_SECONDS,
      });
      return response;
    }

    // 5. Standard Email & Password Sign In
    if (action === "login") {
      if (
        typeof b.email !== "string" ||
        b.email.length > 254 ||
        !b.email.includes("@") ||
        typeof b.password !== "string" ||
        b.password.length > 200
      )
        throw new Error("Invalid credentials");
      const email = b.email.toLowerCase().trim();

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

      let user = await db.collection("cms_users").findOne({ email });
      if (!user && email === (process.env.DEFAULT_ADMIN_EMAIL || "admin@thinklab.com").toLowerCase().trim()) {
        const defaultPass = process.env.DEFAULT_ADMIN_PASSWORD || "AdminThinkLab2026!";
        if (b.password === defaultPass) {
          const id = randomUUID();
          await db.collection("cms_users").insertOne({
            id,
            email,
            password: hashPassword(defaultPass),
            role: "admin",
            createdAt: new Date(),
          });
          user = await db.collection("cms_users").findOne({ email });
        }
      }

      if (!user) {
        return json({ error: "Invalid email or password" }, 401);
      }

      if (!user.password) {
        if (user.googleSub) {
          return json(
            {
              error:
                "This account is linked to Google Sign-In. Please click the Google button below to sign in.",
            },
            400
          );
        }
        return json({ error: "No password set. Please use Register to set your password." }, 400);
      }

      if (!verifyPassword(b.password, user.password)) {
        return json({ error: "Invalid email or password" }, 401);
      }

      // Promote @thinklabdigitalsolutions.com users to admin automatically
      if (
        email.endsWith("@thinklabdigitalsolutions.com") ||
        email.endsWith("@thinklab.com") ||
        email === (process.env.DEFAULT_ADMIN_EMAIL || "admin@thinklab.com").toLowerCase().trim()
      ) {
        if (user.role !== "admin") {
          await db.collection("cms_users").updateOne({ email }, { $set: { role: "admin" } });
          user.role = "admin";
        }
      }

      const userId =
        user.id || (user._id ? String(user._id) : randomUUID());
      if (!user.id) {
        await db.collection("cms_users").updateOne({ email }, { $set: { id: userId } });
        user.id = userId;
      }

      await db.collection("cms_sessions").deleteMany({ expires: { $lt: now } });
      await db.collection("cms_login_attempts").deleteOne({ key });

      const token = randomBytes(32).toString("hex");
      await db.collection("cms_sessions").insertOne({
        token: hashToken(token),
        user_id: userId,
        email: user.email,
        expires: new Date(Date.now() + SEVEN_DAYS_MS),
      });

      const response = json({ ok: true, user: { id: userId, email: user.email, role: user.role } });
      const isSecure = req.nextUrl.protocol === "https:";
      response.cookies.set("cms_session", token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: SEVEN_DAYS_SECONDS,
      });
      return response;
    }

    if (action === "logout") {
      // Handled before the auth check so an intentional logout always deletes the
      // session and expires the cookie, even if the session is already invalid.
      const logoutToken = getTokenFromReq(req);
      if (logoutToken) {
        try {
          await db.collection("cms_sessions").deleteOne({
            token: hashToken(logoutToken),
          });
        } catch {}
      }
      const r = json({ ok: true });
      const isSecure = req.nextUrl.protocol === "https:";
      r.cookies.set("cms_session", "", {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      return r;
    }

    const token = getTokenFromReq(req);
    const user = await requireUser(
      ["publish", "unpublish", "delete", "user"].includes(action || ""),
      token
    );

    if (action === "user") {
      if (user.role !== "admin") throw new Error("Forbidden");
      if (
        !["admin", "publisher", "editor"].includes(b.role) ||
        typeof b.email !== "string" ||
        b.email.length > 254 ||
        !b.email.includes("@") ||
        typeof b.password !== "string" ||
        b.password.length < 8 ||
        b.password.length > 200
      )
        throw new Error("Invalid user");

      await db.collection("cms_users").insertOne({
        id: randomUUID(),
        email: b.email.trim().toLowerCase(),
        password: hashPassword(b.password),
        role: b.role,
        createdAt: new Date(),
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
      invalidatePublishedCache();
      try {
        revalidatePath(documentPath(d as any));
      } catch (err) {
        console.warn("[cms] revalidatePath single skipped:", err);
      }
      try {
        revalidatePath("/", "layout");
      } catch (err) {
        console.warn("[cms] revalidatePath layout skipped:", err);
      }
      try {
        revalidatePath("/sitemap.xml");
      } catch (err) {
        console.warn("[cms] revalidatePath sitemap skipped:", err);
      }
    }

    return json(await document(b.id));
  } catch (e) {
    return failure(e, req);
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
  try {
    if (req.body) {
      const reader = req.body.getReader();
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
  } catch (err: any) {
    if (err?.message === "Request too large") throw err;
  }

  try {
    const text = await req.text();
    if (text.length > limit) throw new Error("Request too large");
    return Buffer.from(text, "utf8");
  } catch (err: any) {
    if (err?.message === "Request too large") throw err;
    return Buffer.alloc(0);
  }
}
