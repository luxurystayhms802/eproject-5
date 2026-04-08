import { AlertTriangle, ClipboardCheck, TimerReset, Users2, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMaintenanceHistory, useMaintenanceOpenRequests } from '@/features/maintenance/hooks';

const LoadingStack = ({ count = 4, className = 'h-20' }) => (
  <div className="grid gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className={`${className} animate-pulse rounded-2xl bg-white/70`} />
    ))}
  </div>
);

const extractId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.id ?? value._id ?? null;
};

export const MaintenanceDashboardPage = () => {
  const openQuery = useMaintenanceOpenRequests();
  const historyQuery = useMaintenanceHistory();
  const user = useAuthStore((state) => state.user);

  const openRequests = openQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const currentUserId = user?.id ?? user?._id ?? null;

  const urgentOpenRequests = openRequests.filter((item) => item.priority === 'urgent');
  const assignedRequests = openRequests.filter((item) => Boolean(extractId(item.assignedTo) || extractId(item.assignedToUserId)));
  const myAssignedRequests = openRequests.filter((item) => {
    const assignedId = extractId(item.assignedTo) || extractId(item.assignedToUserId);
    return Boolean(currentUserId && assignedId && assignedId === currentUserId);
  });
  const unassignedRequests = openRequests.filter((item) => !extractId(item.assignedTo) && !extractId(item.assignedToUserId));

  const dispatchRows = [
    {
      label: 'Urgent queue',
      value: urgentOpenRequests.length,
      description: 'High-priority incidents affecting room availability or guest comfort.',
    },
    {
      label: 'Assigned work',
      value: assignedRequests.length,
      description: 'Open requests already owned by an engineer or technician.',
    },
    {
      label: 'Assigned to me',
      value: myAssignedRequests.length,
      description: 'Current user workload across live unresolved requests.',
    },
    {
      label: 'Shared queue',
      value: unassignedRequests.length,
      description: 'Requests still waiting for ownership inside the maintenance team.',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Dashboard"
        description="Monitor urgent issues, team assignments, and resolution throughput from one clean engineering operations board."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/maintenance/requests">
            <Button variant="secondary">Open requests</Button>
          </Link>
          <Link to="/maintenance/history">
            <Button variant="outline">Resolution history</Button>
          </Link>
          <Link to="/maintenance/notifications">
            <Button variant="outline">Notifications</Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard title="Open requests" value={String(openRequests.length)} description="Issues needing active attention" icon={Wrench} />
        <StatsCard title="Urgent issues" value={String(urgentOpenRequests.length)} description="High-severity operational blockers" icon={AlertTriangle} />
        <StatsCard title="Assigned work" value={String(assignedRequests.length)} description="Requests already owned by staff" icon={TimerReset} />
        <StatsCard title="Shared queue" value={String(unassignedRequests.length)} description="Requests still unassigned" icon={Users2} />
        <StatsCard title="Resolved history" value={String(history.length)} description="Resolved or closed issues in dataset" icon={ClipboardCheck} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Team dispatch</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Shared maintenance workload for multiple technicians working with separate credentials.</p>
            </div>
            <Link to="/maintenance/requests">
              <Button variant="outline">Open queue</Button>
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {dispatchRows.map((row) => (
              <div key={row.label} className="rounded-[22px] border border-[var(--border)] bg-white/78 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{row.label}</p>
                <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{row.value}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{row.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Urgent escalation</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Critical incidents that may require immediate dispatch or closure coordination.</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-[var(--accent)]" />
          </div>

          {openQuery.isLoading ? (
            <LoadingStack />
          ) : urgentOpenRequests.length > 0 ? (
            <div className="space-y-3">
              {urgentOpenRequests.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/78 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--primary)]">
                        {item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.locationLabel ?? 'General area'}
                      </h3>
                      <p className="mt-1 text-sm capitalize text-[var(--muted-foreground)]">{item.issueType}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p>
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
              No urgent maintenance issues right now.
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Immediate attention queue</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Open requests that technicians can claim, resolve, or close through the request board.</p>
            </div>
            <Link to="/maintenance/requests">
              <Button variant="outline">Manage requests</Button>
            </Link>
          </div>

          {openQuery.isLoading ? (
            <LoadingStack count={5} />
          ) : openRequests.length > 0 ? (
            <div className="space-y-3">
              {openRequests.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/78 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--primary)]">
                        {item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.locationLabel ?? 'General area'} | {item.issueType}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {item.assignedTo?.fullName ? `Assigned to ${item.assignedTo.fullName}` : 'Waiting for technician assignment'}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p>
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
              No open maintenance issues right now.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Recently resolved</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Recently closed issues showing team throughput and technical closure pace.</p>
            </div>
            <Link to="/maintenance/history">
              <Button variant="outline">Open history</Button>
            </Link>
          </div>

          {historyQuery.isLoading ? (
            <LoadingStack />
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/78 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--primary)]">
                        {item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.locationLabel ?? 'General area'}
                      </h3>
                      <p className="mt-1 text-sm capitalize text-[var(--muted-foreground)]">{item.issueType}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{item.resolutionNotes ?? 'Resolved by maintenance team'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge value={item.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No resolved maintenance history is available yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
