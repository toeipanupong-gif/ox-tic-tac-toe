import Link from "next/link";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function HomePage() {
  return (
    <section className="relative flex min-h-[75vh] flex-col justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full border border-teal-400/20" />
        <div className="absolute left-[12%] top-[35%] h-24 w-24 rotate-12 rounded-lg border border-cyan-300/30" />
        <div className="absolute right-[14%] top-[28%] h-28 w-28 -rotate-6 rounded-lg border border-amber-300/25" />
      </div>

      <p className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-teal-300 sm:text-7xl">
        OX Arena
      </p>
      <h1 className="mt-4 max-w-2xl text-2xl font-semibold text-slate-100 sm:text-3xl">
        ท้าทาย Bot Minimax ในเกม Tic-Tac-Toe
      </h1>
      <p className="mt-4 max-w-xl text-slate-300">
        Login ด้วย Google แล้วสะสมคะแนน ชนะติดกัน 3 ครั้งรับ Bonus และแข่งบน Leaderboard
      </p>
      <div className="mt-8 flex max-w-sm flex-col gap-3">
        <GoogleSignInButton />
      </div>
    </section>
  );
}
