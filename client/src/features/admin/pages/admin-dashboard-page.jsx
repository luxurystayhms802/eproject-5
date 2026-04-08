import { useMemo } from 'react';
import { AlertTriangle, BedDouble, ClipboardList, CreditCard, Settings2, ShieldCheck, Users2, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuditLogs } from '@/features/audit/hooks';
import { formatAdminCurrency, formatAdminDateTime } from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import {
  useAdminDashboard,
  useAdminHousekeepingTasks,
  useAdminMaintenanceRequests,
  useAdminReservations,
  useAdminServiceRequests,
  useAdminStaff,
  useAdminRoles,
} from '@/features/admin/hooks';
import { useNotifications } from '@/features/notifications/hooks';
import { useAuthStore } from '@/app/store/auth-store';
import { titleCase } from '@/features/admin/config';

const pieColors = ['#10243f', '#b88c4a', '#d4a862', '#4f7bb6', '#6b7280'];



export const AdminDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.role === 'super_admin';
  const prefix = isSuperAdmin ? '/admin' : `/${user?.role}`;

  const dashboardQuery = useAdminDashboard();
  const reservationsQuery = useAdminReservations({}, { enabled: isSuperAdmin || permissions.includes('reservations.read') });
  const staffQuery = useAdminStaff({ status: 'active' }, { enabled: isSuperAdmin || permissions.includes('staff.read') });
  const maintenanceQuery = useAdminMaintenanceRequests({ status: 'open,assigned,in_progress' }, { enabled: isSuperAdmin || permissions.includes('maintenance.read') });
  const housekeepingQuery = useAdminHousekeepingTasks({ status: 'pending' }, { enabled: isSuperAdmin || permissions.includes('housekeeping.read') });
  const serviceRequestsQuery = useAdminServiceRequests({ status: 'pending' }, { enabled: isSuperAdmin || permissions.includes('serviceRequests.read') });
  const notificationsQuery = useNotifications({ readStatus: 'unread' }, { enabled: isSuperAdmin || permissions.includes('notifications.read') });
  const auditQuery = useAuditLogs({ enabled: isSuperAdmin || permissions.includes('audit.read') });
  const rolesQuery = useAdminRoles();
  
  const data = dashboardQuery.data;
  const cards = data?.cards;

  const recentReservations = (reservationsQuery.data ?? []).slice(0, 4);
  const recentNotifications = (notificationsQuery.data ?? []).slice(0, 4);
  const recentActivity = (auditQuery.data ?? []).slice(0, 5);

  const activeStaff = staffQuery.data ?? [];
  const openMaintenance = maintenanceQuery.data ?? [];
  const pendingHousekeeping = housekeepingQuery.data ?? [];
  const pendingServiceRequests = serviceRequestsQuery.data ?? [];

  const staffCoverage = useMemo(() => {
    const defaultRoles = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'];
    const rolesList = rolesQuery.data?.map(r => r.name) || defaultRoles;
    
    return rolesList.map((roleKey) => {
      const count = activeStaff.filter((member) => member.role === roleKey).length;
      return {
        key: roleKey,
        label: titleCase(roleKey),
        count,
        coverage: count === 0 ? 'No active coverage' : count === 1 ? 'Single assignee live' : `${count} accounts active`,
      };
    });
  }, [activeStaff, rolesQuery.data]);

  const dispatchRows = [
    {
      title: 'Maintenance queue',
      count: openMaintenance.length,
      description: 'Open, assigned, or in-progress issues visible across all maintenance accounts.',
      href: `${prefix}/maintenance`,
      icon: Wrench,
      permission: 'maintenance.read',
    },
    {
      title: 'Housekeeping queue',
      count: pendingHousekeeping.length,
      description: 'Pending cleaning work that may be picked up by multiple housekeeping staff.',
      href: `${prefix}/housekeeping`,
      icon: ClipboardList,
      permission: 'housekeeping.read',
    },
    {
      title: 'Service request queue',
      count: pendingServiceRequests.length,
      description: 'Guest-originated requests requiring front-desk or service-floor coordination.',
      href: `${prefix}/service-requests`,
      icon: ClipboardList,
      permission: 'serviceRequests.read',
    },
    {
      title: 'Unread alert broadcast',
      count: recentNotifications.length,
      description: 'Recent admin alerts delivered across role groups and direct team recipients.',
      href: `${prefix}/notifications`,
      icon: AlertTriangle,
      permission: 'notifications.read',
    },
  ].filter((row) => isSuperAdmin || permissions.includes(row.permission));

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSuperAdmin ? "Admin Dashboard" : `${titleCase(user?.role)} Dashboard`}
        description="Coordinate rooms, reservations, finances, alerts, and multiple role-based teams from one clean operations command surface."
      >
        <div className="flex flex-wrap gap-3">
          {(isSuperAdmin || permissions.includes('reservations.read')) && (
            <Link to={`${prefix}/reservations`}>
              <Button variant="outline">Reservations desk</Button>
            </Link>
          )}
          {(isSuperAdmin || permissions.includes('staff.read')) && (
            <Link to={`${prefix}/staff`}>
              <Button variant="outline">Staff management</Button>
            </Link>
          )}
          {(isSuperAdmin || permissions.includes('notifications.create')) && (
            <Link to={`${prefix}/notifications`}>
              <Button variant="outline">Broadcast alerts</Button>
            </Link>
          )}
          {(isSuperAdmin || permissions.includes('settings.read')) && (
            <Link to={`${prefix}/settings`}>
              <Button variant="outline">System settings</Button>
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <StatsCard title="Rooms" value={String(cards?.totalRooms ?? 0)} description="Active room inventory" icon={BedDouble} />
        <StatsCard title="Occupied" value={String(cards?.occupiedRooms ?? 0)} description="Checked-in rooms now" icon={BedDouble} />
        <StatsCard title="Arrivals" value={String(cards?.todayArrivals ?? 0)} description="Expected today" icon={ClipboardList} />
        {(isSuperAdmin || permissions.includes('reports.read') || permissions.includes('payments.read')) && (
           <StatsCard title="Revenue 30d" value={formatAdminCurrency(cards?.revenueThisMonth ?? 0)} description="Captured payments" icon={CreditCard} />
        )}
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Team coverage</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Multiple staff members can operate under the same role while keeping separate credentials and portals.</p>
            </div>
            {(isSuperAdmin || permissions.includes('staff.read')) && (
              <Link to={`${prefix}/staff`}>
                <Button variant="outline">Manage staff</Button>
              </Link>
            )}
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            {staffCoverage.map((role) => (
              <div key={role.key} className="flex min-w-0 flex-col rounded-[22px] border border-[var(--border)] bg-white/78 p-4 shadow-[0_12px_26px_rgba(16,36,63,0.04)]">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]" title={role.label}>{role.label}</p>
                <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{role.count}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{role.coverage}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Operational dispatch</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Queues that depend on coordinated multi-role execution.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <div className="space-y-3">
            {dispatchRows.map((row) => {
              const Icon = row.icon;
              return (
                <Link key={row.title} to={row.href} className="block rounded-[22px] border border-[var(--border)] bg-white/78 p-4 transition hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[var(--accent-soft)] text-[var(--primary)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--primary)]">{row.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{row.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{row.count}</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Live items</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Reservation momentum</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Daily booking creation trend to understand incoming operational pressure.</p>
          </div>
          <div className="h-80 relative">
            {dashboardQuery.isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-white/70" />
            ) : (data?.charts?.dailyReservationsTrend ?? []).length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/50">
                <p className="text-sm text-[var(--muted-foreground)]">No reservation data for the selected period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.charts.dailyReservationsTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10243f" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {(isSuperAdmin || permissions.includes('reports.read')) && (
          <Card className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Room status distribution</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Availability, cleaning, and maintenance impact across the property.</p>
            </div>
            <div className="h-80 relative">
              {dashboardQuery.isLoading ? (
                <div className="h-full animate-pulse rounded-2xl bg-white/70" />
              ) : (data?.charts?.roomStatusDistribution ?? []).length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/50">
                  <p className="text-sm text-[var(--muted-foreground)]">No room status data available.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.charts.roomStatusDistribution ?? []} dataKey="value" nameKey="label" innerRadius={62} outerRadius={100} paddingAngle={3}>
                      {(data?.charts.roomStatusDistribution ?? []).map((entry, index) => (
                        <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        {(isSuperAdmin || permissions.includes('reports.read') || permissions.includes('payments.read')) && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[var(--primary)]">Revenue trend</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Monthly payment capture with operational readiness context.</p>
              </div>
              <Link to={`${prefix}/reports`}>
                <Button variant="outline">Open reports</Button>
              </Link>
            </div>
            <div className="h-80 relative">
              {dashboardQuery.isLoading ? (
                <div className="h-full animate-pulse rounded-2xl bg-white/70" />
              ) : (data?.charts?.revenueByMonth ?? []).length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/50">
                  <p className="text-sm text-[var(--muted-foreground)]">No revenue data available for the previous months.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts.revenueByMonth ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `Rs ${value}`} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#b88c4a" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        )}


        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Recent reservations</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Newest bookings entering the system for room assignment and arrival handling.</p>
            </div>
            {(isSuperAdmin || permissions.includes('reservations.read')) && (
              <Link to={`${prefix}/reservations`}>
                <Button variant="outline">View all</Button>
              </Link>
            )}
          </div>

          {reservationsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : recentReservations.length > 0 ? (
            <div className="space-y-3">
              {recentReservations.map((reservation) => (
                <div key={reservation.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{reservation.reservationCode}</p>
                      <h3 className="mt-1 text-base font-semibold text-[var(--primary)]">
                        {getDisplayName(reservation.guest ?? reservation.guestProfileSnapshot, 'Guest booking')}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {reservation.roomType?.name ?? 'Room type'} | {reservation.room ? `Room ${reservation.room.roomNumber}` : 'Awaiting room assignment'}
                      </p>
                    </div>
                    <StatusBadge value={reservation.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No reservations found in the current dataset.
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Alert broadcasts</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Unread notifications delivered through role-wide or direct staff targeting.</p>
            </div>
            {(isSuperAdmin || permissions.includes('notifications.read')) && (
              <Link to={`${prefix}/notifications`}>
                <Button variant="outline">Manage alerts</Button>
              </Link>
            )}
          </div>

          {notificationsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.map((notification) => {
                const audience = [
                  ...(notification.targetRoles ?? []).map((role) => role.replaceAll('_', ' ')),
                  notification.targetUserIds?.length ? `${notification.targetUserIds.length} direct user${notification.targetUserIds.length > 1 ? 's' : ''}` : null,
                ].filter(Boolean).join(' | ');

                return (
                  <div key={notification.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={notification.type} />
                      <StatusBadge value={notification.priority} />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-[var(--primary)]">{notification.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{notification.message}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      {audience || 'global broadcast'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No unread admin alerts right now.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Recent activity</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Critical actions from the audit trail across users, modules, and system updates.</p>
            </div>
            {(isSuperAdmin || permissions.includes('audit.read')) && (
              <Link to={`${prefix}/audit-logs`}>
                <Button variant="outline">Open audit trail</Button>
              </Link>
            )}
          </div>

          {auditQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id ?? `${log.action}-${log.entityId}`} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white/74 p-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">{log.action}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{log.entityType} | {log.entityId}</p>
                  </div>
                  <div className="text-right text-xs text-[var(--muted-foreground)]">
                    <p>{formatAdminDateTime(log.createdAt)}</p>
                    <p className="mt-1">{log.ip || 'system'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No audit activity found yet.
            </div>
          )}
        </Card>
      </div>

    </div>
  );
};
