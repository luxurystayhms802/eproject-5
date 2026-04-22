import { cn } from '@/lib/cn';
export const Card = ({ children, className, ...props }) => (
  <div className={cn("relative overflow-hidden rounded-[24px] border border-white/70 bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.16)_48%,rgba(184,140,74,0.06)_100%)] before:content-['']", className)} {...props}>
    <div className="relative z-10">{children}</div>
  </div>
);
