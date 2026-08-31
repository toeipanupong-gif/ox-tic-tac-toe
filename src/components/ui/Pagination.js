"use client";

import Link from "next/link";

export default function Pagination({
  page,
  totalPages,
  basePath,
  query = {},
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p) {
    const params = new URLSearchParams({ ...query, page: String(p) });
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
          page <= 1
            ? "pointer-events-none opacity-40"
            : "text-slate-300 hover:border-teal-500/50 hover:text-teal-200"
        }`}
      >
        ก่อนหน้า
      </Link>
      <span className="text-sm text-slate-400">
        หน้า {page} / {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
          page >= totalPages
            ? "pointer-events-none opacity-40"
            : "text-slate-300 hover:border-teal-500/50 hover:text-teal-200"
        }`}
      >
        ถัดไป
      </Link>
    </div>
  );
}
