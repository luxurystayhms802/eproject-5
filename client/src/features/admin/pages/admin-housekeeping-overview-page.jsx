import { useMemo, useState } from 'react';
import { CheckCircle2, Search, Sparkles, TimerReset, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  HOUSEKEEPING_TASK_STATUS_OPTIONS,
  HOUSEKEEPING_TASK_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  adminInputClassName,
  adminSelectClassName,
  formatAdminDateTime,
  titleCase,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import {
  useAdminCompleteHousekeepingTask,
  useAdminHousekeepingBoard,
  useAdminHousekeepingTasks,
  useAdminStartHousekeepingTask,
} from '@/features/admin/hooks';

const BOARD_KEYS = ['dirty', 'in_progress', 'inspected', 'clean'];

export const AdminHousekeepingOverviewPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    taskType: '',
    priority: '',
  });

  const tasksQuery = useAdminHousekeepingTasks({
    status: filters.status || undefined,
    taskType: filters.taskType || undefined,
    priority: filters.priority || undefined,
    limit: 100,
  });
  const boardQuery = useAdminHousekeepingBoard();
  const startTask = useAdminStartHousekeepingTask();
  const completeTask = useAdminCompleteHousekeepingTask();

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('housekeeping.update');

  const tasks = tasksQuery.data ?? [];
  const board = boardQuery.data;

  const filteredTasks = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    // Keep completed items out of the default queue unless explicitly requested
    const baseTasks = filters.status ? tasks : tasks.filter((task) => !['completed', 'cancelled'].includes(task.status));

    if (!searchTerm) {
      return baseTasks;
    }

    return baseTasks.filter((task) => {
      const haystack = [
        task.room?.roomNumber,
        task.taskType,
        task.status,
        task.priority,
        task.notes,
        getDisplayName(task.assignedTo),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [filters.search, filters.status, tasks]);

  const summary = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    
    // Create a list that respects search, but ignores the default "hide completed" rule for stats
    const searchFilteredTasks = searchTerm 
      ? tasks.filter((task) => {
          const haystack = [task.room?.roomNumber, task.taskType, task.status, task.priority, task.notes, getDisplayName(task.assignedTo)].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(searchTerm);
        })
      : tasks;

    return {
      total: filteredTasks.length,
      pending: searchFilteredTasks.filter((task) => ['pending', 'assigned'].includes(task.status)).length,
      inProgress: searchFilteredTasks.filter((task) => task.status === 'in_progress').length,
      completed: searchFilteredTasks.filter((task) => task.status === 'completed').length,
    };
  }, [filteredTasks.length, tasks, filters.search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Housekeeping Overview"
        description="Review cleaning workload, supervise room readiness, and trigger task movement before inventory pressure reaches the front desk."
      >
        <StatusBadge value={(board?.counts?.dirty ?? 0) > 0 ? 'pending' : 'clean'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Dirty rooms {board?.counts?.dirty ?? 0}
        </span>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Visible tasks" value={String(summary.total)} description="Housekeeping tasks visible under active admin filters." icon={Trash2} />
        <StatsCard title="Pending queue" value={String(summary.pending)} description="Tasks still awaiting start or manual assignment." icon={Sparkles} />
        <StatsCard title="In progress" value={String(summary.inProgress)} description="Rooms currently moving through cleaning execution." icon={TimerReset} />
        <StatsCard title="Completed" value={String(summary.completed)} description="Tasks already closed inside the current operating view." icon={CheckCircle2} />
      </div>

      <AdminToolbar
        title="Cleaning operations"
        description="Filter the task queue by status, type, and urgency, then move room turnover forward from one clean admin surface."
      >
        <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1.4fr)_200px_220px_200px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className={`${adminInputClassName} pl-11`}
              placeholder="Search room, staff member, task note, or status"
            />
          </label>

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All statuses</option>
            {HOUSEKEEPING_TASK_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </select>

          <select
            value={filters.taskType}
            onChange={(event) => setFilters((current) => ({ ...current, taskType: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All task types</option>
            {HOUSEKEEPING_TASK_TYPE_OPTIONS.map((taskType) => (
              <option key={taskType} value={taskType}>
                {titleCase(taskType)}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {titleCase(priority)}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Task queue</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Admin visibility into checkout cleaning, inspections, and active room turnover tasks.</p>
            </div>
            <StatusBadge value={summary.pending ? 'pending' : 'clean'} />
          </div>

          <div className="space-y-3">
            {tasksQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-[20px] bg-white/70" />)
            ) : filteredTasks.length ? (
              filteredTasks.map((task) => (
                <div key={task.id} className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={task.status} />
                        <StatusBadge value={task.priority} />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--primary)]">
                        Room {task.room?.roomNumber ?? 'TBD'} | {titleCase(task.taskType)}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">{task.notes || 'No housekeeping notes attached to this task.'}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Assigned to {getDisplayName(task.assignedTo, 'Unassigned')} | Scheduled {formatAdminDateTime(task.scheduledFor)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {canUpdate && (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl px-4"
                          onClick={() => startTask.mutate(task.id)}
                          disabled={['in_progress', 'completed', 'cancelled'].includes(task.status) || startTask.isPending}
                        >
                          Start
                        </Button>
                      )}
                      {canUpdate && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-2xl px-4"
                          onClick={() => completeTask.mutate(task.id)}
                          disabled={['completed', 'cancelled'].includes(task.status) || completeTask.isPending}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No housekeeping tasks match the active admin filters.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Readiness board</h2>
            <p className="text-sm text-[var(--muted-foreground)]">A compact room-state summary showing how close the floor is to being guest-ready again.</p>
          </div>

          <div className="grid gap-3">
            {BOARD_KEYS.map((key) => (
              <div key={key} className="rounded-[20px] border border-[var(--border)] bg-white/78 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">{titleCase(key)}</p>
                    <p className="mt-2 text-[30px] text-[var(--primary)] [font-family:var(--font-display)]">{board?.counts?.[key] ?? 0}</p>
                  </div>
                  <StatusBadge value={key} />
                </div>

                {(board?.groups?.[key] ?? []).length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(board?.groups?.[key] ?? []).slice(0, 6).map((room) => (
                      <span
                        key={room.id}
                        className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white px-3 py-1 text-xs font-semibold text-[var(--primary)]"
                      >
                        Room {room.roomNumber}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[var(--muted-foreground)]">No rooms are currently grouped in this state.</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
