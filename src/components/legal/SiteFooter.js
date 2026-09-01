"use client";

import { usePathname } from "next/navigation";

const HIDE_ON = new Set(["/", "/login"]);

export default function SiteFooter() {
  const pathname = usePathname();
  if (HIDE_ON.has(pathname)) return null;

  const linkClass =
    "text-slate-400 underline-offset-2 transition hover:text-teal-300 hover:underline";

  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/40">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-3 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <p>© {new Date().getFullYear()} OX Arena</p>
          <a href="mailto:toeipanupong@gmail.com" className={linkClass}>
            ติดต่อ: toeipanupong@gmail.com
          </a>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="นโยบาย">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            นโยบายความเป็นส่วนตัว
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            ข้อกำหนดการใช้บริการ
          </a>
        </nav>
      </div>
    </footer>
  );
}
