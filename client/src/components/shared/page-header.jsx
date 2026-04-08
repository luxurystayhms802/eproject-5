export const PageHeader = ({ title, description, action, children }) => (<section className="relative overflow-hidden rounded-[26px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,251,245,0.95)_0%,rgba(250,244,233,0.94)_58%,rgba(236,222,198,0.92)_100%)] p-5 shadow-[var(--shadow-soft)] lg:p-6">
    <div className="pointer-events-none absolute inset-y-0 right-0 w-56 bg-[radial-gradient(circle_at_center,rgba(16,36,63,0.12),transparent_72%)] opacity-70"/>
    <div className="pointer-events-none absolute -left-10 top-6 h-20 w-20 rounded-full border border-[rgba(184,140,74,0.18)]"/>
    <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 space-y-3">
        <span className="inline-flex w-fit items-center rounded-full border border-[rgba(184,140,74,0.24)] bg-white/76 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
          LuxuryStay Portal
        </span>
        <div className="space-y-2">
          <h1 className="text-[34px] leading-tight text-[var(--primary)] md:text-[42px] [font-family:var(--font-display)]">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)] md:text-[15px]">{description}</p>
        </div>
        {children ? <div className="flex flex-wrap gap-2.5">{children}</div> : null}
      </div>
      {action ? <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2.5">{action}</div> : null}
    </div>
  </section>);

