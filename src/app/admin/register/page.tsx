import { redirect } from "next/navigation";
import AuthCard from "@/components/cms/AuthCard";
import { trySession } from "@/lib/cms/auth";

export const metadata = {
  title: "Register | Thinklab Studio",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  if (await trySession()) redirect("/admin");
  return <AuthCard initialMode="register" />;
}
