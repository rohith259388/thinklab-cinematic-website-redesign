import AuthCard from "@/components/cms/AuthCard";

export const metadata = {
  title: "Register | Thinklab Studio",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <AuthCard initialMode="register" />;
}

