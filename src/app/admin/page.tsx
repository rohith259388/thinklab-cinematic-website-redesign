import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { session } from "@/lib/cms/auth";
import Studio from "@/components/cms/Studio";

export const metadata = {
  title: "Thinklab Studio",
  robots: { index: false, follow: false },
};

export default async function Admin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cms_session")?.value;
  if (!token) {
    redirect("/admin/login");
  }

  try {
    const user = await session(token);
    if (!user) {
      redirect("/admin/login");
    }
  } catch {
    redirect("/admin/login");
  }

  return <Studio />;
}
