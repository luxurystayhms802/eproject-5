import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCompleteHousekeepingTask, useHousekeepingTasks, useStartHousekeepingTask } from '@/features/housekeeping/hooks';
export const AssignedTasksPage = () => {
    const { data, isLoading } = useHousekeepingTasks();
    const startTask = useStartHousekeepingTask();
    const completeTask = useCompleteHousekeepingTask();
    const tasks = data ?? [];
    return (<div className="space-y-6">
      <PageHeader title="Assigned Tasks" description="Work through cleaning tasks, start room turnover, and close tasks once readiness is restored."/>
      <Card className="overflow-x-auto">
        {isLoading ? (<div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (<div key={index} className="h-16 animate-pulse rounded-2xl bg-white/70"/>))}
          </div>) : tasks.length > 0 ? (<table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              <tr>
                <th className="pb-4">Room</th>
                <th className="pb-4">Task</th>
                <th className="pb-4">Priority</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tasks.map((task) => (<tr key={task.id}>
                  <td className="py-4">Room {task.room?.roomNumber ?? 'TBD'}</td>
                  <td className="py-4 capitalize">{task.taskType.replaceAll('_', ' ')}</td>
                  <td className="py-4">
                    <StatusBadge value={task.priority}/>
                  </td>
                  <td className="py-4">
                    <StatusBadge value={task.status}/>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" disabled={task.status !== 'pending' || startTask.isPending} onClick={() => startTask.mutate(task.id)}>
                        Start
                      </Button>
                      <Button disabled={task.status !== 'in_progress' || completeTask.isPending} onClick={() => completeTask.mutate(task.id)}>
                        Complete
                      </Button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>) : (<div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No housekeeping tasks are assigned right now. New cleaning work will appear here after check-out or room-service turnover.
          </div>)}
      </Card>
    </div>);
};
