import { CalendarRange, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const inputClassName =
  'h-12 rounded-2xl border border-[var(--border)] bg-white/85 px-4 text-sm text-[var(--primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[rgba(184,140,74,0.5)] focus:ring-4 focus:ring-[rgba(184,140,74,0.14)]';

export const ManagerReportToolbar = ({
  title,
  description,
  range,
  onRangeChange,
  onApply,
  onReset,
  onExport,
  onPrint,
  isExporting = false,
}) => (
  <div className="rounded-[24px] border border-[var(--border)] bg-white/78 p-4 shadow-[var(--shadow-soft)]">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[var(--primary)]">
          <CalendarRange className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {description ? <p className="text-sm leading-6 text-[var(--muted-foreground)]">{description}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[180px_180px_auto_auto_auto]">
        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">From</span>
          <input
            type="date"
            name="from"
            value={range.from}
            onChange={(event) => onRangeChange('from', event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">To</span>
          <input
            type="date"
            name="to"
            value={range.to}
            onChange={(event) => onRangeChange('to', event.target.value)}
            className={inputClassName}
          />
        </label>

        <Button type="button" variant="secondary" className="h-12 rounded-2xl px-5" onClick={onApply}>
          Apply range
        </Button>

        <Button type="button" variant="outline" className="h-12 rounded-2xl px-5" onClick={onExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="h-12 rounded-2xl px-5" onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button type="button" variant="outline" className="h-12 rounded-2xl px-5" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  </div>
);
