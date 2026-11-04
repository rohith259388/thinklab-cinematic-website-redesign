import AuthCard from "@/components/cms/AuthCard";

export const metadata = {
  title: "Sign In | Thinklab Studio",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}

