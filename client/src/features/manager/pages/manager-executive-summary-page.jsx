import { useMemo } from 'react';
import { BellRing, Building2, ClipboardList, Hotel, Sparkles, Wallet, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { printManagementReportDocument } from '@/lib/print-documents';
import { useManagerDashboard, useManagerFeedback, useManagerHousekeeping, useManagerMaintenance, useManagerReservations, useManagerRevenue } from '@/features/manager/hooks';
import { formatManagerCurrency } from '@/features/manager/report-utils';

const readPosture = ({ occupancy, urgentIssues, pendingHousekeeping, averageRating }) => {
  if (urgentIssues > 0 || pendingHousekeeping > 8 || averageRating < 3.5) {
    return { label: 'Attention needed', tone: 'maintenance' };
  }

  if (occupancy >= 70) {
    return { label: 'High-demand control', tone: 'pending' };
  }

  return { label: 'Stable operations', tone: 'active' };
};

export const ManagerExecutiveSummaryPage = () => {
  const dashboardQuery = useManagerDashboard();
  const reservationsQuery = useManagerReservations();
  const revenueQuery = useManagerRevenue();
  const feedbackQuery = useManagerFeedback();
  const housekeepingQuery = useManagerHousekeeping();
  const maintenanceQuery = useManagerMaintenance();

  const cards = dashboardQuery.data?.cards ?? {};
  const reservations = reservationsQuery.data ?? {};
  const revenue = revenueQuery.data ?? {};
  const feedback = feedbackQuery.data ?? {};
  const housekeeping = housekeepingQuery.data?.summary ?? {};
  const maintenance = maintenanceQuery.data?.summary ?? {};

  const executiveMetrics = useMemo(
    () => ({
      occupancy: Number(cards.occupancyPercentage ?? 0),
      revenue: Number(revenue.summary?.totalRevenue ?? cards.revenueThisMonth ?? 0),
      arrivals: Number(cards.todayArrivals ?? 0),
      departures: Number(cards.todayDepartures ?? 0),
      openIssues: Number(maintenance.openIssues ?? 0),
      urgentIssues: Number(maintenance.urgentIssues ?? 0),
      pendingHousekeeping: Number(housekeeping.pendingTasks ?? 0),
      feedbackAverage: Number(feedback.summary?.averageRating ?? cards.averageFeedbackRating ?? 0),
      reservations: (reservations.statusBreakdown ?? []).reduce((sum, item) => sum + Number(item.value ?? 0), 0),
    }),
    [cards, feedback.summary, housekeeping.pendingTasks, maintenance.openIssues, maintenance.urgentIssues, reservations.statusBreakdown, revenue.summary],
  );

  const posture = readPosture({
    occupancy: executiveMetrics.occupancy,
    urgentIssues: executiveMetrics.urgentIssues,
    pendingHousekeeping: executiveMetrics.pendingHousekeeping,
    averageRating: executiveMetrics.feedbackAverage,
  });

  const printSummary = () => {
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Executive',
      title: 'Manager Executive Summary',
      subtitle: 'A concise leadership snapshot across occupancy, revenue, room readiness, engineering pressure, and guest sentiment.',
      rangeLabel: 'Live management snapshot',
      metrics: [
        { label: 'Operating posture', value: posture.label, helper: 'Hotel-wide reading based on live management signals.' },
        { label: 'Occupancy', value: `${executiveMetrics.occupancy}%`, helper: 'Current occupied share of active inventory.' },
        { label: 'Revenue', value: formatManagerCurrency(executiveMetrics.revenue), helper: 'Captured payment performance in the reporting view.' },
        { label: 'Guest sentiment', value: `${executiveMetrics.feedbackAverage.toFixed(2)}/5`, helper: 'Average rating from guest feedback records.' },
      ],
      sections: [
        {
          title: 'Operational signals',
          rows: [
            { label: 'Arrivals today', value: String(executiveMetrics.arrivals), helper: 'Expected arrivals requiring front-desk readiness.' },
            { label: 'Departures today', value: String(executiveMetrics.departures), helper: 'Expected departures feeding room-turnover load.' },
            { label: 'Pending housekeeping', value: String(executiveMetrics.pendingHousekeeping), helper: 'Tasks still waiting for completion.' },
            { label: 'Open maintenance', value: String(executiveMetrics.openIssues), helper: 'Engineering issues still impacting operations.' },
            { label: 'Urgent issues', value: String(executiveMetrics.urgentIssues), helper: 'High-severity maintenance items needing attention.' },
            { label: 'Reservations in view', value: String(executiveMetrics.reservations), helper: 'Booking load represented in reports.' },
          ],
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Summary"
        description="Leadership snapshot of hotel performance."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={printSummary}>Print summary</Button>
            <Link to="/manager/forecasting">
              <Button variant="outline">Open forecasting</Button>
            </Link>
          </div>
        }
      >
        <StatusBadge value={posture.tone} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          {posture.label}
        </span>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Occupancy" value={`${executiveMetrics.occupancy}%`} description="Live share" icon={Building2} />
        <StatsCard title="Revenue" value={formatManagerCurrency(executiveMetrics.revenue)} description="Captured" icon={Wallet} />
        <StatsCard title="Arrivals" value={String(executiveMetrics.arrivals)} description="Today" icon={ClipboardList} />
        <StatsCard title="Housekeeping" value={String(executiveMetrics.pendingHousekeeping)} description="Pending" icon={Sparkles} />
        <StatsCard title="Maintenance" value={String(executiveMetrics.openIssues)} description="Open" icon={Wrench} />
        <StatsCard title="Sentiment" value={`${executiveMetrics.feedbackAverage.toFixed(2)}/5`} description="Average" icon={BellRing} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Decision panel</h2>
            <p className="text-sm text-[var(--muted-foreground)]">A clean summary of what management should watch next.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Inventory posture</p>
              <p className="mt-3 text-lg font-semibold text-[var(--primary)]">
                {executiveMetrics.occupancy >= 75 ? 'Sellable inventory under pressure' : 'Inventory remains flexible'}
              </p>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Service posture</p>
              <p className="mt-3 text-lg font-semibold text-[var(--primary)]">
                {executiveMetrics.feedbackAverage >= 4 ? 'Guest sentiment is healthy' : 'Service recovery opportunities visible'}
              </p>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Front-desk load</p>
              <p className="mt-3 text-lg font-semibold text-[var(--primary)]">{executiveMetrics.arrivals + executiveMetrics.departures} movements</p>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Risk watch</p>
              <p className="mt-3 text-lg font-semibold text-[var(--primary)]">{executiveMetrics.urgentIssues} urgent issue(s)</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Quick routes</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Jump into the management lens that needs attention right now.</p>
          </div>

          <div className="space-y-3">
            <Link to="/manager/occupancy" className="block rounded-[22px] border border-[var(--border)] bg-white/78 p-4 transition hover:border-[rgba(184,140,74,0.35)] hover:shadow-[var(--shadow-soft)]">
              <p className="text-lg font-semibold text-[var(--primary)]">Occupancy overview</p>
            </Link>
            <Link to="/manager/reservations" className="block rounded-[22px] border border-[var(--border)] bg-white/78 p-4 transition hover:border-[rgba(184,140,74,0.35)] hover:shadow-[var(--shadow-soft)]">
              <p className="text-lg font-semibold text-[var(--primary)]">Reservations overview</p>
            </Link>
            <Link to="/manager/forecasting" className="block rounded-[22px] border border-[var(--border)] bg-white/78 p-4 transition hover:border-[rgba(184,140,74,0.35)] hover:shadow-[var(--shadow-soft)]">
              <p className="text-lg font-semibold text-[var(--primary)]">Forecasting</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
