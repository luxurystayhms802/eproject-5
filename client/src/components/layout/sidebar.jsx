import { useEffect } from 'react';
import {
  BellRing,
  BedDouble,
  Building2,
  ClipboardList,
  Hotel,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users2,
  Wallet,
  Wrench,
  X,
  Globe,
  MailQuestion,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getDisplayRoleLabel } from '@/features/admin/config';
import { useAdminSettings } from '@/features/admin/hooks';
import { useAuthStore } from '@/app/store/auth-store';

const createSection = (label, items) => ({ label, items });

export const ROUTE_PERMISSIONS = {
  '/admin/staff': 'staff.read',
  '/admin/guests': 'guests.read',
  '/admin/roles': 'roles.read',
  '/admin/room-types': 'roomTypes.read',
  '/admin/rooms': 'rooms.read',
  '/admin/reservations': 'reservations.read',
  '/admin/check-in-monitor': 'checkIn.read',
  '/admin/check-out-monitor': 'checkOut.read',
  '/admin/billing': 'folioCharges.read',
  '/admin/payments': 'payments.read',
  '/admin/housekeeping': 'housekeeping.read',
  '/admin/maintenance': 'maintenance.read',
  '/admin/service-requests': 'serviceRequests.read',
  '/admin/feedback': 'feedback.read',
  '/admin/inquiries': 'inquiries.read',
  '/admin/reports': 'reports.read',
  '/admin/notifications': 'notifications.read',
  '/admin/audit-logs': 'audit.read',
  '/admin/settings': 'settings.read',
  '/admin/pricing-rules': 'settings.read',
  '/admin/policies': 'settings.read',
  '/admin/account-settings': 'settings.read',
  '/admin/faqs': 'faqs.read',
  '/reception/reservations': 'reservations.read',
  '/reception/walk-ins': 'reservations.create',
  '/reception/check-in': 'checkIn.update',
  '/reception/check-out': 'checkOut.update',
  '/reception/billing': 'folioCharges.read',
  '/reception/services': 'serviceRequests.read',
  '/reception/maintenance': 'maintenance.read',
  '/reception/inquiries': 'inquiries.read',
  '/reception/notifications': 'notifications.read',
  '/reception/faqs': 'faqs.read',
  '/reception/arrivals': 'reservations.read',
  '/reception/departures': 'reservations.read',

  '/manager/occupancy': 'rooms.read',
  '/manager/reservations': 'reservations.read',
  '/manager/executive-summary': 'reports.read',
  '/manager/forecasting': 'reports.read',
  '/manager/revenue': 'reports.read',
  '/manager/feedback': 'feedback.read',
  '/manager/inquiries': 'inquiries.read',
  '/manager/housekeeping': 'housekeeping.read',
  '/manager/maintenance': 'maintenance.read',
  '/manager/notifications': 'notifications.read',

  '/housekeeping/tasks': 'housekeeping.read',
  '/housekeeping/requests': 'serviceRequests.read',
  '/housekeeping/board': 'housekeeping.read',
  '/housekeeping/inspections': 'housekeeping.update',
  '/housekeeping/shift-report': 'housekeeping.read',
  '/housekeeping/notifications': 'notifications.read',

  '/maintenance/requests': 'maintenance.read',
  '/maintenance/history': 'maintenance.read',
  '/maintenance/room-impact': 'maintenance.read',
  '/maintenance/shift-report': 'maintenance.read',
  '/maintenance/notifications': 'notifications.read',

  '/guest/stay-center': 'reservations.read',
  '/guest/profile': 'guests.update',
  '/guest/reservations': 'reservations.read',
  '/guest/invoices': 'invoices.read',
  '/guest/service-requests': 'serviceRequests.read',
  '/guest/feedback': 'feedback.read',
  '/guest/notifications': 'notifications.read',
};

