import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { getDisplayRoleLabel } from '@/features/admin/config';
import { adminNavSections, hasPermission } from '@/components/layout/sidebar';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const CustomRoleDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const displayRole = getDisplayRoleLabel(user?.role || 'staff').replace('_', ' ');

  // Flatten and filter the available modules based on the user's specific permissions
  const authorizedModules = adminNavSections
    .flatMap((section) => section.items)
    .filter((item) => item.href !== '/admin/dashboard' && hasPermission(item.href, user?.permissions))
    .map(item => ({ ...item, href: item.href.replace(/^\/admin\//, '/staff/') }));

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title={`${displayRole} Hub`}
        description="Welcome to your personal workspace. Below are the operational modules you have been authorized to access."
      />

      {authorizedModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-[rgba(16,36,63,0.1)] bg-[rgba(16,36,63,0.02)] p-12 text-center">
          <p className="text-[15px] text-[var(--muted-foreground)]">
            You do not currently have access to any modules. Please contact an administrator.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {authorizedModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                to={module.href}
                className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(248,239,226,0.96))] p-6 shadow-[0_8px_24px_rgba(8,24,44,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(8,24,44,0.08)]"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(184,140,74,0.08),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_4px_12px_rgba(16,36,63,0.12)]">
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-[17px] font-semibold tracking-tight text-[var(--primary)]">{module.label}</h3>
                  <p className="text-[13px] text-[var(--muted-foreground)]">Manage {module.label.toLowerCase()}</p>
                </div>
                
                <div className="mt-auto flex items-center pt-2 text-[13px] font-semibold text-[var(--accent)] transition-transform duration-300 group-hover:translate-x-1">
                  Open module
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
