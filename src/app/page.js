import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import PolicyLinksText from "@/components/legal/PolicyLinksText";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/",
  description:
    "OX Arena — เล่น Tic-Tac-Toe กับ Bot วัดฝีมือ จัดอันดับ Leaderboard",
});

/* mobile/tablet: กระจายแถบบน + ล่าง (ไม่บังกลาง) — desktop (lg+): คงตำแหน่งเดิม */
const marks = [
  { char: "X", className: "left-[6%] top-[2%] text-2xl text-teal-400/30 ox-float-a lg:left-[5%] lg:top-[10%] lg:text-5xl lg:text-teal-400/50", style: { animationDelay: "0s" } },
  { char: "O", className: "left-[40%] top-[8%] text-4xl text-cyan-300/25 ox-float-b lg:left-auto lg:right-[7%] lg:top-[16%] lg:text-8xl lg:text-cyan-300/45", style: { animationDelay: "-1.2s" } },
  { char: "X", className: "right-[8%] top-[12%] text-3xl text-amber-300/25 ox-float-c lg:right-auto lg:left-[18%] lg:top-auto lg:bottom-[16%] lg:text-9xl lg:text-amber-300/40", style: { animationDelay: "-2.4s" } },
  { char: "O", className: "left-[10%] bottom-[16%] text-xl text-teal-300/30 ox-float-a lg:left-auto lg:right-[18%] lg:bottom-[20%] lg:text-4xl lg:text-teal-300/55", style: { animationDelay: "-0.6s" } },
  { char: "X", className: "left-[36%] bottom-[28%] text-2xl text-cyan-400/25 ox-float-b lg:left-[44%] lg:bottom-auto lg:top-[6%] lg:text-3xl lg:text-cyan-400/50", style: { animationDelay: "-3.1s" } },
  { char: "O", className: "right-[10%] bottom-[12%] text-5xl text-amber-200/20 ox-float-c lg:right-auto lg:left-[2%] lg:bottom-auto lg:top-[60%] lg:text-7xl lg:text-amber-200/40", style: { animationDelay: "-1.8s" } },
  { char: "X", className: "left-[20%] top-[15%] text-5xl text-teal-200/20 ox-float-a lg:left-auto lg:right-[5%] lg:top-[46%] lg:text-[7.5rem] lg:text-teal-200/35", style: { animationDelay: "-4s" } },
  { char: "O", className: "right-[20%] bottom-[22%] text-2xl text-cyan-200/25 ox-float-b lg:right-auto lg:left-[58%] lg:bottom-[8%] lg:text-6xl lg:text-cyan-200/45", style: { animationDelay: "-2s" } },
  { char: "X", className: "right-[30%] top-[5%] text-xl text-teal-300/25 ox-float-c lg:right-auto lg:left-[30%] lg:top-[15%] lg:text-2xl lg:text-teal-300/45", style: { animationDelay: "-0.9s" } },
  { char: "O", className: "left-[55%] bottom-[34%] text-4xl text-amber-300/20 ox-float-a lg:left-auto lg:right-[32%] lg:bottom-auto lg:top-[24%] lg:text-5xl lg:text-amber-300/40", style: { animationDelay: "-3.5s" } },
  { char: "X", className: "left-[72%] bottom-[8%] text-3xl text-cyan-300/20 ox-float-b lg:left-auto lg:right-[26%] lg:bottom-[34%] lg:text-3xl lg:text-cyan-300/40", style: { animationDelay: "-1.5s" } },
  { char: "O", className: "hidden lg:block left-[68%] top-[40%] text-8xl text-teal-400/35 ox-float-c", style: { animationDelay: "-2.8s" } },
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
