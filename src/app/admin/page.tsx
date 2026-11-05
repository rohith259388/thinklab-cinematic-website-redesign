import { redirect } from "next/navigation";
import Studio from "@/components/cms/Studio";
import { trySession } from "@/lib/cms/auth";
import { documents } from "@/lib/cms/store";

export const metadata = {
  title: "Thinklab Studio",
  robots: { index: false, follow: false },
};

export default async function Admin() {
  // The session is checked on the server, so a signed-out visitor is redirected
  // before any Studio code loads. (The proxy already redirects when there is no
  // cookie at all; this also catches expired or revoked sessions.)
  const user = await trySession();
  if (user === null) redirect("/admin/login");

  // Database briefly unreachable: render the Studio and let it retry client-side
  // instead of logging a valid session out.
  if (user === undefined) return <Studio />;

  const docs = await documents().catch(() => undefined);
  return <Studio initialUser={{ email: user.email, role: user.role }} initialDocs={docs} />;
}
