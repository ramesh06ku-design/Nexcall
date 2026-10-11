import { AuthPageGuard } from "@/components/auth/auth-page-guard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthPageGuard>{children}</AuthPageGuard>;
}
