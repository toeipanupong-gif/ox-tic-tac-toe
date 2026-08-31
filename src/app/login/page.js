import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-teal-300">
        Login
      </h1>
      <p className="mt-3 text-slate-300">
        ต้อง Login ด้วย Google ก่อนเริ่มเล่นเกม
      </p>
      <div className="mt-8 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6">
        <GoogleSignInButton />
      </div>
    </section>
  );
}
