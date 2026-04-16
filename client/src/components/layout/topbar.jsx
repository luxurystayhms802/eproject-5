import { Bell, ChevronDown, Menu, Search, LogOut, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/api';
import { getDisplayRoleLabel } from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import { useNotifications } from '@/features/notifications/hooks';

export const Topbar = ({ onOpenSidebar = () => {} }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const { data: notifications } = useNotifications();

  const unreadCount = (notifications ?? []).filter((item) => !item.isRead).length;
  const segments = location.pathname.split('/').filter(Boolean);
  const baseSegment = segments[0] || '';
  const notificationsPath = baseSegment ? `/${baseSegment}/notifications` : '/';
  const accountSettingsPath = ['manager', 'reception', 'housekeeping', 'maintenance', 'guest', 'staff'].includes(baseSegment)
    ? `/${baseSegment}/profile`
    : `/${baseSegment}/account-settings`;
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());



  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Keep logout resilient even if the network request fails.
    }
    logout();
    toast.success('Signed out successfully');
  };

  const displayRole = getDisplayRoleLabel(user?.role ?? 'guest').replace('_', ' ');
  const displayName = getDisplayName(user, 'Demo Operator');

  return (
    <div className="relative z-50 rounded-[24px] border border-white/70 bg-[rgba(255,251,245,0.92)] px-4 py-4 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start md:items-center gap-3">
          <button
            type="button"
            className="mt-1 md:mt-0 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border)] bg-white text-[var(--primary)] shadow-[0_8px_18px_rgba(16,36,63,0.06)] transition hover:bg-[var(--accent-soft)] lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-[var(--muted-foreground)] hidden sm:block">{formattedDate}</p>
              <h2 className="truncate text-[22px] sm:text-[28px] leading-tight text-[var(--primary)] [font-family:var(--font-display)] lg:text-[32px]">
                Welcome, {user?.firstName ?? 'Operator'}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex w-full items-center justify-end gap-3 sm:flex-row lg:w-auto">


            <div className="flex items-center gap-2 lg:gap-3">
              <Button
                variant="outline"
                title="Sign out"
                onClick={handleLogout}
                className="hidden md:flex h-[44px] w-[44px] lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-[16px] border border-[var(--border)] bg-white text-[var(--danger)]/80 hover:text-[var(--danger)] hover:bg-[var(--danger)]/5 shadow-[0_8px_20px_rgba(16,36,63,0.04)]"
              >
                <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>

              <Link
                to={notificationsPath}
                className="relative flex h-[44px] w-[44px] lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-[16px] border border-[var(--border)] bg-white text-[var(--primary)] shadow-[0_8px_20px_rgba(16,36,63,0.04)] hover:bg-[var(--accent-soft)] transition"
              >
                <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white shadow-sm ring-2 ring-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>

              <div 
                ref={profileRef}
                className="relative select-none shrink-0"
              >
                <div 
                  className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[linear-gradient(135deg,var(--primary)_0%,#254970_100%)] text-sm font-bold uppercase tracking-[0.1em] text-white shadow-md ring-1 ring-[var(--border)] overflow-hidden"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.firstName ?? 'Admin'} className="h-full w-full object-cover" />
                  ) : (
                    user?.firstName?.charAt(0) ?? 'L'
                  )}
                </div>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] z-50 rounded-[20px] border border-[var(--border-strong)] bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="mb-1 flex flex-col px-3 py-2">
                      <p className="truncate text-[15px] font-bold text-[var(--primary)]">{displayName}</p>
                      <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">{displayRole}</p>
                    </div>
                    
                    <div className="mx-2 mb-2 h-px bg-[var(--border)]" />
                    
                    {accountSettingsPath ? (
                      <Link to={accountSettingsPath} className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-[var(--accent-mist)] text-[14px] font-medium transition text-[var(--foreground)]" onClick={() => setIsProfileOpen(false)}>
                        <Settings className="h-4 w-4 text-[var(--muted-foreground)]" /> My Profile
                      </Link>
                    ) : null}
                    <button onClick={() => { setIsProfileOpen(false); handleLogout(); }} className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-[var(--danger)]/10 text-[var(--danger)] text-[14px] font-medium transition mt-1">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
