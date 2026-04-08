import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BrainCircuit, ClipboardList, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { printManagementReportDocument } from '@/lib/print-documents';
import { useManagerDashboard, useManagerReservations, useManagerRevenue } from '@/features/manager/hooks';
import { average, buildForecastSeries, formatDirectionLabel, getTrendDirection } from '@/features/manager/insights-utils';
import { formatManagerCurrency } from '@/features/manager/report-utils';

export const ManagerForecastingPage = () => {
  const dashboardQuery = useManagerDashboard();
  const reservationsQuery = useManagerReservations();
  const revenueQuery = useManagerRevenue();

  const reservationTrend = reservationsQuery.data?.trend ?? [];
  const revenueTrend = revenueQuery.data?.trend ?? [];
  const dashboardCards = dashboardQuery.data?.cards ?? {};

  const reservationForecast = useMemo(() => buildForecastSeries(reservationTrend, 3), [reservationTrend]);
  const revenueForecast = useMemo(() => buildForecastSeries(revenueTrend, 3), [revenueTrend]);

  const reservationDirection = getTrendDirection(reservationTrend);
  const revenueDirection = getTrendDirection(revenueTrend);
  const averageProjectedReservations = average(reservationForecast.filter((item) => item.forecast).map((item) => item.value));
  const averageProjectedRevenue = average(revenueForecast.filter((item) => item.forecast).map((item) => item.value));

  const printForecast = () => {
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Forecasting',
      title: 'Manager Forecasting',
      subtitle: 'Simple trend-driven forecasting to support demand planning, room readiness, and commercial decisions.',
      rangeLabel: 'Forecast based on recent reporting periods',
      metrics: [
        { label: 'Reservation direction', value: formatDirectionLabel(reservationDirection), helper: 'Direction derived from current reservation trend.' },
        { label: 'Revenue direction', value: formatDirectionLabel(revenueDirection), helper: 'Direction derived from recent revenue trend.' },
        { label: 'Projected reservations', value: Number(averageProjectedReservations).toFixed(0), helper: 'Average across the next forecasted periods.' },
        { label: 'Projected revenue', value: formatManagerCurrency(averageProjectedRevenue), helper: 'Average projected value across the next forecasted periods.' },
      ],
      sections: [
        {
          title: 'Operational planning notes',
          rows: [
            { label: 'Current occupancy', value: `${dashboardCards.occupancyPercentage ?? 0}%`, helper: 'Use together with reservation forecasts for capacity planning.' },
            { label: 'Cleaning rooms', value: String(dashboardCards.cleaningRooms ?? 0), helper: 'Turnover load that may affect future arrivals.' },
            { label: 'Maintenance rooms', value: String(dashboardCards.maintenanceRooms ?? 0), helper: 'Inventory blocked by technical issues.' },
          ],
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forecasting"
        description="Demand and revenue outlook."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={printForecast}>Print forecast</Button>
            <Link to="/manager/executive-summary">
              <Button variant="outline">Executive summary</Button>
            </Link>
          </div>
        }
      >
        <StatusBadge value={revenueDirection === 'up' || reservationDirection === 'up' ? 'active' : 'pending'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Forecasting horizon 3 periods
        </span>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Reservation trend" value={formatDirectionLabel(reservationDirection)} description="Demand" icon={ClipboardList} />
        <StatsCard title="Revenue trend" value={formatDirectionLabel(revenueDirection)} description="Commercial" icon={Wallet} />
        <StatsCard title="Projected reservations" value={Number(averageProjectedReservations).toFixed(0)} description="Next periods" icon={TrendingUp} />
        <StatsCard title="Projected revenue" value={formatManagerCurrency(averageProjectedRevenue)} description="Next periods" icon={BrainCircuit} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Reservation forecast</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Reservations trend and projection.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reservationForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10243f" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="0" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Revenue forecast</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Revenue trend and projection.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip formatter={(value) => formatManagerCurrency(Number(value))} />
                <Bar dataKey="value" fill="#b88c4a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Planning signals</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Key planning signals.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Occupancy baseline</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{dashboardCards.occupancyPercentage ?? 0}%</p>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Room-release pressure</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{Number(dashboardCards.cleaningRooms ?? 0) + Number(dashboardCards.maintenanceRooms ?? 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Action watch</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Focus points.</p>
          </div>
          <div className="space-y-3 text-sm leading-6 text-[var(--muted-foreground)]">
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              If reservations are trending up while room-release pressure is also high, coordinate housekeeping and maintenance before increasing direct-selling intensity.
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              If revenue is trending down while occupancy remains healthy, review rate strategy, discount posture, and booking-source quality.
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              Use projected demand together with guest feedback to avoid pushing occupancy at the cost of service quality.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
