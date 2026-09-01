import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import PolicyLinksText from "@/components/legal/PolicyLinksText";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/",
  description:
    "OX Arena — เล่น Tic-Tac-Toe กับ Bot วัดฝีมือ จัดอันดับ Leaderboard",
});

const marks = [
  { char: "X", className: "left-[3%] top-[8%] text-3xl text-teal-400/50 ox-float-a sm:left-[5%] sm:top-[10%] sm:text-5xl", style: { animationDelay: "0s" } },
  { char: "O", className: "right-[4%] top-[12%] text-6xl text-cyan-300/45 ox-float-b sm:right-[7%] sm:top-[16%] sm:text-8xl", style: { animationDelay: "-1.2s" } },
  { char: "X", className: "left-[14%] bottom-[12%] text-7xl text-amber-300/40 ox-float-c sm:left-[18%] sm:bottom-[16%] sm:text-9xl", style: { animationDelay: "-2.4s" } },
  { char: "O", className: "right-[12%] bottom-[16%] text-2xl text-teal-300/55 ox-float-a sm:right-[18%] sm:bottom-[20%] sm:text-4xl", style: { animationDelay: "-0.6s" } },
  { char: "X", className: "left-[42%] top-[4%] text-2xl text-cyan-400/50 ox-float-b sm:left-[44%] sm:top-[6%] sm:text-3xl", style: { animationDelay: "-3.1s" } },
  { char: "O", className: "left-[5%] top-[42%] text-5xl text-amber-200/40 ox-float-c sm:left-[8%] sm:top-[44%] sm:text-7xl", style: { animationDelay: "-1.8s" } },
  { char: "X", className: "right-[2%] top-[44%] text-8xl text-teal-200/35 ox-float-a sm:right-[5%] sm:top-[46%] sm:text-[7.5rem]", style: { animationDelay: "-4s" } },
  { char: "O", className: "left-[52%] bottom-[6%] text-4xl text-cyan-200/45 ox-float-b sm:left-[58%] sm:bottom-[8%] sm:text-6xl", style: { animationDelay: "-2s" } },
  { char: "X", className: "left-[28%] top-[28%] text-xl text-teal-300/45 ox-float-c sm:left-[30%] sm:top-[15%] sm:text-2xl", style: { animationDelay: "-0.9s" } },
  { char: "O", className: "right-[28%] top-[22%] text-3xl text-amber-300/40 ox-float-a sm:right-[32%] sm:top-[24%] sm:text-5xl", style: { animationDelay: "-3.5s" } },
  { char: "X", className: "right-[22%] bottom-[32%] text-xl text-cyan-300/40 ox-float-b sm:right-[26%] sm:bottom-[34%] sm:text-3xl", style: { animationDelay: "-1.5s" } },
  { char: "O", className: "left-[62%] top-[38%] text-6xl text-teal-400/35 ox-float-c sm:left-[68%] sm:top-[40%] sm:text-8xl", style: { animationDelay: "-2.8s" } },
];

export default function HomePage() {
  return (
    <section className="relative flex min-h-[70vh] flex-col justify-center sm:min-h-[75vh]">
      {/* z-0 อยู่เหนือ body::before (-1) — เดิม -z-10 ถูกพื้นหลังบัง */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden font-[family-name:var(--font-display)] font-extrabold"
      >
        {marks.map((m, i) => (
          <span
            key={`${m.char}-${i}`}
            className={`absolute will-change-transform ${m.className}`}
            style={m.style}
          >
            {m.char}
          </span>
        ))}
      </div>

      <div className="relative z-10">
        <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-teal-300 sm:text-5xl md:text-7xl">
          OX Arena
        </p>
        <h1 className="mt-3 max-w-2xl text-xl font-semibold text-slate-100 sm:mt-4 sm:text-2xl md:text-3xl">
          พร้อมท้าชน Bot ในกระดาน OX ไหม?
        </h1>
        <p className="mt-2 max-w-xl text-base text-slate-300 sm:mt-3 sm:text-lg">
          วัดฝีมือ จัดอันดับ — ใครเก่งกว่ากัน
        </p>
        <div className="mt-6 flex max-w-sm flex-col gap-3 overflow-visible py-2 sm:mt-8">
          <GoogleSignInButton />
          <PolicyLinksText className="max-w-md" />
        </div>
      </div>
    </section>
  );
}
