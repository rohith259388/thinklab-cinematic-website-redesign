import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

  return <Studio />;
}
