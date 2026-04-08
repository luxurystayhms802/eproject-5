import { CheckCircle2, ClipboardList, Sparkles, TimerReset, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useHousekeepingBoard, useHousekeepingTasks } from '@/features/housekeeping/hooks';

const LoadingStack = ({ count = 4, className = 'h-20' }) => (
  <div className="grid gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className={`${className} animate-pulse rounded-2xl bg-white/70`} />
    ))}
  </div>
);

export const HousekeepingDashboardPage = () => {
  const tasksQuery = useHousekeepingTasks();
  const boardQuery = useHousekeepingBoard();

  const tasks = tasksQuery.data ?? [];
  const board = boardQuery.data;

  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const claimableTasks = tasks.filter((task) => !task.assignedToUserId).length;
  const assignedTasks = tasks.filter((task) => Boolean(task.assignedToUserId)).length;

  const coordinationRows = [
    {
      label: 'Visible task queue',
      value: tasks.length,
      description: 'Cleaning work currently visible to the active housekeeping team.',
    },
    {
      label: 'Claimable tasks',
      value: claimableTasks,
      description: 'Tasks not yet owned by a specific staff account and ready to be picked up.',
    },
    {
      label: 'Assigned tasks',
      value: assignedTasks,
      description: 'Tasks already attached to a housekeeping staff account.',
    },
    {
      label: 'Completed tasks',
      value: completedTasks,
      description: 'Finished work in the currently visible task list.',
    },
  ];

  const readinessRows = [
    { key: 'dirty', label: 'Dirty rooms', description: 'Rooms waiting for cleaning attention.' },
    { key: 'in_progress', label: 'In progress', description: 'Rooms actively moving through turnover.' },
    { key: 'inspected', label: 'Inspected', description: 'Rooms verified and nearly ready to release.' },
    { key: 'clean', label: 'Clean rooms', description: 'Rooms available for return to operations.' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Housekeeping Dashboard"
        description="Track cleaning workload, room readiness, and shared floor coverage from one clean service-floor workspace."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/housekeeping/tasks">
            <Button variant="secondary">Assigned tasks</Button>
          </Link>
          <Link to="/housekeeping/board">
            <Button variant="outline">Room board</Button>
          </Link>
          <Link to="/housekeeping/notifications">
            <Button variant="outline">Notifications</Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard title="Visible tasks" value={String(tasks.length)} description="Assigned or shared tasks in view" icon={ClipboardList} />
        <StatsCard title="Claimable" value={String(claimableTasks)} description="Unowned tasks ready to pick up" icon={Users2} />
        <StatsCard title="Dirty rooms" value={String(board?.counts?.dirty ?? 0)} description="Rooms waiting for cleaning" icon={Sparkles} />
        <StatsCard title="In progress" value={String(inProgressTasks)} description="Tasks actively being worked on" icon={TimerReset} />
        <StatsCard title="Completed" value={String(completedTasks)} description="Finished tasks in visible queue" icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Floor coordination</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Shared workload view for multiple housekeeping accounts operating across the same property.</p>
            </div>
            <Link to="/housekeeping/tasks">
              <Button variant="outline">Open tasks</Button>
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {coordinationRows.map((row) => (
              <div key={row.label} className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{row.label}</p>
                <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{row.value}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{row.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Room readiness</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Live board counts showing how quickly rooms are moving back to available status.</p>
            </div>
            <Link to="/housekeeping/board">
              <Button variant="outline">Open board</Button>
            </Link>
          </div>

          <div className="grid gap-3">
            {readinessRows.map((row) => (
              <div key={row.key} className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{row.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{row.description}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge value={row.key} />
                    <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{board?.counts?.[row.key] ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Task queue</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Cleaning tasks that housekeeping staff can start, continue, or complete.</p>
            </div>
            <Link to="/housekeeping/tasks">
              <Button variant="outline">Manage queue</Button>
            </Link>
          </div>

          {tasksQuery.isLoading ? (
            <LoadingStack />
          ) : tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="rounded-2xl border border-[var(--border)] bg-white/78 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--primary)]">
                        Room {task.room?.roomNumber ?? 'TBD'} | {task.taskType.replaceAll('_', ' ')}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {task.assignedTo?.fullName ? `Assigned to ${task.assignedTo.fullName}` : 'Shared queue item available for pickup'}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{task.notes ?? 'No notes attached'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge value={task.status} />
                      <StatusBadge value={task.priority} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No housekeeping tasks are assigned right now.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Release watch</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Rooms closest to returning into saleable inventory.</p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Inspected rooms</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{board?.counts?.inspected ?? 0}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Rooms that may be released as soon as no maintenance block remains.</p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Clean rooms</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{board?.counts?.clean ?? 0}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Rooms already restored and ready for front-desk reuse.</p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">In-progress rooms</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{board?.counts?.in_progress ?? 0}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Rooms currently under active cleaning by service-floor staff.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
