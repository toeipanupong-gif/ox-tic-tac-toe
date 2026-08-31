import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Login",
  description: "เข้าสู่ระบบ OX Arena ด้วย Google เพื่อเริ่มเล่น Tic-Tac-Toe",
  path: "/login",
});

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-md flex-col justify-center sm:min-h-[70vh]">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-teal-300 sm:text-4xl">
        Login
      </h1>
      <p className="mt-3 text-sm text-slate-300 sm:text-base">
        ต้อง Login ด้วย Google ก่อนเริ่มเล่นเกม
      </p>
      <div className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-4 sm:mt-8 sm:p-6">
        <GoogleSignInButton />
      </div>
    </section>
  );
}
