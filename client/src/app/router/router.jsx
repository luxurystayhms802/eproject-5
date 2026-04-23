import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { PublicLayout } from '@/components/layout/public-layout';
import { RouteLoader } from '@/components/shared/route-loader';
import { ProtectedRoute } from '@/features/auth/components/protected-route';

const lazyPage = (loader, exportName) => lazy(() => loader().then((module) => ({ default: module[exportName] })));

const LoginPage = lazyPage(() => import('@/features/auth/pages/login-page'), 'LoginPage');
const RegisterPage = lazyPage(() => import('@/features/auth/pages/register-page'), 'RegisterPage');
const ForgotPasswordPage = lazyPage(() => import('@/features/auth/pages/forgot-password-page'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyPage(() => import('@/features/auth/pages/reset-password-page'), 'ResetPasswordPage');
const StaffProfilePage = lazyPage(() => import('@/features/auth/pages/staff-profile-page'), 'StaffProfilePage');

const HomePage = lazyPage(() => import('@/features/public/pages/home-page'), 'HomePage');
const AboutPage = lazyPage(() => import('@/features/public/pages/about-page'), 'AboutPage');
const RoomsListingPage = lazyPage(() => import('@/features/public/pages/rooms-listing-page'), 'RoomsListingPage');
const RoomDetailsPage = lazyPage(() => import('@/features/public/pages/room-details-page'), 'RoomDetailsPage');
const AmenitiesPage = lazyPage(() => import('@/features/public/pages/amenities-page'), 'AmenitiesPage');
const GalleryPage = lazyPage(() => import('@/features/public/pages/gallery-page'), 'GalleryPage');
const BookingPage = lazyPage(() => import('@/features/public/pages/booking-page'), 'BookingPage');
const ContactPage = lazyPage(() => import('@/features/public/pages/contact-page'), 'ContactPage');
const FaqPage = lazyPage(() => import('@/features/public/pages/faq-page'), 'FaqPage');

const GuestDashboardPage = lazyPage(() => import('@/features/guest/pages/guest-dashboard-page'), 'GuestDashboardPage');
const GuestStayCenterPage = lazyPage(() => import('@/features/guest/pages/guest-stay-center-page'), 'GuestStayCenterPage');
const GuestProfilePage = lazyPage(() => import('@/features/guest/pages/guest-profile-page'), 'GuestProfilePage');
const GuestReservationsPage = lazyPage(() => import('@/features/guest/pages/guest-reservations-page'), 'GuestReservationsPage');
const GuestInvoicesPage = lazyPage(() => import('@/features/guest/pages/guest-invoices-page'), 'GuestInvoicesPage');
const GuestServiceRequestsPage = lazyPage(() => import('@/features/guest/pages/guest-service-requests-page'), 'GuestServiceRequestsPage');
const GuestFeedbackPage = lazyPage(() => import('@/features/guest/pages/guest-feedback-page'), 'GuestFeedbackPage');
const GuestNotificationsPage = lazyPage(() => import('@/features/guest/pages/guest-notifications-page'), 'GuestNotificationsPage');

const AdminDashboardPage = lazyPage(() => import('@/features/admin/pages/admin-dashboard-page'), 'AdminDashboardPage');
const AdminStaffPage = lazyPage(() => import('@/features/admin/pages/admin-staff-page'), 'AdminStaffPage');
const AdminGuestsPage = lazyPage(() => import('@/features/admin/pages/admin-guests-page'), 'AdminGuestsPage');
const AdminRolesPage = lazyPage(() => import('@/features/admin/pages/admin-roles-page'), 'AdminRolesPage');
const AdminRoomTypesPage = lazyPage(() => import('@/features/admin/pages/admin-room-types-page'), 'AdminRoomTypesPage');
const AdminRoomsPage = lazyPage(() => import('@/features/admin/pages/admin-rooms-page'), 'AdminRoomsPage');
const AdminReservationsPage = lazyPage(() => import('@/features/admin/pages/admin-reservations-page'), 'AdminReservationsPage');
const AdminCheckInMonitorPage = lazyPage(() => import('@/features/admin/pages/admin-check-in-monitor-page'), 'AdminCheckInMonitorPage');
const AdminCheckOutMonitorPage = lazyPage(() => import('@/features/admin/pages/admin-check-out-monitor-page'), 'AdminCheckOutMonitorPage');
const AdminBillingPage = lazyPage(() => import('@/features/admin/pages/admin-billing-page'), 'AdminBillingPage');
const AdminPaymentsPage = lazyPage(() => import('@/features/admin/pages/admin-payments-page'), 'AdminPaymentsPage');
const AdminHousekeepingOverviewPage = lazyPage(() => import('@/features/admin/pages/admin-housekeeping-overview-page'), 'AdminHousekeepingOverviewPage');
const AdminMaintenanceOverviewPage = lazyPage(() => import('@/features/admin/pages/admin-maintenance-overview-page'), 'AdminMaintenanceOverviewPage');
const AdminServiceRequestsPage = lazyPage(() => import('@/features/admin/pages/admin-service-requests-page'), 'AdminServiceRequestsPage');
const AdminFeedbackPage = lazyPage(() => import('@/features/admin/pages/admin-feedback-page'), 'AdminFeedbackPage');
const AdminInquiriesPage = lazyPage(() => import('@/features/admin/pages/admin-inquiries-page'), 'AdminInquiriesPage');
const AdminReportsPage = lazyPage(() => import('@/features/admin/pages/admin-reports-page'), 'AdminReportsPage');
const AdminSettingsPage = lazyPage(() => import('@/features/admin/pages/admin-settings-page'), 'AdminSettingsPage');
const AdminPricingRulesPage = lazyPage(() => import('@/features/admin/pages/admin-pricing-rules-page'), 'AdminPricingRulesPage');
const AdminPoliciesPage = lazyPage(() => import('@/features/admin/pages/admin-policies-page'), 'AdminPoliciesPage');
const AdminAccountSettingsPage = lazyPage(() => import('@/features/admin/pages/admin-account-settings-page'), 'AdminAccountSettingsPage');
const AdminAuditLogsPage = lazyPage(() => import('@/features/admin/pages/admin-audit-logs-page'), 'AdminAuditLogsPage');
const AdminFaqsPage = lazyPage(() => import('@/features/admin/pages/admin-faqs-page'), 'AdminFaqsPage');
const CustomRoleDashboardPage = lazyPage(() => import('@/features/staff/pages/custom-role-dashboard-page'), 'CustomRoleDashboardPage');

const ManagerDashboardPage = lazyPage(() => import('@/features/manager/pages/manager-dashboard-page'), 'ManagerDashboardPage');
const ManagerExecutiveSummaryPage = lazyPage(() => import('@/features/manager/pages/manager-executive-summary-page'), 'ManagerExecutiveSummaryPage');
const OccupancyOverviewPage = lazyPage(() => import('@/features/manager/pages/occupancy-overview-page'), 'OccupancyOverviewPage');
const ManagerReservationsOverviewPage = lazyPage(() => import('@/features/manager/pages/manager-reservations-overview-page'), 'ManagerReservationsOverviewPage');
const RevenueReportsPage = lazyPage(() => import('@/features/manager/pages/revenue-reports-page'), 'RevenueReportsPage');
const ManagerForecastingPage = lazyPage(() => import('@/features/manager/pages/manager-forecasting-page'), 'ManagerForecastingPage');
const ManagerFeedbackInsightsPage = lazyPage(() => import('@/features/manager/pages/manager-feedback-insights-page'), 'ManagerFeedbackInsightsPage');
const ManagerHousekeepingStatusPage = lazyPage(() => import('@/features/manager/pages/manager-housekeeping-status-page'), 'ManagerHousekeepingStatusPage');
const ManagerMaintenanceOverviewPage = lazyPage(() => import('@/features/manager/pages/manager-maintenance-overview-page'), 'ManagerMaintenanceOverviewPage');

const ReceptionDashboardPage = lazyPage(() => import('@/features/reception/pages/reception-dashboard-page'), 'ReceptionDashboardPage');
const ArrivalsBoardPage = lazyPage(() => import('@/features/reception/pages/arrivals-board-page'), 'ArrivalsBoardPage');
const DeparturesBoardPage = lazyPage(() => import('@/features/reception/pages/departures-board-page'), 'DeparturesBoardPage');
const ReservationDeskPage = lazyPage(() => import('@/features/reception/pages/reservation-desk-page'), 'ReservationDeskPage');
const WalkInBookingPage = lazyPage(() => import('@/features/reception/pages/walk-in-booking-page'), 'WalkInBookingPage');
const CheckInDeskPage = lazyPage(() => import('@/features/reception/pages/check-in-desk-page'), 'CheckInDeskPage');
const CheckOutDeskPage = lazyPage(() => import('@/features/reception/pages/check-out-desk-page'), 'CheckOutDeskPage');

const GuestServicesPage = lazyPage(() => import('@/features/reception/pages/guest-services-page'), 'GuestServicesPage');
const ReceptionMaintenancePage = lazyPage(() => import('@/features/reception/pages/reception-maintenance-page'), 'ReceptionMaintenancePage');

const HousekeepingDashboardPage = lazyPage(() => import('@/features/housekeeping/pages/housekeeping-dashboard-page'), 'HousekeepingDashboardPage');
const AssignedTasksPage = lazyPage(() => import('@/features/housekeeping/pages/assigned-tasks-page'), 'AssignedTasksPage');
const RoomCleaningBoardPage = lazyPage(() => import('@/features/housekeeping/pages/room-cleaning-board-page'), 'RoomCleaningBoardPage');
const HousekeepingInspectionsPage = lazyPage(() => import('@/features/housekeeping/pages/housekeeping-inspections-page'), 'HousekeepingInspectionsPage');
const HousekeepingShiftReportPage = lazyPage(() => import('@/features/housekeeping/pages/housekeeping-shift-report-page'), 'HousekeepingShiftReportPage');

const HousekeepingServiceRequestsPage = lazyPage(() => import('@/features/housekeeping/pages/housekeeping-service-requests-page'), 'HousekeepingServiceRequestsPage');

const MaintenanceDashboardPage = lazyPage(() => import('@/features/maintenance/pages/maintenance-dashboard-page'), 'MaintenanceDashboardPage');
const MaintenanceRequestsPage = lazyPage(() => import('@/features/maintenance/pages/maintenance-requests-page'), 'MaintenanceRequestsPage');
const MaintenanceHistoryPage = lazyPage(() => import('@/features/maintenance/pages/maintenance-history-page'), 'MaintenanceHistoryPage');
const MaintenanceRoomImpactPage = lazyPage(() => import('@/features/maintenance/pages/maintenance-room-impact-page'), 'MaintenanceRoomImpactPage');
const MaintenanceShiftReportPage = lazyPage(() => import('@/features/maintenance/pages/maintenance-shift-report-page'), 'MaintenanceShiftReportPage');

const NotificationsPage = lazyPage(() => import('@/features/notifications/pages/notifications-page'), 'NotificationsPage');

const renderLazy = (Component, label) => (
  <Suspense fallback={<RouteLoader label={label} />}>
    <Component />
  </Suspense>
);

const adminWorkspaceNodes = [
  { path: 'staff', element: renderLazy(AdminStaffPage, 'Loading staff control') },
  { path: 'guests', element: renderLazy(AdminGuestsPage, 'Loading guest records') },
  { path: 'roles', element: renderLazy(AdminRolesPage, 'Loading roles') },
  { path: 'room-types', element: renderLazy(AdminRoomTypesPage, 'Loading room types') },
  { path: 'rooms', element: renderLazy(AdminRoomsPage, 'Loading inventory') },
  { path: 'reservations', element: renderLazy(AdminReservationsPage, 'Loading reservations') },
  { path: 'check-in-monitor', element: renderLazy(AdminCheckInMonitorPage, 'Loading check-in monitor') },
  { path: 'check-out-monitor', element: renderLazy(AdminCheckOutMonitorPage, 'Loading check-out monitor') },
  { path: 'billing', element: renderLazy(AdminBillingPage, 'Loading billing') },
  { path: 'payments', element: renderLazy(AdminPaymentsPage, 'Loading payments') },
  { path: 'housekeeping', element: renderLazy(AdminHousekeepingOverviewPage, 'Loading housekeeping') },
  { path: 'maintenance', element: renderLazy(AdminMaintenanceOverviewPage, 'Loading maintenance') },
  { path: 'service-requests', element: renderLazy(AdminServiceRequestsPage, 'Loading service requests') },
  { path: 'feedback', element: renderLazy(AdminFeedbackPage, 'Loading feedback') },
  { path: 'inquiries', element: renderLazy(AdminInquiriesPage, 'Loading inquiries') },
  { path: 'reports', element: renderLazy(AdminReportsPage, 'Loading reports') },
  { path: 'notifications', element: renderLazy(NotificationsPage, 'Loading notifications') },
  { path: 'audit-logs', element: renderLazy(AdminAuditLogsPage, 'Loading audit logs') },
  { path: 'settings', element: renderLazy(AdminSettingsPage, 'Loading settings') },
  { path: 'pricing-rules', element: renderLazy(AdminPricingRulesPage, 'Loading pricing rules') },
  { path: 'policies', element: renderLazy(AdminPoliciesPage, 'Loading policies') },
  { path: 'faqs', element: renderLazy(AdminFaqsPage, 'Loading FAQs') },
  { path: 'account-settings', element: renderLazy(AdminAccountSettingsPage, 'Loading account settings') },
];

const customOperationalNodes = [
  { path: 'arrivals', element: renderLazy(ArrivalsBoardPage, 'Loading arrivals board') },
  { path: 'departures', element: renderLazy(DeparturesBoardPage, 'Loading departures board') },
  { path: 'reception-desk', element: renderLazy(ReservationDeskPage, 'Loading reservation desk') },
  { path: 'walk-ins', element: renderLazy(WalkInBookingPage, 'Loading walk-in booking') },
  { path: 'check-in', element: renderLazy(CheckInDeskPage, 'Loading check-in desk') },
  { path: 'check-out', element: renderLazy(CheckOutDeskPage, 'Loading check-out desk') },
  { path: 'services', element: renderLazy(GuestServicesPage, 'Loading guest services') },
  { path: 'hk-tasks', element: renderLazy(AssignedTasksPage, 'Loading assigned tasks') },
  { path: 'hk-board', element: renderLazy(RoomCleaningBoardPage, 'Loading cleaning board') },
  { path: 'hk-inspections', element: renderLazy(HousekeepingInspectionsPage, 'Loading inspections') },
  { path: 'hk-shift', element: renderLazy(HousekeepingShiftReportPage, 'Loading shift report') },
  { path: 'mt-requests', element: renderLazy(MaintenanceRequestsPage, 'Loading maintenance requests') },
  { path: 'mt-history', element: renderLazy(MaintenanceHistoryPage, 'Loading maintenance history') },
  { path: 'mt-impact', element: renderLazy(MaintenanceRoomImpactPage, 'Loading room impact') },
  { path: 'mt-shift', element: renderLazy(MaintenanceShiftReportPage, 'Loading shift report') },
];


const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: renderLazy(HomePage, 'Loading public site') },
      { path: '/about', element: renderLazy(AboutPage, 'Loading public site') },
      { path: '/rooms', element: renderLazy(RoomsListingPage, 'Loading rooms') },
      { path: '/rooms/:roomTypeId', element: renderLazy(RoomDetailsPage, 'Loading room details') },
      { path: '/amenities', element: renderLazy(AmenitiesPage, 'Loading amenities') },
      { path: '/gallery', element: renderLazy(GalleryPage, 'Loading gallery') },
      { path: '/booking', element: renderLazy(BookingPage, 'Loading booking') },
      { path: '/contact', element: renderLazy(ContactPage, 'Loading contact') },
      { path: '/faq', element: renderLazy(FaqPage, 'Loading support content') },
      { path: '/login', element: renderLazy(LoginPage, 'Loading sign in') },
      { path: '/register', element: renderLazy(RegisterPage, 'Loading registration') },
      { path: '/forgot-password', element: renderLazy(ForgotPasswordPage, 'Loading recovery') },
      { path: '/reset-password', element: renderLazy(ResetPasswordPage, 'Loading reset') },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['guest']} />,
    children: [
      {
        path: '/guest',
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: renderLazy(GuestDashboardPage, 'Loading guest dashboard') },
          { path: 'stay-center', element: renderLazy(GuestStayCenterPage, 'Loading stay center') },
          { path: 'profile', element: renderLazy(GuestProfilePage, 'Loading guest profile') },
          { path: 'reservations', element: renderLazy(GuestReservationsPage, 'Loading reservations') },
          { path: 'invoices', element: renderLazy(GuestInvoicesPage, 'Loading invoices') },
          { path: 'service-requests', element: renderLazy(GuestServiceRequestsPage, 'Loading service requests') },
          { path: 'feedback', element: renderLazy(GuestFeedbackPage, 'Loading feedback') },
          { path: 'notifications', element: renderLazy(GuestNotificationsPage, 'Loading notifications') },
          { index: true, element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} allowDynamicRoles={true} />,
    children: [
      {
        path: '/admin',
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: renderLazy(AdminDashboardPage, 'Loading admin dashboard') },
          ...adminWorkspaceNodes,
          { index: true, element: <Navigate to="dashboard" replace /> },
        ],
      },
      {
        path: '/staff',
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: renderLazy(CustomRoleDashboardPage, 'Loading your workspace') },
          { path: 'profile', element: renderLazy(StaffProfilePage, 'Loading profile') },
          ...adminWorkspaceNodes,
          ...customOperationalNodes,
          { index: true, element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['manager']} />,
    children: [
      {
        path: '/manager',
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: renderLazy(ManagerDashboardPage, 'Loading manager dashboard') },
          { path: 'executive-summary', element: renderLazy(ManagerExecutiveSummaryPage, 'Loading executive summary') },
          { path: 'occupancy', element: renderLazy(OccupancyOverviewPage, 'Loading occupancy overview') },
          { path: 'reservations', element: renderLazy(ManagerReservationsOverviewPage, 'Loading reservation overview') },
          { path: 'revenue', element: renderLazy(RevenueReportsPage, 'Loading revenue reports') },
          { path: 'forecasting', element: renderLazy(ManagerForecastingPage, 'Loading forecasting') },
          { path: 'feedback', element: renderLazy(ManagerFeedbackInsightsPage, 'Loading feedback insights') },
          { path: 'inquiries', element: renderLazy(AdminInquiriesPage, 'Loading inquiries') },
          { path: 'housekeeping', element: renderLazy(ManagerHousekeepingStatusPage, 'Loading housekeeping status') },
          { path: 'maintenance', element: renderLazy(ManagerMaintenanceOverviewPage, 'Loading maintenance overview') },
          { path: 'notifications', element: renderLazy(NotificationsPage, 'Loading notifications') },
          { path: 'profile', element: renderLazy(StaffProfilePage, 'Loading profile') },
          ...adminWorkspaceNodes,
          { index: true, element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['receptionist']} />,
    children: [
      {
        path: '/reception',
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: renderLazy(ReceptionDashboardPage, 'Loading reception dashboard') },
          { path: 'arrivals', element: renderLazy(ArrivalsBoardPage, 'Loading arrivals board') },
          { path: 'departures', element: renderLazy(DeparturesBoardPage, 'Loading departures board') },
          { path: 'reservations', element: renderLazy(ReservationDeskPage, 'Loading reservation desk') },
          { path: 'walk-ins', element: renderLazy(WalkInBookingPage, 'Loading walk-in booking') },
          { path: 'check-in', element: renderLazy(CheckInDeskPage, 'Loading check-in desk') },
          { path: 'check-out', element: renderLazy(CheckOutDeskPage, 'Loading check-out desk') },

          { path: 'services', element: renderLazy(GuestServicesPage, 'Loading guest services') },
          { path: 'maintenance', element: renderLazy(ReceptionMaintenancePage, 'Loading maintenance') },
          { path: 'inquiries', element: renderLazy(AdminInquiriesPage, 'Loading inquiries') },
          { path: 'notifications', element: renderLazy(NotificationsPage, 'Loading notifications') },
          { path: 'profile', element: renderLazy(StaffProfilePage, 'Loading profile') },
          ...adminWorkspaceNodes,
          { index: true, element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['housekeeping']} />,
    children: [
      {
        path: '/housekeeping',
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: renderLazy(HousekeepingDashboardPage, 'Loading housekeeping dashboard') },
          { path: 'tasks', element: renderLazy(AssignedTasksPage, 'Loading assigned tasks') },
          { path: 'requests', element: renderLazy(HousekeepingServiceRequestsPage, 'Loading guest requests') },
          { path: 'board', element: renderLazy(RoomCleaningBoardPage, 'Loading cleaning board') },
          { path: 'inspections', element: renderLazy(HousekeepingInspectionsPage, 'Loading inspections') },
          { path: 'shift-report', element: renderLazy(HousekeepingShiftReportPage, 'Loading shift report') },
          { path: 'notifications', element: renderLazy(NotificationsPage, 'Loading notifications') },
          { path: 'profile', element: renderLazy(StaffProfilePage, 'Loading profile') },
          ...adminWorkspaceNodes,
          { index: true, element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['maintenance']} />,
    children: [
      {
        path: '/maintenance',
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: renderLazy(MaintenanceDashboardPage, 'Loading maintenance dashboard') },
          { path: 'requests', element: renderLazy(MaintenanceRequestsPage, 'Loading maintenance requests') },
          { path: 'history', element: renderLazy(MaintenanceHistoryPage, 'Loading maintenance history') },
          { path: 'room-impact', element: renderLazy(MaintenanceRoomImpactPage, 'Loading room impact') },
          { path: 'shift-report', element: renderLazy(MaintenanceShiftReportPage, 'Loading shift report') },
          { path: 'notifications', element: renderLazy(NotificationsPage, 'Loading notifications') },
          { path: 'profile', element: renderLazy(StaffProfilePage, 'Loading profile') },
          ...adminWorkspaceNodes,
          { index: true, element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
