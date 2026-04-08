import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useAuthStore } from '@/app/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { ScrollToTop } from '@/components/shared/scroll-to-top';
import { useHotelSettings } from '@/features/public/hooks';
import { getPublicBranding } from '@/features/public/utils';

export const AppShell = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const scrollRef = useRef(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const settingsQuery = useHotelSettings();
  const branding = getPublicBranding(settingsQuery.data);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  if (!user) {
    return null;
  }

  return (
    <div 
      className="relative h-screen overflow-hidden"
      style={{
        '--primary': branding.themeSettings.primaryColor || '#10243f',
        '--accent': branding.themeSettings.accentColor || '#b88c4a',
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(16,36,63,0.1),transparent_68%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(184,140,74,0.12),transparent_72%)]" />

      <div className="relative mx-auto h-full max-w-[1528px] px-3 py-4 lg:px-4 xl:px-5">
        <PanelGroup orientation="horizontal" autoSaveId="luxurystay-layout-v6" className="h-full">
          <Panel defaultSize="21%" minSize="15%" maxSize="23%" className="hidden lg:block">
            <Sidebar role={user.role} />
          </Panel>

          <PanelResizeHandle className="group relative mx-1 hidden w-1 cursor-col-resize items-center justify-center lg:flex xl:mx-2">
            <div className="absolute inset-y-0 -left-2 -right-2 z-10" />
            <div className="h-8 w-1 rounded-full bg-[var(--accent)]/50 transition-colors group-hover:bg-[var(--accent)] group-active:bg-[var(--accent)]" />
          </PanelResizeHandle>

          <Panel className="min-w-0 overflow-hidden">
            <div className="flex h-full flex-col gap-4">
              <div className="shrink-0">
                <Topbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
              </div>
              <div id="app-shell-scroller" ref={scrollRef} className="scrollbar-invisible min-h-0 flex-1 overflow-y-auto relative">
                <div className="space-y-4 pb-8">
                  <Outlet />
                </div>
                <ScrollToTop targetId="app-shell-scroller" />
              </div>
            </div>
          </Panel>
        </PanelGroup>

        {mobileSidebarOpen ? (
          <Sidebar role={user.role} mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        ) : null}
      </div>
    </div>
  );
};
