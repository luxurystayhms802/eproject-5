import { useMemo, useState } from 'react';
import { ConciergeBell, Search, Sparkles, TimerReset, UserRound } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  SERVICE_REQUEST_STATUS_OPTIONS,
  SERVICE_REQUEST_TYPE_OPTIONS,
  adminInputClassName,
  adminSelectClassName,
  formatAdminDateTime,
  titleCase,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import { useAdminServiceRequests, useAdminStaff, useAdminUpdateServiceRequest } from '@/features/admin/hooks';

const SUPPORTABLE_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'];

export const AdminServiceRequestsPage = () => {
  const [filters, setFilters] = useState({ search: '', status: '', requestType: '' });
  const [drafts, setDrafts] = useState({});

  const requestsQuery = useAdminServiceRequests({
    status: filters.status || undefined,
    requestType: filters.requestType || undefined,
    limit: 100,
  });
  const staffQuery = useAdminStaff({ limit: 100 });
  const updateRequest = useAdminUpdateServiceRequest();

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.role === 'super_admin';
  const canUpdate = isSuperAdmin || permissions.includes('serviceRequests.update');

  const requests = requestsQuery.data ?? [];
  const staff = useMemo(
    () => (staffQuery.data ?? []).filter((item) => SUPPORTABLE_ROLES.includes(item.user?.role ?? item.role)),
    [staffQuery.data],
  );

  const filteredRequests = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    if (!searchTerm) {
      return requests;
    }

    return requests.filter((request) => {
      const haystack = [
        request.requestType,
        request.description,
        request.status,
        getDisplayName(request.guest),
        request.guest?.email,
        request.reservation?.reservationCode,
        getDisplayName(request.assignedTo),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [filters.search, requests]);

  const summary = useMemo(
    () => ({
      total: filteredRequests.length,
      pending: filteredRequests.filter((request) => request.status === 'pending').length,
      inProgress: filteredRequests.filter((request) => request.status === 'in_progress').length,
      completed: filteredRequests.filter((request) => request.status === 'completed').length,
    }),
    [filteredRequests],
  );

  const updateDraft = (requestId, patch) => {
    setDrafts((current) => ({
      ...current,
      [requestId]: {
        status: current[requestId]?.status ?? '',
        assignedToUserId: current[requestId]?.assignedToUserId ?? '',
        ...patch,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Requests"
        description="Coordinate guest-facing requests across room service, laundry, transport, and in-stay support from one responsive admin operations board."
      >
        <StatusBadge value={summary.pending ? 'pending' : 'active'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Pending requests {summary.pending}
        </span>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Requests" value={String(summary.total)} description="Guest service requests visible inside the active admin queue." icon={ConciergeBell} />
        <StatsCard title="Pending" value={String(summary.pending)} description="Requests still waiting for ownership or a first operational action." icon={Sparkles} />
        <StatsCard title="In progress" value={String(summary.inProgress)} description="Requests already being fulfilled by the assigned support team." icon={TimerReset} />
        <StatsCard title="Completed" value={String(summary.completed)} description="Requests already closed after guest delivery or fulfillment." icon={UserRound} />
      </div>

      <AdminToolbar
        title="Guest request desk"
        description="Filter the live queue, assign requests to staff, and move guest-facing tasks through fulfillment with clean status control."
      >
        <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className={`${adminInputClassName} pl-11`}
              placeholder="Search guest, reservation code, request type, or assignee"
            />
          </label>

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All statuses</option>
            {SERVICE_REQUEST_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </select>

          <select
            value={filters.requestType}
            onChange={(event) => setFilters((current) => ({ ...current, requestType: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All request types</option>
            {SERVICE_REQUEST_TYPE_OPTIONS.map((requestType) => (
              <option key={requestType} value={requestType}>
                {titleCase(requestType)}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <div className="space-y-4">
        {requestsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Card key={index} className="h-52 animate-pulse bg-white/70" />)
        ) : filteredRequests.length ? (
          filteredRequests.map((request) => {
            const draft = drafts[request.id] ?? {
              status: request.status,
              assignedToUserId: request.assignedToUserId ?? '',
            };

            return (
              <Card key={request.id} className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={request.status} />
                      <span className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        {titleCase(request.requestType)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">
                        {getDisplayName(request.guest, request.guest?.email ?? 'Guest request')}
                      </h2>
                      <p className="mt-2 text-sm text-[var(--foreground)]">{request.description}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Reservation {request.reservation?.reservationCode ?? 'n/a'} | Preferred {formatAdminDateTime(request.preferredTime)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[var(--border)] bg-white/82 px-4 py-4 xl:min-w-[260px]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">Current assignee</p>
                    <p className="mt-2 text-base font-semibold text-[var(--primary)]">{getDisplayName(request.assignedTo, 'Unassigned')}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {request.assignedTo?.email ?? (['completed', 'cancelled'].includes(request.status) ? 'No assignee recorded' : 'Waiting for operational pickup')}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[240px_260px_auto]">
                  <select
                    value={draft.status}
                    onChange={(event) => updateDraft(request.id, { status: event.target.value })}
                    className={adminSelectClassName}
                    disabled={!canUpdate || ['completed', 'cancelled'].includes(request.status)}
                  >
                    {SERVICE_REQUEST_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {titleCase(status)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={draft.assignedToUserId}
                    onChange={(event) => updateDraft(request.id, { assignedToUserId: event.target.value })}
                    className={adminSelectClassName}
                    disabled={!canUpdate || ['completed', 'cancelled'].includes(request.status)}
                  >
                    <option value="">Unassigned</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {getDisplayName(member, member.email ?? member.employeeCode)}
                      </option>
                    ))}
                  </select>

                  <div className="flex justify-start xl:justify-end">
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-2xl px-5"
                        onClick={() =>
                          updateRequest.mutate({
                            requestId: request.id,
                            payload: {
                              status: draft.status,
                              assignedToUserId: draft.assignedToUserId || null,
                            },
                          })
                        }
                        disabled={updateRequest.isPending || ['completed', 'cancelled'].includes(request.status)}
                      >
                        Save update
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">No guest service requests found</h2>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              Guest requests will appear here once room service, laundry, housekeeping, or transport assistance is requested from active stays.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
