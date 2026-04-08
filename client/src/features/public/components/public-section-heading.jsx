export const PublicSectionHeading = ({ eyebrow, title, description, align = 'left', action = null, headingAs = 'h2' }) => {
  const alignmentClass = align === 'center' ? 'text-center items-center mx-auto' : 'text-left items-start';
  const HeadingTag = headingAs;

  return (
    <div className={`flex w-full flex-col gap-4 ${align === 'center' ? 'md:items-center' : 'md:flex-row md:items-end md:justify-between'}`}>
      <div className={`flex max-w-3xl flex-col gap-3 ${alignmentClass}`}>
        {eyebrow ? (
          <span className="w-max rounded-full border border-[rgba(184,140,74,0.24)] bg-white/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent)]">
            {eyebrow}
          </span>
        ) : null}
        <div className={align === 'center' ? 'space-y-4' : 'space-y-2'}>
          <HeadingTag className="public-heading-lg text-[var(--primary)]">{title}</HeadingTag>
          {description ? <p className="max-w-2xl text-base leading-8 text-[var(--muted-foreground)]">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
};
