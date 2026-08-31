import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/",
  description:
    "OX Arena — เล่น Tic-Tac-Toe กับ Bot วัดฝีมือ จัดอันดับ Leaderboard",
});

const marks = [
  { char: "X", className: "left-[4%] top-[10%] text-4xl text-teal-400/25 ox-float-a sm:left-[6%] sm:top-[12%] sm:text-6xl" },
  { char: "O", className: "right-[4%] top-[14%] text-5xl text-cyan-300/20 ox-float-b sm:right-[8%] sm:top-[18%] sm:text-7xl" },
  { char: "X", className: "left-[12%] bottom-[14%] text-6xl text-amber-300/20 ox-float-c sm:left-[18%] sm:bottom-[18%] sm:text-8xl" },
  { char: "O", className: "right-[10%] bottom-[18%] text-4xl text-teal-300/25 ox-float-a sm:right-[16%] sm:bottom-[22%] sm:text-6xl" },
  { char: "X", className: "left-[40%] top-[6%] text-3xl text-cyan-400/15 ox-float-b sm:left-[42%] sm:top-[8%] sm:text-5xl" },
  { char: "O", className: "left-[4%] top-[46%] text-3xl text-amber-200/18 ox-float-c sm:left-[8%] sm:top-[48%] sm:text-5xl" },
  { char: "X", className: "right-[3%] top-[46%] text-5xl text-teal-200/15 ox-float-a sm:right-[6%] sm:top-[48%] sm:text-8xl" },
  { char: "O", className: "left-[48%] bottom-[8%] text-5xl text-cyan-200/18 ox-float-b sm:left-[55%] sm:bottom-[10%] sm:text-7xl" },
];

export default function HomePage() {
  return (
    <section className="relative flex min-h-[70vh] flex-col justify-center sm:min-h-[75vh]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 select-none overflow-hidden font-[family-name:var(--font-display)] font-extrabold"
      >
        {marks.map((m, i) => (
          <span key={`${m.char}-${i}`} className={`absolute ${m.className}`}>
            {m.char}
          </span>
        ))}
      </div>

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
      </div>
    </section>
  );
}
