import { ClipboardCheck, Download, Printer, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useHousekeepingBoard, useHousekeepingTasks } from '@/features/housekeeping/hooks';
import { downloadCsv } from '@/lib/export-documents';
import { printManagementReportDocument } from '@/lib/print-documents';

export const HousekeepingShiftReportPage = () => {
  const tasksQuery = useHousekeepingTasks();
  const boardQuery = useHousekeepingBoard();

  const tasks = tasksQuery.data ?? [];
  const board = boardQuery.data;

  const completed = tasks.filter((task) => task.status === 'completed').length;
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
  const pending = tasks.filter((task) => task.status === 'pending').length;

  const reportRows = tasks.map((task) => ({
    room: task.room?.roomNumber ?? 'TBD',
    task_type: task.taskType,
    priority: task.priority,
    status: task.status,
    assigned_to: task.assignedTo?.fullName ?? 'shared queue',
    notes: task.notes ?? '',
  }));

  const handlePrint = () => {
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Housekeeping',
      title: 'Housekeeping Shift Report',
      subtitle: 'Task completion, room readiness, and release posture.',
      rangeLabel: new Date().toLocaleDateString(),
      metrics: [
        { label: 'Pending tasks', value: String(pending), helper: 'Waiting to start' },
        { label: 'In progress', value: String(inProgress), helper: 'Currently being handled' },
        { label: 'Completed', value: String(completed), helper: 'Closed during visible shift' },
        { label: 'Clean rooms', value: String(board?.counts?.clean ?? 0), helper: 'Ready for operations' },
      ],
      sections: [
        {
          title: 'Task queue',
          rows: tasks.slice(0, 8).map((task) => ({
            label: `Room ${task.room?.roomNumber ?? 'TBD'}`,
            value: task.status,
            helper: `${task.taskType.replaceAll('_', ' ')} | ${task.priority}`,
          })),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shift Report" description="Print or export the housekeeping shift summary.">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print report
          </Button>
          <Button variant="outline" onClick={() => downloadCsv('housekeeping-shift-report.csv', reportRows)} disabled={reportRows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Pending" value={String(pending)} description="Waiting to start" icon={Sparkles} />
        <StatsCard title="In progress" value={String(inProgress)} description="Live cleaning" icon={Sparkles} />
        <StatsCard title="Completed" value={String(completed)} description="Finished tasks" icon={ClipboardCheck} />
        <StatsCard title="Clean rooms" value={String(board?.counts?.clean ?? 0)} description="Ready for reuse" icon={ClipboardCheck} />
      </div>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--primary)]">Shift queue</h2>
        {tasksQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--primary)]">Room {task.room?.roomNumber ?? 'TBD'}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {task.taskType.replaceAll('_', ' ')} | {task.assignedTo?.fullName ?? 'Shared queue'}
                    </p>
                  </div>
                  <div className="text-right text-sm text-[var(--muted-foreground)]">
                    <p className="font-semibold capitalize text-[var(--primary)]">{task.status.replaceAll('_', ' ')}</p>
                    <p>{task.priority}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No housekeeping tasks are visible right now.
          </div>
        )}
      </Card>
    </div>
  );
};
