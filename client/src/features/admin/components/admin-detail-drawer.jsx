import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminDetailDrawer = ({
  open,
  title,
  subtitle,
  eyebrow = 'LuxuryStay admin',
  actions,
  onClose,
  children,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[82] bg-[rgba(8,24,44,0.28)] backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 w-full max-w-[560px] border-l border-white/70 bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(247,239,227,0.98))] shadow-[-26px_0_70px_rgba(8,24,44,0.16)]">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-[rgba(16,36,63,0.08)] px-6 py-5">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">{eyebrow}</p>
              <div>
                <h3 className="text-[30px] leading-tight text-[var(--primary)] [font-family:var(--font-display)]">{title}</h3>
                {subtitle ? <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{subtitle}</p> : null}
              </div>
            </div>
            <Button type="button" variant="outline" className="h-10 w-10 rounded-full p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {actions ? <div className="flex flex-wrap gap-3 border-b border-[rgba(16,36,63,0.08)] px-6 py-4">{actions}</div> : null}

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminDetailSection = ({ title, description, children }) => (
  <section className="rounded-[24px] border border-[var(--border)] bg-white/78 p-5 shadow-[0_16px_30px_rgba(16,36,63,0.05)]">
    <div className="mb-4 space-y-1">
      <h4 className="text-base font-semibold text-[var(--primary)]">{title}</h4>
      {description ? <p className="text-sm leading-6 text-[var(--muted-foreground)]">{description}</p> : null}
    </div>
    {children}
  </section>
);

export const AdminDetailGrid = ({ children, columns = 2 }) => (
  <div className={columns === 1 ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2'}>{children}</div>
);

export const AdminDetailItem = ({ label, value, emphasis = false }) => (
  <div className="rounded-[20px] border border-[var(--border)] bg-white/84 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{label}</p>
    <p className={`mt-2 text-sm leading-6 ${emphasis ? 'font-semibold text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
      {value || 'n/a'}
    </p>
  </div>
);
