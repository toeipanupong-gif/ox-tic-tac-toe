"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/lib/game/difficulty";

export default function StartGameButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // useEffect(() => {
  //   if (!open) return;

  //   function onPointerDown(event) {
  //     if (rootRef.current && !rootRef.current.contains(event.target)) {
  //       setOpen(false);
  //     }
  //   }

  //   document.addEventListener("pointerdown", onPointerDown);
  //   return () => document.removeEventListener("pointerdown", onPointerDown);
  // }, [open]);

  function play(level) {
    setOpen(false);
    router.push(`/game?difficulty=${level}`);
  }

  return (
    <div ref={rootRef} className="relative flex flex-col items-center gap-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="play-cta">
        เริ่มเล่นเกม
      </button>

      {open && (
        <div className="z-10 flex flex-wrap justify-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/95 p-3 shadow-xl backdrop-blur">
          <p className="w-full text-center text-xs uppercase tracking-widest text-slate-400">
            เลือกระดับ Bot
          </p>
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => play(level)}
              className="cursor-pointer rounded-xl bg-teal-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              {DIFFICULTY_LABELS[level]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
