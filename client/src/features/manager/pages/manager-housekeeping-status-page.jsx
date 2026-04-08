import { useMemo, useState } from 'react';
import { CheckCircle2, Hotel, Sparkles, TimerReset } from 'lucide-react';
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
import { useManagerHousekeeping } from '@/features/manager/hooks';
import { buildManagerReportParams, downloadManagerReportCsv, getManagerRangeLabel, validateManagerDateRange } from '@/features/manager/report-utils';

const formatHours = (value) => `${Number(value ?? 0).toFixed(2)}h`;

export const ManagerHousekeepingStatusPage = () => {
  const [draftRange, setDraftRange] = useState({ from: '', to: '' });
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
  const [isExporting, setIsExporting] = useState(false);
  const queryParams = useMemo(() => buildManagerReportParams(appliedRange), [appliedRange]);
  const { data, isLoading } = useManagerHousekeeping(queryParams);
  const summary = data?.summary ?? {};
  const pendingTasks = Number(summary.pendingTasks ?? 0);
  const completedTasks = Number(summary.completedTasks ?? 0);
  const averageCompletionHours = Number(summary.averageCompletionHours ?? 0);

  const readinessTone = pendingTasks > completedTasks ? 'pending' : 'clean';

  const applyRange = () => {
    const validationMessage = validateManagerDateRange(draftRange);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    setAppliedRange(draftRange);
    toast.success('Housekeeping status updated.');
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
      await downloadManagerReportCsv({ reportKey: 'housekeeping', range: draftRange, exportFn: managerApi.exportReportCsv, label: 'Housekeeping report' });
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
      title: 'Housekeeping Status',
      subtitle: 'Room-turnover readiness and cleaning throughput for management oversight.',
      rangeLabel: getManagerRangeLabel(draftRange, 'Recent housekeeping window'),
      metrics: [
        { label: 'Pending tasks', value: String(pendingTasks), helper: 'Tasks still waiting for completion.' },
        { label: 'Completed tasks', value: String(completedTasks), helper: 'Tasks already closed in the current reporting set.' },
        { label: 'Average completion', value: formatHours(averageCompletionHours), helper: 'Average time taken to complete a housekeeping task.' },
      ],
      sections: [
        {
          title: 'Manager reading',
          rows: [
            {
              label: 'Turnover posture',
              value: pendingTasks > completedTasks ? 'Watch closely' : 'Stable',
              helper: pendingTasks > completedTasks
                ? 'Cleaning pressure is currently heavier than completed output.'
                : 'Completed housekeeping output is keeping pace with turnover demand.',
            },
          ],
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Housekeeping Status"
        description="Room readiness and cleaning pace."
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/manager/occupancy">
              <Button variant="secondary">Occupancy impact</Button>
            </Link>
            <Link to="/manager/notifications">
              <Button variant="outline">View alerts</Button>
            </Link>
          </div>
        }
      >
        <StatusBadge value={readinessTone} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Completion pace {formatHours(averageCompletionHours)}
        </span>
      </PageHeader>

      <ManagerReportToolbar
        title="Housekeeping actions"
        description="Filter, export, or print."
        range={draftRange}
        onRangeChange={(field, value) => setDraftRange((current) => ({ ...current, [field]: value }))}
        onApply={applyRange}
        onReset={resetRange}
        onExport={handleExport}
        onPrint={handlePrint}
        isExporting={isExporting}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Pending tasks" value={String(pendingTasks)} description="Open" icon={Sparkles} />
        <StatsCard title="Completed" value={String(completedTasks)} description="Closed" icon={CheckCircle2} />
        <StatsCard title="Avg turnaround" value={formatHours(averageCompletionHours)} description="Cycle time" icon={TimerReset} />
        <StatsCard title="Readiness posture" value={pendingTasks > completedTasks ? 'Watch' : 'Stable'} description="Current" icon={Hotel} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Turnover posture</h2>
            <p className="text-sm text-[var(--muted-foreground)]">A concise reading of whether cleaning throughput is keeping up with room readiness demand.</p>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-[24px] bg-white/70" />
          ) : (
            <div className="space-y-3">
              <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Queue balance</p>
                <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">
                  {pendingTasks > completedTasks ? 'Cleaning pressure elevated' : 'Turnover pace under control'}
                </p>
              </div>

              <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Cycle time</p>
                <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{formatHours(averageCompletionHours)}</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Manager checklist</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Focus points.</p>
          </div>

          <div className="space-y-3 text-sm leading-6 text-[var(--muted-foreground)]">
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              Review pending cleaning load against today&apos;s departures and upcoming arrivals.
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              Escalate maintenance-blocked rooms early if cleaning cannot release inventory on schedule.
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              Use completion pace trends to decide whether more housekeeping coverage is needed on peak days.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
