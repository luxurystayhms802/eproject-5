import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Search, ShieldAlert, TimerReset, Wrench } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  MAINTENANCE_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  adminInputClassName,
  adminSelectClassName,
  adminTextAreaClassName,
  formatAdminDateTime,
  titleCase,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import {
  useAdminAssignMaintenanceRequest,
  useAdminCloseMaintenanceRequest,
  useAdminMaintenanceRequests,
  useAdminResolveMaintenanceRequest,
  useAdminStaff,
} from '@/features/admin/hooks';

export const AdminMaintenanceOverviewPage = () => {
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const [drafts, setDrafts] = useState({});

  const requestsQuery = useAdminMaintenanceRequests({
    search: filters.search || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    limit: 100,
  });
  const staffQuery = useAdminStaff({ limit: 100 });
  const assignRequest = useAdminAssignMaintenanceRequest();
  const resolveRequest = useAdminResolveMaintenanceRequest();
  const closeRequest = useAdminCloseMaintenanceRequest();

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('maintenance.update');

  const requests = requestsQuery.data ?? [];
  const maintenanceStaff = useMemo(
    () => (staffQuery.data ?? []).filter((staff) => staff.user?.role === 'maintenance' || staff.role === 'maintenance'),
    [staffQuery.data],
  );

  const summary = useMemo(
    () => ({
      open: requests.filter((request) => ['open', 'assigned', 'in_progress'].includes(request.status)).length,
      urgent: requests.filter((request) => request.priority === 'urgent' && !['closed', 'resolved'].includes(request.status)).length,
      assigned: requests.filter((request) => Boolean(request.assignedTo) && !['closed', 'resolved'].includes(request.status)).length,
      resolved: requests.filter((request) => ['resolved', 'closed'].includes(request.status)).length,
    }),
    [requests],
  );

  const updateDraft = (requestId, patch) => {
    setDrafts((current) => ({
      ...current,
      [requestId]: {
        assignedToUserId: current[requestId]?.assignedToUserId ?? '',
        resolutionNotes: current[requestId]?.resolutionNotes ?? '',
        ...patch,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Overview"
        description="Track urgent issues, assign work to the engineering desk, and close incidents once the operational block has been cleared."
      >
        <StatusBadge value={summary.urgent ? 'maintenance' : 'active'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Urgent issues {summary.urgent}
        </span>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Open requests" value={String(summary.open)} description="Issues still blocking rooms or waiting for maintenance action." icon={Wrench} />
        <StatsCard title="Urgent" value={String(summary.urgent)} description="High-severity incidents that can impact guest readiness or room sellability." icon={AlertTriangle} />
        <StatsCard title="Assigned" value={String(summary.assigned)} description="Requests already owned by a maintenance team member." icon={TimerReset} />
        <StatsCard title="Resolved" value={String(summary.resolved)} description="Requests already resolved or formally closed by operations." icon={ShieldAlert} />
      </div>

      <AdminToolbar
        title="Engineering queue"
        description="Filter maintenance pressure by search, severity, and lifecycle status, then assign or resolve work directly from admin operations."
      >
        <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className={`${adminInputClassName} pl-11`}
              placeholder="Search room, location, description, or issue type"
            />
          </label>

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All statuses</option>
            {MAINTENANCE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
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

      <div className="space-y-4">
        {requestsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <Card key={index} className="h-64 animate-pulse bg-white/70" />)
        ) : requests.length ? (
          requests.map((request) => {
            const draft = drafts[request.id] ?? {
              assignedToUserId: request.assignedToUserId ?? '',
              resolutionNotes: request.resolutionNotes ?? '',
            };

            return (
              <Card key={request.id} className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={request.priority} />
                      <StatusBadge value={request.status} />
                    </div>
                    <div>
                      <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">
                        {request.room?.roomNumber ? `Room ${request.room.roomNumber}` : request.locationLabel || 'General area'}
                      </h2>
                      <p className="mt-2 text-sm text-[var(--foreground)]">{titleCase(request.issueType)} | {request.description}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Reported {formatAdminDateTime(request.reportedAt)} | Reporter {getDisplayName(request.reportedBy, request.reportedBy?.email ?? 'System')}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[var(--border)] bg-white/82 px-4 py-4 xl:min-w-[260px]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">Current assignee</p>
                    <p className="mt-2 text-base font-semibold text-[var(--primary)]">{getDisplayName(request.assignedTo, 'Unassigned')}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{request.assignedTo?.email ?? 'Waiting for engineering ownership'}</p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_auto]">
                  <select
                    value={draft.assignedToUserId}
                    onChange={(event) => updateDraft(request.id, { assignedToUserId: event.target.value })}
                    className={adminSelectClassName}
                    disabled={!canUpdate || Boolean(request.assignedTo) || ['resolved', 'closed'].includes(request.status)}
                  >
                    <option value="">Select maintenance assignee</option>
                    {maintenanceStaff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {getDisplayName(member, member.email ?? member.employeeCode)}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={draft.resolutionNotes}
                    onChange={(event) => updateDraft(request.id, { resolutionNotes: event.target.value })}
                    className={`${adminTextAreaClassName} min-h-[56px]`}
                    placeholder="Resolution notes, root cause, or engineering handover details"
                    disabled={!canUpdate}
                  />

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl px-4"
                        onClick={() => assignRequest.mutate({ requestId: request.id, assignedToUserId: draft.assignedToUserId })}
                        disabled={!draft.assignedToUserId || assignRequest.isPending || Boolean(request.assignedTo) || ['resolved', 'closed'].includes(request.status)}
                      >
                        Assign
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-2xl px-4"
                        onClick={() => {
                          const notes = draft.resolutionNotes.trim();
                          if (!notes) {
                            toast.error('Please add resolution notes before resolving this request.');
                            return;
                          }
                          resolveRequest.mutate({ requestId: request.id, resolutionNotes: notes });
                        }}
                        disabled={['resolved', 'closed'].includes(request.status) || resolveRequest.isPending}
                      >
                        Resolve
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl px-4"
                        onClick={() => closeRequest.mutate(request.id)}
                        disabled={request.status === 'closed' || closeRequest.isPending}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">No maintenance requests found</h2>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              When guests or staff report maintenance issues, the requests will appear here for assignment, resolution, and closure.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
