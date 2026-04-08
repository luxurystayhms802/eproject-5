import { Button } from '@/components/ui/button';
import { buildImageBackdrop } from '@/features/public/utils';

export const PublicPageHero = ({
  eyebrow,
  title,
  description,
  image,
  stats = [],
  primaryAction,
  secondaryAction,
  align = 'left',
  headingAs = 'h1',
}) => {
  const backdropStyle = buildImageBackdrop(image, 0);
  const HeadingTag = headingAs;

  return (
    <section
      className="relative overflow-hidden rounded-[34px] border border-white/50 px-6 py-10 text-white shadow-[0_34px_110px_rgba(8,24,44,0.18)] md:px-10 md:py-14"
      style={backdropStyle}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),linear-gradient(106deg,rgba(248,241,233,0.82),rgba(248,241,233,0.58)_44%,rgba(194,146,76,0.16)_120%)]" />
      <div className={`relative z-10 grid gap-8 ${stats.length > 0 ? 'lg:grid-cols-[1.15fr,0.85fr]' : ''}`}>
        <div className={`space-y-5 rounded-[30px] bg-[rgba(250,245,238,0.78)] p-6 shadow-[0_24px_70px_rgba(16,36,63,0.08)] backdrop-blur-md md:p-8 ${align === 'center' ? 'text-center lg:text-left' : ''}`}>
          {eyebrow ? (
            <span className="inline-flex rounded-full border border-[rgba(184,140,74,0.22)] bg-white/82 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent)]">
              {eyebrow}
            </span>
          ) : null}
          <div className="space-y-4">
            <HeadingTag className="public-heading-xl max-w-4xl text-[var(--primary)]">{title}</HeadingTag>
            {description ? <p className="max-w-2xl text-base leading-8 text-[var(--muted-foreground)] md:text-lg">{description}</p> : null}
          </div>
          {primaryAction || secondaryAction ? (
            <div className="flex flex-wrap gap-3">
              {primaryAction ? (
              <Button
                  variant="secondary"
                  className="rounded-full px-6 py-3 text-sm !text-white shadow-[0_14px_34px_rgba(184,140,74,0.22)]"
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.label}
                </Button>
              ) : null}
              {secondaryAction ? (
                <Button
                  variant="outline"
                  className="rounded-full border-[var(--border-strong)] bg-white/70 px-6 py-3 text-sm text-[var(--primary)] hover:bg-white"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <div className="grid gap-3 self-end md:grid-cols-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[26px] border border-white/55 bg-[rgba(255,250,244,0.82)] p-5 backdrop-blur-md"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">{stat.label}</p>
                <p className="mt-4 font-[var(--font-display)] text-[2.3rem] leading-none text-[var(--primary)]">{stat.value}</p>
                {stat.description ? <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{stat.description}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

