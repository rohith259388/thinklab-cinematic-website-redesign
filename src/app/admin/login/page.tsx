import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { session } from "@/lib/cms/auth";
import AuthCard from "@/components/cms/AuthCard";

export const metadata = {
  title: "Sign In | Thinklab Studio",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cms_session")?.value;
  if (token) {
    try {
      const user = await session(token);
      if (user) {
        redirect("/admin");
      }
    } catch {}
  }

  return <AuthCard initialMode="login" />;
}
