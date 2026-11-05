import { redirect } from "next/navigation";
import AuthCard from "@/components/cms/AuthCard";
import { trySession } from "@/lib/cms/auth";

export const metadata = {
  title: "Sign In | Thinklab Studio",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in (session cookie lasts 7 days until logout): go straight to the workspace.
  if (await trySession()) redirect("/admin");
  return <AuthCard initialMode="login" />;
}
