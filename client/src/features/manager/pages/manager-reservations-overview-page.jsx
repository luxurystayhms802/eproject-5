import { useMemo, useState } from 'react';
import { CalendarRange, ClipboardList, Hotel, Landmark, ShieldAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { printManagementReportDocument } from '@/lib/print-documents';
import { ManagerReportToolbar } from '@/features/manager/components/manager-report-toolbar';
import { managerApi } from '@/features/manager/api';
import { useManagerReservations } from '@/features/manager/hooks';
import { buildManagerReportParams, downloadManagerReportCsv, getManagerRangeLabel, validateManagerDateRange } from '@/features/manager/report-utils';

const LoadingCard = ({ className = 'h-72' }) => <div className={`${className} animate-pulse rounded-[24px] bg-white/70`} />;

const getBucketValue = (buckets, key) => buckets.find((bucket) => String(bucket.label).toLowerCase() === key)?.value ?? 0;

const getTopBucket = (buckets) => {
  if (!buckets.length) {
    return { label: 'n/a', value: 0 };
  }

  return [...buckets].sort((left, right) => Number(right.value ?? 0) - Number(left.value ?? 0))[0];
};

export const ManagerReservationsOverviewPage = () => {
  const [draftRange, setDraftRange] = useState({ from: '', to: '' });
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
  const [isExporting, setIsExporting] = useState(false);
  const queryParams = useMemo(() => buildManagerReportParams(appliedRange), [appliedRange]);
  const { data, isLoading } = useManagerReservations(queryParams);

  const statusBreakdown = data?.statusBreakdown ?? [];
  const sourceBreakdown = data?.sourceBreakdown ?? [];
  const trend = data?.trend ?? [];

  const totalReservations = statusBreakdown.reduce((sum, bucket) => sum + Number(bucket.value ?? 0), 0);
  const confirmedReservations = getBucketValue(statusBreakdown, 'confirmed');
  const checkedInReservations = getBucketValue(statusBreakdown, 'checked_in');
  const cancelledReservations = getBucketValue(statusBreakdown, 'cancelled');
  const topSource = getTopBucket(sourceBreakdown);

  const applyRange = () => {
    const validationMessage = validateManagerDateRange(draftRange);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    setAppliedRange(draftRange);
    toast.success('Reservation insights updated.');
  };

  const resetRange = () => {
    setDraftRange({ from: '', to: '' });
    setAppliedRange({ from: '', to: '' });
  };

  const handleExport = async () => {
    const validationMessage = validateManagerDateRange(draftRange);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    try {
      setIsExporting(true);
      await downloadManagerReportCsv({ reportKey: 'reservations', range: draftRange, exportFn: managerApi.exportReportCsv, label: 'Reservations report' });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const validationMessage = validateManagerDateRange(draftRange);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Manager',
      title: 'Reservations Overview',
      subtitle: 'Booking posture, source mix, and stay movement trends for hotel-wide management review.',
      rangeLabel: getManagerRangeLabel(draftRange, 'Last 30 days'),
      metrics: [
        { label: 'Reservations', value: String(totalReservations), helper: 'Visible bookings in the reporting mix.' },
        { label: 'Confirmed', value: String(confirmedReservations), helper: 'Stays already ready for arrival planning.' },
        { label: 'Checked in', value: String(checkedInReservations), helper: 'Guests already in-house.' },
        { label: 'Top source', value: `${topSource.label} (${topSource.value})`, helper: 'Leading booking channel in the current range.' },
      ],
      sections: [
        {
          title: 'Status distribution',
          rows: statusBreakdown.map((item) => ({
            label: item.label,
            value: String(item.value),
            helper: 'Reservations currently recorded in this lifecycle stage.',
          })),
        },
        {
          title: 'Source mix',
          rows: sourceBreakdown.map((item) => ({
            label: item.label,
            value: String(item.value),
            helper: 'Reservations captured from this booking channel.',
          })),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations Overview"
        description="Booking mix and stay movement."
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/manager/occupancy">
              <Button variant="secondary">Open occupancy</Button>
            </Link>
            <Link to="/manager/revenue">
              <Button variant="outline">Open revenue</Button>
            </Link>
          </div>
        }
      >
        <StatusBadge value={confirmedReservations > 0 ? 'confirmed' : 'inactive'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Top source {topSource.label}
        </span>
      </PageHeader>

      <ManagerReportToolbar
        title="Reservation analytics"
        description="Filter, export, or print."
        range={draftRange}
        onRangeChange={(field, value) => setDraftRange((current) => ({ ...current, [field]: value }))}
        onApply={applyRange}
        onReset={resetRange}
        onExport={handleExport}
        onPrint={handlePrint}
        isExporting={isExporting}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard title="Reservations" value={String(totalReservations)} description="In range" icon={ClipboardList} />
        <StatsCard title="Confirmed" value={String(confirmedReservations)} description="Arrival ready" icon={CalendarRange} />
        <StatsCard title="Checked in" value={String(checkedInReservations)} description="In-house" icon={Hotel} />
        <StatsCard title="Cancelled" value={String(cancelledReservations)} description="Cancelled" icon={ShieldAlert} />
        <StatsCard title="Top source" value={String(topSource.value ?? 0)} description={String(topSource.label)} icon={Landmark} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Reservation status distribution</h2>
            <p className="text-sm text-[var(--muted-foreground)]">A clean management view of the reservation lifecycle mix.</p>
          </div>
          <div className="h-80">
            {isLoading ? (
              <LoadingCard className="h-full" />
            ) : statusBreakdown.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10243f" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
                No reservation lifecycle data is available yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Booking source mix</h2>
            <p className="text-sm text-[var(--muted-foreground)]">See which channels are currently feeding demand into the property.</p>
          </div>
          <div className="h-80">
            {isLoading ? (
              <LoadingCard className="h-full" />
            ) : sourceBreakdown.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#b88c4a" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
                No source mix data is available yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Reservation trend</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Recent booking movement that can shape occupancy planning and staffing decisions.</p>
          </div>
          <div className="h-80">
            {isLoading ? (
              <LoadingCard className="h-full" />
            ) : trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10243f" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
                No trend data is available yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Manager reading</h2>
            <p className="text-sm text-[var(--muted-foreground)]">A quick interpretation panel for day-to-day commercial oversight.</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Active booking load</p>
              <p className="mt-3 text-[30px] text-[var(--primary)] [font-family:var(--font-display)]">{confirmedReservations + checkedInReservations}</p>
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Channel watch</p>
              <p className="mt-3 text-lg font-semibold text-[var(--primary)] capitalize">{topSource.label}</p>
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Cancellation pressure</p>
              <p className="mt-3 text-lg font-semibold text-[var(--primary)]">{cancelledReservations}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
