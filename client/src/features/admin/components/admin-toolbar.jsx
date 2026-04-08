export const AdminToolbar = ({ title, description, children, actions }) => (
  <div className="rounded-[24px] border border-white/70 bg-[rgba(255,251,245,0.86)] p-4 shadow-[0_14px_34px_rgba(16,36,63,0.05)]">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="space-y-1">
        <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">{title}</h2>
        {description ? <p className="text-sm text-[var(--muted-foreground)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
    {children ? <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">{children}</div> : null}
  </div>
);
