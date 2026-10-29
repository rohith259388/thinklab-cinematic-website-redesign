// Runs only against a disposable PostgreSQL database and a separately started CMS server.
import assert from "node:assert/strict";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { Pool } from "pg";
import sharp from "sharp";
import { writeFile, readFile } from "node:fs/promises";
const base = process.env.CMS_ORIGIN || "http://localhost:3002";
if (
  !process.env.DATABASE_URL ||
  new URL(process.env.DATABASE_URL).pathname !== "/cms_test" ||
  !process.env.CMS_SETUP_SECRET
)
  throw new Error(
    "Run with the isolated .cms-test.env database, never production.",
  );
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let cookie = "";
async function call(action, body, expected = 200, session = cookie) {
  const r = await fetch(base + "/api/cms/" + action, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      origin: base,
      ...(session ? { cookie: session } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await r.json();
  assert.equal(r.status, expected, JSON.stringify({ action, value }));
  return { value, response: r };
}
let credentials;
try {
  credentials = JSON.parse(await readFile(".cms-browser-test.json", "utf8"));
} catch {}
const password = credentials?.password || randomBytes(20).toString("hex"),
  email = "cms-check@example.invalid";
// Keep the disposable test account separate from administrators created by the user.
if (credentials) {
  const salt = randomBytes(16).toString("hex");
  await pool.query(
    "INSERT INTO cms_users(id,email,password,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING",
    [
      randomUUID(),
      email,
      salt + ":" + scryptSync(password, salt, 64).toString("hex"),
      "admin",
    ],
  );
}
const setup = await call(credentials ? "login" : "setup", {
  email,
  password,
  secret: process.env.CMS_SETUP_SECRET,
});
cookie = setup.response.headers.get("set-cookie").split(";")[0];
await writeFile(".cms-browser-test.json", JSON.stringify({ email, password }), {
  mode: 0o600,
});
await pool.query("DELETE FROM cms_documents WHERE slug LIKE 'cms-check-%'");
await pool.query(
  "DELETE FROM cms_users WHERE email='cms-editor@example.invalid'",
);
const docs = (await call("documents")).value;
let home = docs.find((d) => d.kind === "page" && d.slug === "/");
const originalPublished = structuredClone(home.published);
assert.ok(originalPublished, "test only an already published homepage");
const original = structuredClone(home.draft),
  marker = "CMS integration " + Date.now();
let saved = (
  await call("save", {
    id: home.id,
    revision: home.revision,
    content: {
      ...home.draft,
      fields: { ...home.draft.fields, "studio.line1": marker },
    },
  })
).value;
assert.equal(
  (
    await pool.query(
      "SELECT draft->'fields'->>'studio.line1' AS value FROM cms_documents WHERE id=$1",
      [home.id],
    )
  ).rows[0].value,
  marker,
);
assert.ok(
  !(await (await fetch(base)).text()).includes(marker),
  "draft must not leak publicly",
);
assert.equal((await fetch(base + "/?__cms_preview=" + home.id)).status, 404);
assert.ok(
  (
    await (
      await fetch(base + "/?__cms_preview=" + home.id, { headers: { cookie } })
    ).text()
  ).includes(marker),
  "authenticated preview must show draft",
);
await call(
  "save",
  { id: home.id, revision: home.revision, content: original },
  409,
);
saved = (await call("publish", { id: home.id, revision: saved.revision }))
  .value;
assert.ok(
  (await (await fetch(base)).text()).includes(marker),
  "publish must change actual homepage",
);
const versions = (await call("versions?id=" + home.id)).value;
const initialVersion = versions.find((v) => v.action === "save");
saved = (
  await call("restore", {
    id: home.id,
    revision: saved.revision,
    version: initialVersion.id,
  })
).value;
assert.ok(
  (await (await fetch(base)).text()).includes(marker),
  "restoring a draft must not change public content",
);
await call("publish", { id: home.id, revision: saved.revision });
assert.ok(!(await (await fetch(base)).text()).includes(marker));
// Preserve both pre-existing snapshots, including a user's unpublished edits.
let reset = (await call("documents")).value.find((d) => d.id === home.id);
reset = (
  await call("save", {
    id: home.id,
    revision: reset.revision,
    content: originalPublished,
  })
).value;
reset = (await call("publish", { id: home.id, revision: reset.revision }))
  .value;
await call("save", {
  id: home.id,
  revision: reset.revision,
  content: original,
});
console.log(
  "PASS: real homepage draft isolation, authenticated preview, publish, conflict detection and version restore.",
);
const png = await sharp({
  create: { width: 2, height: 2, channels: 3, background: "#bb99ff" },
})
  .png()
  .toBuffer();
const form = new FormData();
form.set("file", new Blob([png], { type: "image/png" }), "check.png");
form.set("alt", "Integration check");
const upload = await fetch(base + "/api/cms/upload", {
  method: "POST",
  headers: { origin: base, cookie },
  body: form,
});
assert.equal(upload.status, 200);
const asset = await upload.json();
assert.equal((await fetch(base + asset.url)).status, 404);
for (const kind of ["projects", "blog", "careers", "page"]) {
  let d = (
    await call("create", {
      kind,
      slug: "cms-check-" + kind,
      title: "Integration " + kind,
    })
  ).value;
  const content = {
    ...d.draft,
    summary: "A publishing integration check",
    image: asset.url,
    alt: "Integration check",
    category: "Check",
    blocks: [{ type: "p", text: "Safe <script>window.bad=true</script> text" }],
    sections:
      kind === "page"
        ? [
            {
              id: "check",
              type: "text",
              title: "Published test page",
              body: "Real registered section",
              href: "",
              background: "#111111",
              color: "#ffffff",
              padding: 40,
              align: "left",
            },
          ]
        : [],
  };
  d = (await call("save", { id: d.id, revision: d.revision, content })).value;
  const path = kind === "page" ? "/" + d.slug : "/" + kind + "/" + d.slug;
  assert.equal((await fetch(base + path)).status, 404);
  d = (await call("publish", { id: d.id, revision: d.revision })).value;
  const page = await fetch(base + path);
  assert.equal(page.status, 200);
  assert.ok(
    (await page.text()).includes(
      kind === "page" ? "Published test page" : "Integration " + kind,
    ),
  );
  assert.equal((await fetch(base + asset.url)).status, 200);
  assert.ok((await (await fetch(base + "/sitemap.xml")).text()).includes(path));
  if (kind !== "page")
    assert.ok((await (await fetch(base + "/" + kind)).text()).includes(d.slug));
  d = (await call("unpublish", { id: d.id, revision: d.revision })).value;
  assert.equal((await fetch(base + path)).status, 404);
  await call("delete", { id: d.id, revision: d.revision });
}
console.log(
  "PASS: projects, blogs, careers, new pages, public listings, sitemap and unpublishing.",
);
await call("user", {
  email: "cms-editor@example.invalid",
  password,
  role: "editor",
});
const login = await call("login", {
  email: "cms-editor@example.invalid",
  password,
});
const editorCookie = login.response.headers.get("set-cookie").split(";")[0];
await call("publish", { id: home.id, revision: 1 }, 403, editorCookie);
assert.equal(
  (
    await fetch(base + "/api/cms/save", {
      method: "POST",
      headers: {
        origin: "https://evil.invalid",
        cookie,
        "Content-Type": "application/json",
      },
      body: "{}",
    })
  ).status,
  403,
);
assert.equal((await fetch(base + "/api/cms/documents")).status, 401);
console.log(
  "PASS: editor publishing restriction, anonymous API protection, CSRF origin rejection and private media.",
);
const archive = docs.find((d) => d.kind === "projects" && d.published?.archive);
assert.ok(archive, "imported archive must be preserved");
const archivePath = "/projects/" + archive.slug;
assert.equal(
  (await fetch(base + archivePath, { redirect: "manual" })).status,
  307,
);
const archivePreview = await fetch(
  base + archivePath + "?__cms_preview=" + archive.id,
  { headers: { cookie }, redirect: "manual" },
);
assert.equal(
  archivePreview.status,
  200,
  "archived entries must remain editable in protected previews",
);
assert.ok((await archivePreview.text()).includes(archive.draft.title));
const forged = await fetch(base, {
  headers: { "x-cms-preview": home.id, "x-cms-path": "/about" },
});
assert.equal(forged.status, 200, "incoming preview headers are not trusted");
await call("save", { id: home.id, revision: 0, content: {} }, 401, "");
const badUpload = new FormData();
badUpload.set(
  "file",
  new Blob(['<svg onload="alert(1)"></svg>'], { type: "image/png" }),
  "fake.png",
);
assert.equal(
  (
    await fetch(base + "/api/cms/upload", {
      method: "POST",
      headers: { origin: base, cookie },
      body: badUpload,
    })
  ).status,
  400,
);
await call("media-delete", { id: asset.id }, 400);
console.log(
  "PASS: archived editor previews, forged-header isolation, invalid upload rejection and in-use media protection.",
);
// Remove only this suite's disposable records after successful verification.
await pool.query("DELETE FROM cms_documents WHERE slug LIKE 'cms-check-%'");
await pool.query(
  "DELETE FROM cms_media WHERE name='check.png' AND alt='Integration check' AND NOT EXISTS (SELECT 1 FROM cms_documents d WHERE d.draft::text LIKE '%' || cms_media.id || '%' OR d.published::text LIKE '%' || cms_media.id || '%') AND NOT EXISTS (SELECT 1 FROM cms_versions v WHERE v.content::text LIKE '%' || cms_media.id || '%')",
);
await pool.query(
  "DELETE FROM cms_users WHERE email='cms-editor@example.invalid'",
);
await pool.end();
