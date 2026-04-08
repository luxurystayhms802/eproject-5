import { useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck, TimerReset, Wrench } from 'lucide-react';
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
import { useManagerMaintenance } from '@/features/manager/hooks';
import { buildManagerReportParams, downloadManagerReportCsv, getManagerRangeLabel, validateManagerDateRange } from '@/features/manager/report-utils';

const formatHours = (value) => `${Number(value ?? 0).toFixed(2)}h`;

export const ManagerMaintenanceOverviewPage = () => {
  const [draftRange, setDraftRange] = useState({ from: '', to: '' });
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
  const [isExporting, setIsExporting] = useState(false);
  const queryParams = useMemo(() => buildManagerReportParams(appliedRange), [appliedRange]);
  const { data, isLoading } = useManagerMaintenance(queryParams);
  const summary = data?.summary ?? {};
  const openIssues = Number(summary.openIssues ?? 0);
  const urgentIssues = Number(summary.urgentIssues ?? 0);
  const resolvedIssues = Number(summary.resolvedIssues ?? 0);
  const averageResolutionHours = Number(summary.averageResolutionHours ?? 0);

  const applyRange = () => {
    const validationMessage = validateManagerDateRange(draftRange);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    setAppliedRange(draftRange);
    toast.success('Maintenance view updated.');
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
      await downloadManagerReportCsv({ reportKey: 'maintenance', range: draftRange, exportFn: managerApi.exportReportCsv, label: 'Maintenance report' });
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
      title: 'Maintenance Overview',
      subtitle: 'Engineering pressure, urgency, and resolution pace prepared for management oversight.',
      rangeLabel: getManagerRangeLabel(draftRange, 'Recent maintenance window'),
      metrics: [
        { label: 'Open issues', value: String(openIssues), helper: 'Requests still requiring operational attention.' },
        { label: 'Urgent issues', value: String(urgentIssues), helper: 'High-severity incidents impacting room readiness.' },
        { label: 'Resolved issues', value: String(resolvedIssues), helper: 'Requests already resolved or closed.' },
        { label: 'Avg resolution', value: formatHours(averageResolutionHours), helper: 'Average engineering turnaround across resolved work.' },
      ],
      sections: [
        {
          title: 'Manager reading',
          rows: [
            {
              label: 'Current risk',
              value: urgentIssues > 0 ? 'Urgent engineering attention required' : 'Stable',
              helper: urgentIssues > 0
                ? 'Urgent unresolved issues can reduce sellable inventory.'
                : 'No urgent unresolved maintenance items are currently visible.',
            },
          ],
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Overview"
        description="Engineering load and issue urgency."
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/manager/notifications">
              <Button variant="secondary">Open alerts</Button>
            </Link>
            <Link to="/manager/occupancy">
              <Button variant="outline">Inventory impact</Button>
            </Link>
          </div>
        }
      >
        <StatusBadge value={urgentIssues > 0 ? 'maintenance' : 'active'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Avg resolve {formatHours(averageResolutionHours)}
        </span>
      </PageHeader>

      <ManagerReportToolbar
        title="Maintenance actions"
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
        <StatsCard title="Open issues" value={String(openIssues)} description="Open" icon={Wrench} />
        <StatsCard title="Urgent issues" value={String(urgentIssues)} description="High priority" icon={AlertTriangle} />
        <StatsCard title="Resolved" value={String(resolvedIssues)} description="Closed" icon={ShieldCheck} />
        <StatsCard title="Avg resolution" value={formatHours(averageResolutionHours)} description="Cycle time" icon={TimerReset} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Engineering posture</h2>
            <p className="text-sm text-[var(--muted-foreground)]">A management reading of maintenance load and operational risk.</p>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-[24px] bg-white/70" />
          ) : (
            <div className="space-y-3">
              <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Current risk</p>
                <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">
                  {urgentIssues > 0 ? 'Urgent engineering attention required' : 'Maintenance pressure is stable'}
                </p>
              </div>

              <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Resolution speed</p>
                <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{formatHours(averageResolutionHours)}</p>
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
              Review urgent issues first, especially those linked to occupied or soon-to-arrive rooms.
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              Watch average resolution time for signals that engineering coverage may be under strain.
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              Coordinate with housekeeping and front desk when repairs directly affect room release timing.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
