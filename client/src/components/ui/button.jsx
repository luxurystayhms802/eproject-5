import { cn } from '@/lib/cn';
const variants = {
    primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[#18355d]',
    secondary: 'bg-[var(--accent)] text-white hover:bg-[#a97c3d]',
    ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--accent-soft)]/50 hover:text-[var(--primary)]',
    outline: 'border border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:bg-white hover:border-[rgba(184,140,74,0.4)] hover:shadow-[0_8px_16px_rgba(16,36,63,0.06)] hover:text-[var(--primary)]',
};
export const Button = ({ className, variant = 'primary', ...props }) => (<button className={cn('inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60', variants[variant], className)} {...props}/>);
