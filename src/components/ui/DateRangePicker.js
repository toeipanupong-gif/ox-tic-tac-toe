"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function parseIso(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDisplay(iso) {
  const d = parseIso(iso);
  if (!d) return "";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildCalendarDays(viewYear, viewMonth) {
  const first = new Date(viewYear, viewMonth, 1);
  // Monday-first: Sun=0 -> 6, Mon=1 -> 0, ...
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewYear, viewMonth, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export default function DateRangePicker({
  from,
  to,
  onChange,
  className = "",
  label = "When",
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [draftFrom, setDraftFrom] = useState(from || "");
  const [draftTo, setDraftTo] = useState(to || "");
  const [picking, setPicking] = useState("from"); // from | to
  const now = useMemo(() => new Date(), []);
  const initial = parseIso(from) || now;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(from || "");
    setDraftTo(to || "");
    setPicking(from && !to ? "to" : "from");
    const anchor = parseIso(from) || parseIso(to) || new Date();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
  }, [open, from, to]);

  function updateMenuPosition() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 320;
    let left = rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    let top = rect.bottom + 6;
    const estimatedHeight = 420;
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 6);
    }
    setMenuPos({ top, left, width });
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
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event) {
      const t = event.target;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }

    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const fromDate = parseIso(draftFrom);
  const toDate = parseIso(draftTo);
  const today = startOfDay(new Date());

  function shiftMonth(delta) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function pickDay(date) {
    const iso = toIso(date);
    if (picking === "from" || !draftFrom) {
      setDraftFrom(iso);
      setDraftTo("");
      setPicking("to");
      return;
    }

    if (fromDate && date < fromDate) {
      setDraftFrom(iso);
      setDraftTo("");
      setPicking("to");
      return;
    }

    setDraftTo(iso);
    setPicking("from");
  }

  function applyRange() {
    onChange?.({ from: draftFrom, to: draftTo });
    setOpen(false);
  }

  function clearRange() {
    setDraftFrom("");
    setDraftTo("");
    setPicking("from");
    onChange?.({ from: "", to: "" });
    setOpen(false);
  }

  function inRange(date) {
    if (!fromDate || !toDate) return false;
    const t = date.getTime();
    return t > fromDate.getTime() && t < toDate.getTime();
  }

  const summary =
    from || to
      ? `${from ? formatDisplay(from) : "…"} – ${to ? formatDisplay(to) : "…"}`
      : "เลือกช่วงวันที่";

  const menu =
    open &&
    menuPos &&
    mounted &&
    createPortal(
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          zIndex: 80,
        }}
        className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur"
      >
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setPicking("from")}
            className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
              picking === "from"
                ? "border-teal-400/50 bg-teal-500/15 text-teal-200"
                : "border-slate-700/70 bg-slate-900/40 text-slate-300 hover:border-slate-500"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              จาก
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {draftFrom ? formatDisplay(draftFrom) : "เลือกวัน"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPicking("to")}
            className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
              picking === "to"
                ? "border-teal-400/50 bg-teal-500/15 text-teal-200"
                : "border-slate-700/70 bg-slate-900/40 text-slate-300 hover:border-slate-500"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              ถึง
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {draftTo ? formatDisplay(draftTo) : "เลือกวัน"}
            </p>
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="cursor-pointer rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-teal-200"
            aria-label="เดือนก่อนหน้า"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="text-sm font-semibold text-slate-100">
            {MONTHS_TH[viewMonth]} {viewYear + 543}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="cursor-pointer rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-teal-200"
            aria-label="เดือนถัดไป"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 px-0.5">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 px-0.5">
          {days.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="h-9" />;
            }

            const isFrom = sameDay(date, fromDate);
            const isTo = sameDay(date, toDate);
            const isEnds = isFrom || isTo;
            const mid = inRange(date);
            const isToday = sameDay(date, today);

            return (
              <button
                key={toIso(date)}
                type="button"
                onClick={() => pickDay(date)}
                className={`relative h-9 cursor-pointer rounded-xl text-sm font-medium transition ${
                  isEnds
                    ? "bg-teal-500/90 text-slate-950 shadow shadow-teal-500/20"
                    : mid
                      ? "bg-teal-500/15 text-teal-100"
                      : "text-slate-200 hover:bg-slate-800/80"
                } ${isToday && !isEnds ? "ring-1 ring-cyan-400/40" : ""}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={clearRange}
            className="cursor-pointer rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800/80 hover:text-rose-300"
          >
            ล้าง
          </button>
          <button
            type="button"
            onClick={applyRange}
            className="cursor-pointer rounded-xl bg-teal-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            ใช้ช่วงนี้
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={`relative z-20 flex items-center gap-2 ${className}`}>
      {label ? (
        <span className="text-[10px] uppercase tracking-widest text-slate-400">
          {label}
        </span>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-w-[12rem] cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-left transition hover:border-teal-500/50"
      >
        <span className="flex items-center gap-2">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0 text-teal-300/80"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c0-.69.56-1.25 1.25-1.25h10.5c.69 0 1.25.56 1.25 1.25v.5H4.75v-.5z"
              clipRule="evenodd"
            />
          </svg>
          <span
            className={`text-sm font-semibold leading-tight ${
              from || to ? "text-teal-200" : "text-slate-400"
            }`}
          >
            {summary}
          </span>
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
