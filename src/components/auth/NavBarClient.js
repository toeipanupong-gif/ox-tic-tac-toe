"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
];

function linkClass(active) {
  return active
    ? "text-teal-300"
    : "text-slate-300 hover:text-teal-300";
}

export default function NavBarClient({ isAdmin, logoutAction }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      function onKey(e) {
        if (e.key === "Escape") setOpen(false);
      }
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }

    if (!mounted) return;
    const t = setTimeout(() => setMounted(false), 280);
    document.body.style.overflow = "";
    return () => clearTimeout(t);
  }, [open, mounted]);

  const allLinks = isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin", admin: true }]
    : LINKS;

  const mobileMenu =
    portalReady &&
    mounted &&
    createPortal(
      <div
        id="mobile-nav"
        className="fixed inset-0 z-[100] md:hidden"
        aria-hidden={!open}
      >
        {/* พื้นทึบเต็มจอ — ไม่โปร่งใส */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-out ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
          style={{
            backgroundColor: "#041018",
            backgroundImage:
              "radial-gradient(circle at 20% 15%, #0a2a2e 0%, #041018 42%), radial-gradient(circle at 80% 85%, #0c2438 0%, #041018 40%), linear-gradient(160deg, #041018 0%, #0b1728 50%, #102033 100%)",
          }}
        />

        <nav
          className={`absolute inset-0 flex flex-col px-6 pb-10 pt-20 transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "-translate-y-3"
          }`}
        >
          <ul className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-2">
            {allLinks.map((link, i) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);
              return (
                <li
                  key={link.href}
                  className={`transition-all duration-300 ease-out ${
                    open
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  }`}
                  style={{
                    transitionDelay: open ? `${80 + i * 50}ms` : "0ms",
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-2xl px-4 py-4 text-center text-2xl font-[family-name:var(--font-display)] tracking-wide transition ${
                      link.admin
                        ? active
                          ? "bg-amber-500/15 text-amber-300"
                          : "text-slate-200 hover:bg-slate-800/70 hover:text-amber-300"
                        : active
                          ? "bg-teal-500/15 text-teal-300"
                          : "text-slate-200 hover:bg-slate-800/70 hover:text-teal-300"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li
              className={`mt-6 transition-all duration-300 ease-out ${
                open
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
              style={{
                transitionDelay: open
                  ? `${80 + allLinks.length * 50}ms`
                  : "0ms",
              }}
            >
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-2xl border border-slate-600 px-4 py-4 text-center text-lg text-slate-300 transition hover:border-rose-400 hover:text-rose-300"
                >
                  Logout
                </button>
              </form>
            </li>
          </ul>
        </nav>
      </div>,
      document.body
    );

  return (
    <header
      className={`sticky top-0 border-b border-slate-700/60 ${
        open || mounted
          ? "z-[110] bg-[#041018]"
          : "z-40 bg-slate-950/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link
          href="/dashboard"
          className="font-[family-name:var(--font-display)] text-lg tracking-wide text-teal-300 sm:text-xl"
        >
          OX Arena
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex lg:gap-5">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.admin
                  ? pathname.startsWith("/admin")
                    ? "text-amber-300"
                    : "text-slate-300 hover:text-amber-300"
                  : linkClass(
                      pathname === link.href ||
                        pathname.startsWith(`${link.href}/`)
                    )
              }
            >
              {link.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button
              type="submit"
              className="cursor-pointer rounded-lg border border-slate-600 px-3 py-1.5 text-slate-300 transition hover:border-rose-400 hover:text-rose-300"
            >
              Logout
            </button>
          </form>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-700/80 text-slate-200 transition hover:border-teal-500/50 hover:text-teal-200 md:hidden"
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileMenu}
    </header>
  );
}
