import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminModal = ({ open, title, description, children, onClose, widthClassName = 'max-w-4xl' }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(8,24,44,0.45)] p-4 backdrop-blur-md">
      <div className={`relative max-h-[90vh] w-full overflow-hidden rounded-[26px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(248,239,226,0.96))] shadow-[0_28px_70px_rgba(8,24,44,0.2)] ${widthClassName}`}>
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(16,36,63,0.08)] px-5 py-4">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">LuxuryStay Admin</p>
            <div>
              <h3 className="text-[30px] leading-tight text-[var(--primary)] [font-family:var(--font-display)]">{title}</h3>
              {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p> : null}
            </div>
          </div>
          <Button type="button" variant="outline" className="h-10 w-10 rounded-full p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[calc(90vh-102px)] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
};
