import { BellRing, Building2, ClipboardList, ShieldAlert, Sparkles, Users2, Wallet, Wrench } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { printManagementReportDocument } from '@/lib/print-documents';
import { useManagerDashboard } from '@/features/manager/hooks';
import { useNotifications } from '@/features/notifications/hooks';
import { hasPermission } from '@/components/layout/sidebar';
import { useAuthStore } from '@/app/store/auth-store';

const pieColors = ['#10243f', '#b88c4a', '#d4a862', '#4f7bb6', '#6b7280'];
const formatCurrency = (value) => `Rs ${Number(value ?? 0).toFixed(2)}`;

const LoadingStack = ({ count = 4, className = 'h-20' }) => (
  <div className="grid gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className={`${className} animate-pulse rounded-2xl bg-white/70`} />
    ))}
  </div>
);

export const ManagerDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];

  const dashboardQuery = useManagerDashboard();
  const notificationsQuery = useNotifications({ readStatus: 'unread' });

  const data = dashboardQuery.data;
  const cards = data?.cards;
  const recentNotifications = (notificationsQuery.data ?? []).slice(0, 4);
  const roomStatusDistribution = data?.charts.roomStatusDistribution ?? [];
  const bookingSourceBreakdown = data?.charts.bookingSourceBreakdown ?? [];
  const feedbackAverageTrend = data?.charts.feedbackAverageTrend ?? [];

  const operatingRows = [
    {
      label: 'Available rooms',
      value: cards?.availableRooms ?? 0,
    },
    {
      label: 'Cleaning rooms',
      value: cards?.cleaningRooms ?? 0,
    },
    {
      label: 'Maintenance rooms',
      value: cards?.maintenanceRooms ?? 0,
    },
    {
      label: 'Unread alerts',
      value: recentNotifications.length,
    },
  ];

  const managementBoards = [
    {
      title: 'Executive summary',
      href: '/manager/executive-summary',
      value: `${cards?.occupancyPercentage ?? 0}% occupied`,
    },
    {
      title: 'Reservations overview',
      href: '/manager/reservations',
      value: `${cards?.todayArrivals ?? 0} arrivals`,
    },
    {
      title: 'Guest feedback insights',
      href: '/manager/feedback',
      value: `${cards?.averageFeedbackRating ?? 0}/5 avg`,
    },
    {
      title: 'Forecasting',
      href: '/manager/forecasting',
      value: `${cards?.reservationsThisMonth ?? 0} month bookings`,
    },
    {
      title: 'Housekeeping status',
      href: '/manager/housekeeping',
      value: `${cards?.cleaningRooms ?? 0} cleaning`,
    },
    {
      title: 'Maintenance overview',
      href: '/manager/maintenance',
      value: `${cards?.maintenanceRooms ?? 0} blocked`,
    },
  ].filter(board => hasPermission(board.href, permissions));

  const printSnapshot = () => {
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Manager',
      title: 'Manager Dashboard Snapshot',
      subtitle: 'Hotel-wide oversight snapshot covering occupancy, revenue, demand, service posture, and alerts.',
      rangeLabel: 'Live dashboard snapshot',
      metrics: [
        { label: 'Occupancy', value: `${cards?.occupancyPercentage ?? 0}%`, helper: 'Current occupied share of live inventory.' },
        { label: 'Revenue 30d', value: formatCurrency(cards?.revenueThisMonth ?? 0), helper: 'Captured payments in the recent window.' },
        { label: 'In-house guests', value: String(cards?.inHouseGuests ?? 0), helper: 'Guests currently checked in.' },
        { label: 'Average feedback', value: `${cards?.averageFeedbackRating ?? 0}/5`, helper: 'Current guest satisfaction average.' },
      ],
      sections: [
        {
          title: 'Operational posture',
          rows: operatingRows.map((row) => ({
            label: row.label,
            value: String(row.value),
            helper: row.description,
          })),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Dashboard"
        description="Hotel-wide performance and operations."
      >
        <div className="flex flex-wrap gap-3">
          {hasPermission('/manager/occupancy', permissions) && (
            <Link to="/manager/occupancy">
              <Button variant="outline">Occupancy overview</Button>
            </Link>
          )}
          {hasPermission('/manager/executive-summary', permissions) && (
            <Link to="/manager/executive-summary">
              <Button variant="outline">Executive summary</Button>
            </Link>
          )}
          {hasPermission('/manager/reservations', permissions) && (
            <Link to="/manager/reservations">
              <Button variant="outline">Reservations overview</Button>
            </Link>
          )}
          {hasPermission('/manager/revenue', permissions) && (
            <Link to="/manager/revenue">
              <Button variant="outline">Revenue reports</Button>
            </Link>
          )}
          {hasPermission('/manager/forecasting', permissions) && (
            <Link to="/manager/forecasting">
              <Button variant="outline">Forecasting</Button>
            </Link>
          )}
          {hasPermission('/manager/feedback', permissions) && (
            <Link to="/manager/feedback">
              <Button variant="outline">Guest feedback</Button>
            </Link>
          )}
          <Button variant="outline" onClick={printSnapshot}>Print snapshot</Button>
          {hasPermission('/manager/notifications', permissions) && (
            <Link to="/manager/notifications">
              <Button variant="outline">Notifications</Button>
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatsCard title="Occupancy" value={`${cards?.occupancyPercentage ?? 0}%`} description="Live share" icon={Building2} />
        <StatsCard title="Revenue 30d" value={formatCurrency(cards?.revenueThisMonth ?? 0)} description="Captured" icon={Wallet} />
        <StatsCard title="Arrivals" value={String(cards?.todayArrivals ?? 0)} description="Today" icon={ClipboardList} />
        <StatsCard title="Departures" value={String(cards?.todayDepartures ?? 0)} description="Today" icon={ClipboardList} />
        <StatsCard title="In-house" value={String(cards?.inHouseGuests ?? 0)} description="Checked in" icon={Users2} />
        <StatsCard title="Feedback" value={`${cards?.averageFeedbackRating ?? 0}/5`} description="Average" icon={Sparkles} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Management boards</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Open the operational lens you need without leaving the manager workspace.</p>
            </div>
            <ShieldAlert className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {managementBoards.map((board) => (
              <Link key={board.href} to={board.href} className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4 transition hover:border-[rgba(184,140,74,0.35)] hover:shadow-[var(--shadow-soft)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{board.title}</p>
                <p className="mt-3 text-lg font-semibold text-[var(--primary)]">{board.value}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Operational posture</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Manager-facing health signals across inventory, service teams, and alerts.</p>
            </div>
            {hasPermission('/manager/occupancy', permissions) && (
              <Link to="/manager/occupancy">
                <Button variant="outline">View occupancy</Button>
              </Link>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {operatingRows.map((row) => (
              <div key={row.label} className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{row.label}</p>
                <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{row.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Alert watch</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Unread manager notifications that may require escalation or review.</p>
            </div>
            <BellRing className="h-5 w-5 text-[var(--accent)]" />
          </div>

          {notificationsQuery.isLoading ? (
            <LoadingStack />
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/78 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={item.type} />
                        <StatusBadge value={item.priority} />
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-[var(--primary)]">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{item.message}</p>
                    </div>
                    <BellRing className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No unread managerial alerts right now.
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Revenue momentum</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Recent payment capture trend for commercial oversight.</p>
          </div>
          <div className="h-80">
            {dashboardQuery.isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-white/70" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.charts.monthlyRevenueTrend ?? []}>
                  <defs>
                    <linearGradient id="managerRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b88c4a" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#b88c4a" stopOpacity={0.12} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area type="monotone" dataKey="value" stroke="#b88c4a" fillOpacity={1} fill="url(#managerRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Booking source mix</h2>
            <p className="text-sm text-[var(--muted-foreground)]">How current booking demand is reaching the property.</p>
          </div>
          <div className="h-80">
            {dashboardQuery.isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-white/70" />
            ) : bookingSourceBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingSourceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10243f" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
                No booking source data available yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Room status distribution</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Availability, cleaning pressure, and maintenance impact across live inventory.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div className="h-72">
              {dashboardQuery.isLoading ? (
                <div className="h-full animate-pulse rounded-2xl bg-white/70" />
              ) : roomStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roomStatusDistribution} dataKey="value" nameKey="label" innerRadius={56} outerRadius={90} paddingAngle={3}>
                      {roomStatusDistribution.map((entry, index) => (
                        <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
                  No room distribution data available.
                </div>
              )}
            </div>

            <div className="space-y-3">
              {roomStatusDistribution.length > 0 ? (
                roomStatusDistribution.map((item, index) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white/78 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                      <p className="text-sm font-semibold capitalize text-[var(--primary)]">{item.label}</p>
                    </div>
                    <p className="text-lg text-[var(--primary)] [font-family:var(--font-display)]">{item.value}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-5 text-sm text-[var(--muted-foreground)]">
                  Room status summary will appear here when inventory data is available.
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Guest sentiment trend</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Feedback average movement over recent reporting periods.</p>
            </div>
            <Wrench className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="h-80">
            {dashboardQuery.isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-white/70" />
            ) : feedbackAverageTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feedbackAverageTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10243f" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
                No feedback trend data available yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
