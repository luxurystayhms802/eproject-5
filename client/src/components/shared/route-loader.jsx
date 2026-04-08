export const RouteLoader = ({ label = 'Loading workspace' }) => (
  <div className="rounded-[28px] border border-white/65 bg-[rgba(255,251,244,0.82)] p-6 shadow-[0_18px_38px_rgba(16,36,63,0.06)]">
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">LuxuryStay</p>
        <h2 className="mt-2 text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">{label}</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-28 animate-pulse rounded-[22px] bg-white/80" />
        <div className="h-28 animate-pulse rounded-[22px] bg-white/72" />
        <div className="h-28 animate-pulse rounded-[22px] bg-white/68" />
      </div>
      <div className="grid gap-3">
        <div className="h-24 animate-pulse rounded-[22px] bg-white/76" />
        <div className="h-24 animate-pulse rounded-[22px] bg-white/70" />
      </div>
    </div>
  </div>
);
