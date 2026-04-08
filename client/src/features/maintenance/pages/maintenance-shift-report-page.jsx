import { ClipboardCheck, Download, Printer, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMaintenanceHistory, useMaintenanceOpenRequests } from '@/features/maintenance/hooks';
import { downloadCsv } from '@/lib/export-documents';
import { printManagementReportDocument } from '@/lib/print-documents';

export const MaintenanceShiftReportPage = () => {
  const openQuery = useMaintenanceOpenRequests();
  const historyQuery = useMaintenanceHistory();

  const openRequests = openQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const urgent = openRequests.filter((item) => item.priority === 'urgent').length;
  const active = openRequests.filter((item) => item.status === 'in_progress').length;

  const reportRows = [...openRequests, ...history].map((item) => ({
    room: item.room?.roomNumber ?? item.locationLabel ?? 'general area',
    issue_type: item.issueType,
    priority: item.priority,
    status: item.status,
    assigned_to: item.assignedTo?.fullName ?? 'unassigned',
    resolution_notes: item.resolutionNotes ?? '',
  }));

  const handlePrint = () => {
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Maintenance',
      title: 'Maintenance Shift Report',
      subtitle: 'Open incidents, active workload, and recent technical closures.',
      rangeLabel: new Date().toLocaleDateString(),
      metrics: [
        { label: 'Open requests', value: String(openRequests.length), helper: 'Still unresolved' },
        { label: 'Urgent', value: String(urgent), helper: 'Immediate dispatch' },
        { label: 'Active', value: String(active), helper: 'Currently being worked' },
        { label: 'Resolved history', value: String(history.length), helper: 'Resolved or closed records' },
      ],
      sections: [
        {
          title: 'Open queue',
          rows: openRequests.slice(0, 8).map((item) => ({
            label: item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.locationLabel ?? 'General area',
            value: item.status,
            helper: `${item.issueType} | ${item.priority}`,
          })),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shift Report" description="Print or export the current maintenance shift summary.">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print report
          </Button>
          <Button variant="outline" onClick={() => downloadCsv('maintenance-shift-report.csv', reportRows)} disabled={reportRows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Open" value={String(openRequests.length)} description="Unresolved requests" icon={Wrench} />
        <StatsCard title="Urgent" value={String(urgent)} description="Immediate dispatch" icon={Wrench} />
        <StatsCard title="Active" value={String(active)} description="In progress now" icon={Wrench} />
        <StatsCard title="Resolved" value={String(history.length)} description="Resolved or closed" icon={ClipboardCheck} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--primary)]">Open queue</h2>
          {openQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : openRequests.length > 0 ? (
            <div className="grid gap-3">
              {openRequests.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--primary)]">
                        {item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.locationLabel ?? 'General area'}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] capitalize">
                        {item.issueType} | {item.priority}
                      </p>
                    </div>
                    <p className="text-sm font-semibold capitalize text-[var(--primary)]">{item.status.replaceAll('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No open maintenance requests are visible right now.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--primary)]">Resolved history</h2>
          {historyQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="grid gap-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--primary)]">
                        {item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.locationLabel ?? 'General area'}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] capitalize">{item.issueType}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.resolutionNotes ?? 'Resolution recorded'}</p>
                    </div>
                    <p className="text-sm font-semibold capitalize text-[var(--primary)]">{item.status.replaceAll('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No resolved maintenance history is visible yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
