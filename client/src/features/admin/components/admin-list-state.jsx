import { Button } from '@/components/ui/button';

export const AdminResultsSummary = ({
  count,
  noun = 'records',
  activeFilters = [],
  onClearFilters,
}) => (
  <div className="flex flex-col gap-3 rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-3 shadow-[0_12px_26px_rgba(16,36,63,0.04)] lg:flex-row lg:items-center lg:justify-between">
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--foreground)]">
        Viewing <span className="font-semibold text-[var(--primary)]">{count}</span> {noun}
      </p>
      {activeFilters.length ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span key={filter} className="rounded-full border border-[var(--border)] bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {filter}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">No filters applied. You are viewing the full operational list.</p>
      )}
    </div>

    {activeFilters.length ? (
      <Button type="button" variant="outline" onClick={onClearFilters}>
        Clear filters
      </Button>
    ) : null}
  </div>
);

export const AdminEmptyState = ({
  title,
  description,
  action,
}) => (
  <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 p-8">
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-[var(--primary)]">{title}</h3>
      <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{description}</p>
    </div>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
