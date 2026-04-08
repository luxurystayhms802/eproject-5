import { Card } from '@/components/ui/card';
export const StatsCard = ({ title, value, description, icon: Icon }) => (<Card className="min-h-[164px] p-0">
    <div className="flex h-full flex-col justify-between gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="w-full truncate">
            <span className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              {title}
            </span>
          </div>
          <div className="w-full space-y-1.5 break-words">
            <p className="text-[34px] leading-none text-[var(--primary)] [font-family:var(--font-display)]">{value}</p>
            <p className="w-full text-sm leading-6 text-[var(--muted-foreground)]" title={description}>{description}</p>
          </div>
        </div>
        {Icon ? (
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(145deg,var(--primary)_0%,#21436b_58%,var(--accent)_145%)] text-white shadow-[0_14px_28px_rgba(16,36,63,0.14)]">
            <Icon className="h-5 w-5"/>
          </div>
        ) : null}
      </div>
      <div className="flex items-end gap-1.5">
        {[18, 28, 16, 34, 24, 30].map((height, index) => (<span key={`${title}-${index}`} className="w-full rounded-full bg-[linear-gradient(180deg,rgba(184,140,74,0.82)_0%,rgba(16,36,63,0.22)_100%)]" style={{ height: `${height}px` }}/>))}
      </div>
    </div>
  </Card>);