export const hasPermission = (href, permissions) => {
  if (href === '/admin/dashboard') return true;
  
  let checkHref = href;
  if (!ROUTE_PERMISSIONS[checkHref]) {
    const normalized = checkHref.replace(/^\/(?:staff|manager|reception|housekeeping|maintenance|guest)\//, '/admin/');
    if (ROUTE_PERMISSIONS[normalized]) {
      checkHref = normalized;
    }
  }

  const requirePerm = ROUTE_PERMISSIONS[checkHref];
  if (!requirePerm) return true;
  return permissions?.includes(requirePerm);
};

export const adminNavSections = [
  createSection('Core', [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Staff', href: '/admin/staff', icon: ShieldCheck },
    { label: 'Guests', href: '/admin/guests', icon: Users2 },
    { label: 'Roles', href: '/admin/roles', icon: ShieldCheck },
  ]),
  createSection('Inventory', [
    { label: 'Room Types', href: '/admin/room-types', icon: BedDouble },
    { label: 'Rooms', href: '/admin/rooms', icon: Hotel },
    { label: 'Reservations', href: '/admin/reservations', icon: ClipboardList },
    { label: 'Check-In Monitor', href: '/admin/check-in-monitor', icon: Hotel },
    { label: 'Check-Out Monitor', href: '/admin/check-out-monitor', icon: ClipboardList },
  ]),
  createSection('Finance', [
    { label: 'Billing', href: '/admin/billing', icon: ReceiptText },
    { label: 'Payments', href: '/admin/payments', icon: Wallet },
  ]),
  createSection('Operations', [
    { label: 'Housekeeping', href: '/admin/housekeeping', icon: Sparkles },
    { label: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
    { label: 'Service Requests', href: '/admin/service-requests', icon: ClipboardList },
    { label: 'Feedback', href: '/admin/feedback', icon: Users2 },
    { label: 'Inquiries', href: '/admin/inquiries', icon: MailQuestion },
  ]),
  createSection('Oversight', [
    { label: 'Reports', href: '/admin/reports', icon: Building2 },
    { label: 'Notifications', href: '/admin/notifications', icon: BellRing },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
    { label: 'Hotel Settings', href: '/admin/settings', icon: Settings },
    { label: 'FAQs', href: '/admin/faqs', icon: MailQuestion },
  ]),
];

const NAV_ITEMS = {
  admin: adminNavSections,
  manager: [
    createSection('Overview', [
      { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
      { label: 'Executive Summary', href: '/manager/executive-summary', icon: ShieldCheck },
      { label: 'Forecasting', href: '/manager/forecasting', icon: Wallet },
    ]),
    createSection('Performance', [
      { label: 'Occupancy', href: '/manager/occupancy', icon: Building2 },
      { label: 'Reservations', href: '/manager/reservations', icon: ClipboardList },
      { label: 'Revenue', href: '/manager/revenue', icon: Sparkles },
      { label: 'Feedback', href: '/manager/feedback', icon: Users2 },
      { label: 'Inquiries', href: '/manager/inquiries', icon: MailQuestion },
    ]),
    createSection('Operations', [
      { label: 'Housekeeping', href: '/manager/housekeeping', icon: Hotel },
      { label: 'Maintenance', href: '/manager/maintenance', icon: Wrench },
      { label: 'Notifications', href: '/manager/notifications', icon: BellRing },
    ]),
  ],
  receptionist: [
    createSection('Overview', [
      { label: 'Dashboard', href: '/reception/dashboard', icon: LayoutDashboard },
      { label: 'Arrivals Board', href: '/reception/arrivals', icon: Users2 },
      { label: 'Departures Board', href: '/reception/departures', icon: ClipboardList },
    ]),
    createSection('Front Desk', [
      { label: 'Reservation Desk', href: '/reception/reservations', icon: ClipboardList },
      { label: 'Walk-In Booking', href: '/reception/walk-ins', icon: Users2 },
      { label: 'Check-in Desk', href: '/reception/check-in', icon: Hotel },
      { label: 'Check-out Desk', href: '/reception/check-out', icon: ReceiptText },
    ]),
    createSection('Guest Care', [
      { label: 'Billing & Invoices', href: '/reception/billing', icon: ReceiptText },
      { label: 'Payments', href: '/reception/payments', icon: Wallet },
      { label: 'Guest Services', href: '/reception/services', icon: Sparkles },
      { label: 'Maintenance', href: '/reception/maintenance', icon: Wrench },
      { label: 'Inquiries', href: '/reception/inquiries', icon: MailQuestion },
      { label: 'Notifications', href: '/reception/notifications', icon: BellRing },
    ]),
  ],
  housekeeping: [
    createSection('Overview', [
      { label: 'Dashboard', href: '/housekeeping/dashboard', icon: LayoutDashboard },
      { label: 'Room Board', href: '/housekeeping/board', icon: Hotel },
      { label: 'Inspections', href: '/housekeeping/inspections', icon: ShieldCheck },
    ]),
    createSection('Execution', [
      { label: 'Assigned Tasks', href: '/housekeeping/tasks', icon: ClipboardList },
      { label: 'Guest Requests', href: '/housekeeping/requests', icon: Sparkles },
      { label: 'Shift Report', href: '/housekeeping/shift-report', icon: ReceiptText },
    ]),
    createSection('Alerts', [
      { label: 'Notifications', href: '/housekeeping/notifications', icon: BellRing },
    ]),
  ],
  maintenance: [
    createSection('Overview', [
      { label: 'Dashboard', href: '/maintenance/dashboard', icon: LayoutDashboard },
      { label: 'Room Impact', href: '/maintenance/room-impact', icon: Hotel },
      { label: 'Shift Report', href: '/maintenance/shift-report', icon: ReceiptText },
    ]),
    createSection('Execution', [
      { label: 'Open Requests', href: '/maintenance/requests', icon: Wrench },
      { label: 'Resolution History', href: '/maintenance/history', icon: ClipboardList },
    ]),
    createSection('Alerts', [
      { label: 'Notifications', href: '/maintenance/notifications', icon: BellRing },
    ]),
  ],
  guest: [
    createSection('Overview', [
      { label: 'Dashboard', href: '/guest/dashboard', icon: LayoutDashboard },
      { label: 'Stay Center', href: '/guest/stay-center', icon: Hotel },
    ]),
    createSection('Account', [
      { label: 'Profile', href: '/guest/profile', icon: ShieldCheck },
      { label: 'Reservations', href: '/guest/reservations', icon: ClipboardList },
      { label: 'Invoices', href: '/guest/invoices', icon: Sparkles },
    ]),
    createSection('Guest Care', [
      { label: 'Services', href: '/guest/service-requests', icon: Building2 },
      { label: 'Feedback', href: '/guest/feedback', icon: Users2 },
      { label: 'Notifications', href: '/guest/notifications', icon: BellRing },
    ]),
  ],
};

export const customRoleNavSections = [
  createSection('Core', [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Staff', href: '/admin/staff', icon: ShieldCheck },
    { label: 'Guests', href: '/admin/guests', icon: Users2 },
    { label: 'Roles', href: '/admin/roles', icon: ShieldCheck },
  ]),
  createSection('Front Desk Operations', [
    { label: 'Arrivals Board', href: '/reception/arrivals', icon: Users2 },
    { label: 'Departures Board', href: '/reception/departures', icon: ClipboardList },
    { label: 'Reservation Desk', href: '/reception/reservations', icon: ClipboardList },
    { label: 'Walk-In Booking', href: '/reception/walk-ins', icon: Users2 },
    { label: 'Check-in Desk', href: '/reception/check-in', icon: Hotel },
    { label: 'Check-out Desk', href: '/reception/check-out', icon: ReceiptText },
  ]),
  createSection('Inventory', [
    { label: 'Room Types', href: '/admin/room-types', icon: BedDouble },
    { label: 'Rooms', href: '/admin/rooms', icon: Hotel },
    { label: 'Reservations', href: '/admin/reservations', icon: ClipboardList },
    { label: 'Check-In Monitor', href: '/admin/check-in-monitor', icon: Hotel },
    { label: 'Check-Out Monitor', href: '/admin/check-out-monitor', icon: ClipboardList },
  ]),
  createSection('Finance', [
    { label: 'Billing', href: '/admin/billing', icon: ReceiptText },
    { label: 'Payments', href: '/admin/payments', icon: Wallet },
  ]),
  createSection('Field Operations', [
    { label: 'Assigned Tasks', href: '/housekeeping/tasks', icon: ClipboardList },
    { label: 'Guest Requests', href: '/housekeeping/requests', icon: Sparkles },
    { label: 'Room Board', href: '/housekeeping/board', icon: Hotel },
    { label: 'Inspections', href: '/housekeeping/inspections', icon: ShieldCheck },
    { label: 'Open Requests (Maintenance)', href: '/maintenance/requests', icon: Wrench },
    { label: 'Resolution History', href: '/maintenance/history', icon: ClipboardList },
  ]),
  createSection('Department Oversight', [
    { label: 'Housekeeping', href: '/admin/housekeeping', icon: Sparkles },
    { label: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
    { label: 'Service Requests', href: '/admin/service-requests', icon: ClipboardList },
    { label: 'Feedback', href: '/admin/feedback', icon: Users2 },
    { label: 'Inquiries', href: '/admin/inquiries', icon: MailQuestion },
  ]),
  createSection('Platform Management', [
    { label: 'Reports', href: '/admin/reports', icon: Building2 },
    { label: 'Notifications', href: '/admin/notifications', icon: BellRing },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
    { label: 'Hotel Settings', href: '/admin/settings', icon: Settings },
    { label: 'FAQs', href: '/admin/faqs', icon: MailQuestion },
  ]),
];

const SidebarContent = ({ role, onClose, isMobile = false }) => {
  const { data: settings } = useAdminSettings();
  const user = useAuthStore((state) => state.user);
  
  const isCustomRole = !NAV_ITEMS[role];
  const baseSections = NAV_ITEMS[role] || [];
  const isAdmin = user?.role === 'admin';
  const displayRole = getDisplayRoleLabel(role).replace('_', ' ');

  let sections = [];

  if (isAdmin) {
    sections = adminNavSections.map((section) => ({
      ...section,
      items: [...section.items],
    }));
  } else if (isCustomRole) {
    // Custom roles get the full unified operational tree filtered by their exact permissions.
    // Replace the default admin dashboard link with their personal hub.
    sections = customRoleNavSections
      .map((section) => {
        let items = section.items
          .filter((item) => {
            if (item.href === '/admin/dashboard') return false; // Hide Admin Dashboard
            return hasPermission(item.href, user?.permissions);
          })
          .map((item) => ({ ...item, href: item.href.replace(/^\/(?:admin|reception|housekeeping|maintenance)\//, '/staff/') }));

        // If it's the Core section, artificially inject the Custom Role Hub at the top!
        if (section.label === 'Core') {
          items = [
            { label: 'My Hub', href: '/staff/dashboard', icon: LayoutDashboard },
            ...items
          ];
        }

        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  } else {
    // System roles get their strict predefined sections filtered by permissions
    sections = baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasPermission(item.href, user?.permissions)),
      }))
      .filter((section) => section.items.length > 0);

    // Now, cross-reference adminNavSections to see if they possess EXTRA permissions 
    // that are NOT in their base predefined sections!
    // We check by the underlying permission resource module (e.g., 'checkIn') to strictly prevent duplicating tools
    const existingResources = new Set(
      sections.flatMap(s => s.items.map(i => ROUTE_PERMISSIONS[i.href]?.split('.')[0])).filter(Boolean)
    );
    const extraItems = [];
    
    // Do not dynamically append Extended Access to guests! Their portal is strictly static.
    if (role !== 'guest') {
      const getRoleBasePath = (currentRole) => currentRole === 'receptionist' ? '/reception' : `/${currentRole}`;

      adminNavSections.forEach(adminSection => {
         adminSection.items.forEach(adminItem => {
            if (adminItem.href === '/admin/dashboard') return;
            
            const adminResource = ROUTE_PERMISSIONS[adminItem.href]?.split('.')[0];
            const isResourceAlreadyVisible = adminResource && existingResources.has(adminResource);

            if (!isResourceAlreadyVisible && hasPermission(adminItem.href, user?.permissions)) {
               extraItems.push({ ...adminItem, href: adminItem.href.replace(/^\/admin/, getRoleBasePath(role)) });
            }
         });
      });

      if (extraItems.length > 0) {
        sections.push({
          label: 'Extended Access',
          items: extraItems
        });
      }
    }
  }

  useEffect(() => {
    if (settings?.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [settings?.faviconUrl]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[20px] border border-[#173351] bg-[#10263f] text-white shadow-[0_14px_32px_rgba(7,20,38,0.16)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-white/10 bg-[#173351] text-sm font-semibold tracking-[0.24em] text-[#f2d5a6]">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover text-transparent" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">{settings?.brandName || settings?.hotelName || 'LuxuryStay'}</p>
            <h2 className="truncate text-[18px] capitalize text-white [font-family:var(--font-display)]">{displayRole}</h2>
          </div>
        </div>
        {isMobile ? (
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/10 bg-white/6 text-white transition hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 px-3 py-4">
        <nav className="sidebar-scrollbar smooth-scroll flex h-full flex-col gap-4 overflow-y-auto pr-1">
          {sections.map((section) => (
            <div key={section.label} className="space-y-2">
              <div className="px-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/32">{section.label}</p>
              </div>

              <div className="space-y-1 rounded-[16px] border border-white/6 bg-white/[0.02] p-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          'group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] transition-all',
                          isActive
                            ? 'bg-white/10 text-white before:absolute before:left-0 before:top-[8px] before:h-8 before:w-[3px] before:rounded-full before:bg-[var(--accent)]'
                            : 'text-white/72 hover:bg-white/6 hover:text-white',
                        ].join(' ')
                      }
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/6 bg-[#173351] text-[#f4d5a1] transition group-hover:bg-[#1a3a5c]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/8 p-3">
        <a
          href="/"
          className="group flex w-full items-center gap-3 rounded-[12px] p-2.5 text-[14px] font-medium text-white/72 transition-all hover:bg-white/6 hover:text-white"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/6 bg-[#173351] text-[#f4d5a1] transition group-hover:bg-[#1a3a5c]">
            <Globe className="h-4 w-4" />
          </span>
          <span className="flex-1 truncate">Back to Website</span>
        </a>
      </div>
    </div>
  );
};

export const Sidebar = ({ role, mobileOpen = false, onClose = () => {} }) => (
  <>
    <aside className="hidden h-full w-full shrink-0 lg:flex">
      <SidebarContent role={role} onClose={onClose} />
    </aside>

    {mobileOpen ? (
      <div className="fixed inset-0 z-50 flex lg:hidden">
        <button type="button" className="flex-1 bg-[rgba(9,21,37,0.48)] backdrop-blur-sm" onClick={onClose} aria-label="Close navigation" />
        <div className="relative h-full w-[84vw] max-w-[316px] p-3">
          <SidebarContent role={role} onClose={onClose} isMobile />
        </div>
      </div>
    ) : null}
  </>
);
