import { AuthHero } from '@/features/auth/components/auth-hero';

export const AuthPageLayout = ({ title, description, children }) => (
  <div className="flex min-h-screen w-full bg-[#f8f5ef] overflow-hidden selection:bg-[var(--accent)]/30 selection:text-[var(--primary)]">
    {/* Left pane - Hero Cinematic */}
    <div className="hidden lg:block lg:flex-[1.2] relative overflow-hidden">
      <AuthHero title={title} description={description} />
    </div>

    {/* Right pane - Elegant Form Workspace */}
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 xl:px-24">
      {/* Mobile-only condensed hero */}
      <div className="w-full max-w-md mb-12 lg:hidden text-center space-y-4 animate-in fade-in slide-in-from-top-6 duration-1000">
         <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--accent)]">Guest Portal</p>
         <h2 className="font-[var(--font-display)] text-[2.5rem] leading-tight text-[var(--primary)]">{title}</h2>
         <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)] px-4">{description}</p>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 ease-[cubic-bezier(0.25,1,0.5,1)] fill-mode-both">
        {children}
      </div>
    </div>
  </div>
);
