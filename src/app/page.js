import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const marks = [
  { char: "X", className: "left-[6%] top-[12%] text-6xl text-teal-400/25 ox-float-a" },
  { char: "O", className: "right-[8%] top-[18%] text-7xl text-cyan-300/20 ox-float-b" },
  { char: "X", className: "left-[18%] bottom-[18%] text-8xl text-amber-300/20 ox-float-c" },
  { char: "O", className: "right-[16%] bottom-[22%] text-6xl text-teal-300/25 ox-float-a" },
  { char: "X", className: "left-[42%] top-[8%] text-5xl text-cyan-400/15 ox-float-b" },
  { char: "O", className: "left-[8%] top-[48%] text-5xl text-amber-200/18 ox-float-c" },
  { char: "X", className: "right-[6%] top-[48%] text-8xl text-teal-200/15 ox-float-a" },
  { char: "O", className: "left-[55%] bottom-[10%] text-7xl text-cyan-200/18 ox-float-b" },
];

export default function HomePage() {
  return (
    <section className="relative flex min-h-[75vh] flex-col justify-center">
      {/* background: ตัวอักษร X/O + CSS @keyframes (ไม่ใช่ canvas/lib) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 select-none overflow-visible font-[family-name:var(--font-display)] font-extrabold"
      >
        {marks.map((m, i) => (
          <span key={`${m.char}-${i}`} className={`absolute ${m.className}`}>
            {m.char}
          </span>
        ))}
      </div>

      <p className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-teal-300 sm:text-7xl">
        OX Arena
      </p>
      <h1 className="mt-4 max-w-2xl text-2xl font-semibold text-slate-100 sm:text-3xl">
        พร้อมท้าชน Bot ในกระดาน OX ไหม?
      </h1>
      <p className="mt-3 max-w-xl text-lg text-slate-300">
        วัดฝีมือ จัดอันดับ — ใครเก่งกว่ากัน
      </p>
      <div className="mt-8 flex max-w-sm flex-col gap-3 overflow-visible py-2">
        <GoogleSignInButton />
      </div>
    </section>
  );
}
