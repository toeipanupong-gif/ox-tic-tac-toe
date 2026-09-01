export default function LegalDocLayout({ title, updatedAt, children }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 pb-4">
      <header className="space-y-2 border-b border-slate-800 pb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-teal-300 break-keep [line-break:strict] sm:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-slate-400 break-keep [line-break:strict]">
          อัปเดตล่าสุด: {updatedAt}
        </p>
      </header>
      <div className="space-y-5 text-sm leading-relaxed text-slate-300 break-keep [line-break:strict] [overflow-wrap:normal] sm:text-base [&_h2]:mt-8 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-100 [&_li]:break-keep [&_p]:break-keep [&_span.nowrap-word]:whitespace-nowrap [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
