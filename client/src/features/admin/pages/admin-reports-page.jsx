import { useState } from 'react';
import { Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import { adminApi } from '@/features/admin/api';
import {
  useAdminFeedbackReport,
  useAdminHousekeepingReport,
  useAdminMaintenanceReport,
  useAdminOccupancyReport,
  useAdminReservationsReport,
  useAdminRevenueReport,
} from '@/features/admin/hooks';
import { getApiErrorMessage } from '@/lib/api-error';

const pieColors = ['#10243f', '#b88c4a', '#d4a862', '#4f7bb6', '#6b7280'];
const reportExports = [
  { key: 'revenue', label: 'Revenue ledger', helper: 'Payments, invoice balances, collectors, and financial timestamps' },
  { key: 'reservations', label: 'Reservation ledger', helper: 'Guest, stay, room, rate, and lifecycle status detail' },
  { key: 'occupancy', label: 'Occupancy inventory', helper: 'Room-by-room inventory, status, pricing, and readiness posture' },
  { key: 'housekeeping', label: 'Housekeeping tasks', helper: 'Task ownership, room readiness, timing, and completion detail' },
  { key: 'maintenance', label: 'Maintenance queue', helper: 'Issue priority, assignees, rooms, and resolution timeline' },
  { key: 'feedback', label: 'Guest feedback', helper: 'Ratings, comments, category scores, and publication status' },
];
const formatCurrency = (value) => `Rs ${Number(value ?? 0).toFixed(2)}`;

const LoadingPanel = ({ height = 'h-72' }) => <div className={`${height} animate-pulse rounded-[22px] bg-white/70`} />;
const MetricCard = ({ label, value, helper }) => (
  <Card className="rounded-[22px] bg-white/78 p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-3 text-[34px] leading-none text-[var(--primary)] [font-family:var(--font-display)]">{value}</p>
    <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{helper}</p>
  </Card>
);

export const AdminReportsPage = () => {
  const occupancyQuery = useAdminOccupancyReport();
  const revenueQuery = useAdminRevenueReport();
  const reservationsQuery = useAdminReservationsReport();
  const housekeepingQuery = useAdminHousekeepingReport();
  const maintenanceQuery = useAdminMaintenanceReport();
  const feedbackQuery = useAdminFeedbackReport();
  const [downloadingReport, setDownloadingReport] = useState(null);

  const downloadReport = async (report) => {
    try {
      setDownloadingReport(report.key);
      const blob = await adminApi.exportReportCsv(report.key);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `luxurystay-${report.key}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${report.label} exported successfully.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to export CSV report.'));
    } finally {
      setDownloadingReport(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Evaluator-ready business intelligence for occupancy, revenue, reservation demand, housekeeping speed, maintenance pressure, and guest sentiment."
      />

      <AdminToolbar
        title="Analytics actions"
        description="Download polished CSV report packs with real operational rows, not just chart summaries."
      >
        <div className="grid w-full gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {reportExports.map((report) => (
            <Button
              key={report.key}
              variant="outline"
              className="h-auto justify-start rounded-2xl px-4 py-3 text-left"
              onClick={() => downloadReport(report)}
              disabled={downloadingReport === report.key}
            >
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--primary)]">
                    {downloadingReport === report.key ? `Exporting ${report.label}...` : report.label}
                  </div>
                  <div className="text-xs leading-5 text-[var(--muted-foreground)]">{report.helper}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </AdminToolbar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Occupancy"
          value={`${occupancyQuery.data?.summary.occupancyPercentage ?? 0}%`}
          helper={`${occupancyQuery.data?.summary.occupiedRooms ?? 0} of ${occupancyQuery.data?.summary.totalRooms ?? 0} rooms currently occupied`}
        />
        <MetricCard
          label="Revenue"
          value={formatCurrency(revenueQuery.data?.summary.totalRevenue ?? 0)}
          helper={`${revenueQuery.data?.summary.periods ?? 0} recent reporting periods tracked`}
        />
        <MetricCard
          label="Housekeeping"
          value={String(housekeepingQuery.data?.summary.pendingTasks ?? 0)}
          helper={`Average completion ${housekeepingQuery.data?.summary.averageCompletionHours ?? 0}h`}
        />
        <MetricCard
          label="Maintenance"
          value={String(maintenanceQuery.data?.summary.openIssues ?? 0)}
          helper={`${maintenanceQuery.data?.summary.urgentIssues ?? 0} urgent issues currently active`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="space-y-2">
            <div>
              <h2 className="text-[26px] text-[var(--primary)] [font-family:var(--font-display)]">Revenue trend</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Successful payment capture across recent reporting periods.</p>
            </div>
          </div>
          <div className="h-80">
            {revenueQuery.isLoading ? (
              <LoadingPanel height="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueQuery.data?.trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#b88c4a" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="space-y-2">
            <div>
              <h2 className="text-[26px] text-[var(--primary)] [font-family:var(--font-display)]">Occupancy mix</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Room-state distribution for availability and operational pressure.</p>
            </div>
          </div>
          <div className="h-80">
            {occupancyQuery.isLoading ? (
              <LoadingPanel height="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyQuery.data?.distribution ?? []} dataKey="value" nameKey="label" innerRadius={62} outerRadius={102} paddingAngle={3}>
                    {(occupancyQuery.data?.distribution ?? []).map((entry, index) => (
                      <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <div className="space-y-2">
            <div>
              <h2 className="text-[26px] text-[var(--primary)] [font-family:var(--font-display)]">Reservation demand</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Booking trend through the recent operating window.</p>
            </div>
          </div>
          <div className="h-72">
            {reservationsQuery.isLoading ? (
              <LoadingPanel height="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reservationsQuery.data?.trend ?? []}>
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

        <Card className="space-y-5">
          <div className="space-y-2">
            <div>
              <h2 className="text-[26px] text-[var(--primary)] [font-family:var(--font-display)]">Guest sentiment</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Average rating {feedbackQuery.data?.summary.averageRating ?? 0}/5 from {feedbackQuery.data?.summary.totalFeedback ?? 0} submitted reviews.
              </p>
            </div>
          </div>
          <div className="h-72">
            {feedbackQuery.isLoading ? (
              <LoadingPanel height="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackQuery.data?.distribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10243f" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="space-y-2">
            <div>
              <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Housekeeping performance</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Cleaning throughput and turnaround visibility for operations review.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--primary)]">{housekeepingQuery.data?.summary.pendingTasks ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--primary)]">{housekeepingQuery.data?.summary.completedTasks ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Avg hours</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--primary)]">{housekeepingQuery.data?.summary.averageCompletionHours ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-2">
            <div>
              <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Maintenance health</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Issue pressure, urgency, and resolution pace across maintenance operations.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Open</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--primary)]">{maintenanceQuery.data?.summary.openIssues ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Urgent</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--primary)]">{maintenanceQuery.data?.summary.urgentIssues ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Resolved</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--primary)]">{maintenanceQuery.data?.summary.resolvedIssues ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Avg hours</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--primary)]">{maintenanceQuery.data?.summary.averageResolutionHours ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
