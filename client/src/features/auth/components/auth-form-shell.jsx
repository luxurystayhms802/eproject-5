export const AuthFormShell = ({ eyebrow, title, description, footer, children }) => (
  <div className="w-full">
    <div className="mb-10 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.36em] text-[var(--accent)]">{eyebrow}</p>
      </div>
      <h1 className="font-[var(--font-display)] text-[2.75rem] leading-[1.05] tracking-tight text-[var(--primary)]">{title}</h1>
      <p className="text-[15px] leading-7 text-[var(--muted-foreground)] border-l-2 border-[var(--accent)]/30 pl-4">{description}</p>
    </div>
    
    <div className="space-y-6">{children}</div>
    
    {footer ? <div className="mt-10 border-t border-[rgba(16,36,63,0.08)] pt-6 text-[13px] text-[var(--muted-foreground)]">{footer}</div> : null}
  </div>
);

