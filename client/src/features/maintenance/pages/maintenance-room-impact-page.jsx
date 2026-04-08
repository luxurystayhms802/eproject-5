import { AlertTriangle, Download, Printer, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMaintenanceOpenRequests } from '@/features/maintenance/hooks';
import { downloadCsv } from '@/lib/export-documents';
import { printManagementReportDocument } from '@/lib/print-documents';

export const MaintenanceRoomImpactPage = () => {
  const openQuery = useMaintenanceOpenRequests();
  const openRequests = openQuery.data ?? [];

  const roomLinked = openRequests.filter((item) => item.room?.roomNumber);
  const urgent = roomLinked.filter((item) => item.priority === 'urgent');
  const active = roomLinked.filter((item) => ['assigned', 'in_progress'].includes(item.status));

  const reportRows = roomLinked.map((item) => ({
    room: item.room?.roomNumber ?? 'n/a',
    issue_type: item.issueType,
    priority: item.priority,
    status: item.status,
    assigned_to: item.assignedTo?.fullName ?? 'unassigned',
    description: item.description,
  }));

  const handlePrint = () => {
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Maintenance',
      title: 'Room Impact Report',
      subtitle: 'Room-linked maintenance issues affecting hotel operations.',
      rangeLabel: new Date().toLocaleDateString(),
      metrics: [
        { label: 'Room-linked issues', value: String(roomLinked.length), helper: 'Requests tied to inventory' },
        { label: 'Urgent', value: String(urgent.length), helper: 'Immediate attention needed' },
        { label: 'Active work', value: String(active.length), helper: 'Assigned or in progress' },
      ],
      sections: [
        {
          title: 'Affected rooms',
          rows: roomLinked.slice(0, 10).map((item) => ({
            label: `Room ${item.room?.roomNumber ?? 'n/a'}`,
            value: item.status,
            helper: `${item.issueType} | ${item.priority}`,
          })),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Room Impact" description="Track maintenance issues that directly affect room availability and guest readiness.">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print report
          </Button>
          <Button variant="outline" onClick={() => downloadCsv('maintenance-room-impact.csv', reportRows)} disabled={reportRows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Room issues" value={String(roomLinked.length)} description="Inventory-linked requests" icon={Wrench} />
        <StatsCard title="Urgent" value={String(urgent.length)} description="High-severity blockers" icon={AlertTriangle} />
        <StatsCard title="Active work" value={String(active.length)} description="Assigned or in progress" icon={Wrench} />
      </div>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--primary)]">Affected rooms</h2>
        {openQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : roomLinked.length > 0 ? (
          <div className="grid gap-3">
            {roomLinked.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--primary)]">Room {item.room?.roomNumber}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] capitalize">{item.issueType}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge value={item.priority} />
                    <StatusBadge value={item.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No room-linked maintenance issues are open right now.
          </div>
        )}
      </Card>
    </div>
  );
};
