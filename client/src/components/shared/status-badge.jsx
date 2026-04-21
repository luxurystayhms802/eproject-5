import { cn } from '@/lib/cn';
const toneMap = {
    available: 'bg-emerald-100 text-emerald-700',
    clean: 'bg-emerald-100 text-emerald-700',
    confirmed: 'bg-blue-100 text-blue-700',
    draft: 'bg-slate-100 text-slate-700',
    checked_in: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
    success: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    occupied: 'bg-amber-100 text-amber-700',
    pending: 'bg-amber-100 text-amber-700',
    partially_paid: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-amber-100 text-amber-700',
    cleaning: 'bg-orange-100 text-orange-700',
    dirty: 'bg-orange-100 text-orange-700',
    reserved: 'bg-indigo-100 text-indigo-700',
    assigned: 'bg-indigo-100 text-indigo-700',
    maintenance: 'bg-rose-100 text-rose-700',
    unpaid: 'bg-rose-100 text-rose-700',
    failed: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-slate-200 text-slate-700',
    closed: 'bg-slate-200 text-slate-700',
    refunded: 'bg-slate-200 text-slate-700',
    void: 'bg-slate-200 text-slate-700',
    resolved: 'bg-teal-100 text-teal-700',
    inspected: 'bg-cyan-100 text-cyan-700',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-200 text-slate-700',
    suspended: 'bg-rose-100 text-rose-700',
    low: 'bg-slate-200 text-slate-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-rose-100 text-rose-700',
};
export const StatusBadge = ({ value, className }) => {
    const label = value ? value.replaceAll('_', ' ') : 'n/a';
    const tone = toneMap[value ?? ''] ?? 'bg-slate-100 text-slate-700';
    return <span className={cn('inline-flex items-center gap-2 rounded-full border border-white/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-[0_10px_24px_rgba(16,36,63,0.06)]', tone, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80"/>
      {label}
    </span>;
};
