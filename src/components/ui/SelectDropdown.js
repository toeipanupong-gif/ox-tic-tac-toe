"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_MIN_WIDTH = 160;

export default function SelectDropdown({
  value,
  onChange,
  options = [],
  className = "",
  menuWidth = MENU_MIN_WIDTH,
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  function updateMenuPosition() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.max(menuWidth, rect.width);
    let left = rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setMenuPos({
      top: rect.bottom + 6,
      left,
      width,
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, menuWidth]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event) {
      const t = event.target;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function selectOption(next) {
    onChange?.(next);
    setOpen(false);
  }

  const menu =
    open &&
    menuPos &&
    mounted &&
    createPortal(
      <div
        ref={menuRef}
        role="listbox"
        style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          zIndex: 80,
        }}
        className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur"
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => selectOption(opt.value)}
              className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left transition ${
                isSelected
                  ? "bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/40"
                  : "text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={`relative z-20 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-w-[7.5rem] cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-left text-slate-100 transition hover:border-teal-500/50"
      >
        <span className="text-sm font-semibold leading-tight text-teal-200">
          {selected?.label ?? "เลือก"}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-slate-400 opacity-70 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {menu}
    </div>
  );
}
