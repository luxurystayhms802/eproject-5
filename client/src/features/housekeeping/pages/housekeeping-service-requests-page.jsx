import { useMemo, useState } from 'react';
import { BellRing, ClipboardList, ConciergeBell } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDisplayName } from '@/features/admin/display-utils';
import {
  formatReceptionDateTime,
  receptionFieldClassName,
  serviceRequestStatusOptions,
  serviceRequestTypeOptions,
} from '@/features/reception/config';
import {
  useHousekeepingServiceRequests,
  useUpdateHousekeepingServiceRequest,
} from '@/features/housekeeping/hooks';

export const HousekeepingServiceRequestsPage = () => {
  // Pass default filters so they only see housekeeping & laundry by default or maybe all are fine if they can filter
  // It's best they just see what's useful. We'll default to all and let them filter, but practically they'll use 'housekeeping'
  const requestsQuery = useHousekeepingServiceRequests();
  const updateRequestMutation = useUpdateHousekeepingServiceRequest();

  const [filters, setFilters] = useState({ status: '', requestType: '' });
  const [statusDrafts, setStatusDrafts] = useState({});

  const requests = useMemo(() => {
    const all = requestsQuery.data ?? [];
    return all.filter((request) => {
      const statusMatch = filters.status ? request.status === filters.status : true;
      const typeMatch = filters.requestType ? request.requestType === filters.requestType : true;
      return statusMatch && typeMatch;
    });
  }, [filters.requestType, filters.status, requestsQuery.data]);

  const summary = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.status === 'pending').length,
      active: requests.filter((item) => item.status === 'in_progress').length,
    }),
    [requests]
  );

  const groupedRequests = useMemo(() => {
    const groups = {};
    for (const req of requests) {
      const resId = req.reservation?.id || 'unlinked';
      if (!groups[resId]) {
        groups[resId] = {
          reservation: req.reservation,
          guest: req.guest,
          requests: [],
        };
      }
      groups[resId].requests.push(req);
    }
    return Object.values(groups);
  }, [requests]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Requests"
        description="View and action service requests created by guests or the front desk."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Requests" value={String(summary.total)} description="Visible requests" icon={ClipboardList} />
        <StatsCard title="Pending" value={String(summary.pending)} description="Waiting to start" icon={BellRing} />
        <StatsCard title="Active" value={String(summary.active)} description="Currently in progress" icon={ConciergeBell} />
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))_auto]">
            <select
              className={receptionFieldClassName}
              name="serviceStatusFilter"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              {serviceRequestStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className={receptionFieldClassName}
              name="serviceTypeFilter"
              value={filters.requestType}
              onChange={(event) => setFilters((current) => ({ ...current, requestType: event.target.value }))}
            >
              <option value="">All types</option>
              {serviceRequestTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button type="button" variant="outline" onClick={() => setFilters({ status: '', requestType: '' })}>
              Clear
            </Button>
          </div>

          {requestsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {groupedRequests.map((group) => (
                <div key={group.reservation?.id || 'unlinked'} className="space-y-3 rounded-xl border border-[rgba(16,36,63,0.06)] bg-slate-50/50 p-3 shadow-sm">
                  <div className="flex items-center gap-2 px-2 pt-1 pb-2 border-b border-[rgba(16,36,63,0.04)]">
                    <ConciergeBell className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                      {group.reservation ? `${group.reservation.room?.roomNumber ? `Room ${group.reservation.room.roomNumber} | ` : ''}${getDisplayName(group.guest, 'Guest')}` : 'Unlinked / General Requests'}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {group.requests.map((request) => {
                      const draftStatus = statusDrafts[request.id] ?? request.status;
                      const isCompleted = ['completed', 'cancelled'].includes(request.status);
                      
                      return (
                        <div
                          key={request.id}
                          className="grid gap-4 rounded-[20px] border border-[var(--border)] bg-white p-5 xl:grid-cols-[minmax(0,1.2fr)_auto]"
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge value={request.status} />
                              <StatusBadge value={request.requestType} className="bg-slate-100 text-slate-700" />
                            </div>
                            <div>
                              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Preferred timing: {request.preferredTime ? formatReceptionDateTime(request.preferredTime) : 'Immediate fulfillment'}
                              </p>
                            </div>
                            <p className="text-sm leading-6 font-medium text-[var(--primary)]">{request.description}</p>
                            <div className="flex flex-wrap items-center gap-4">
                              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] whitespace-nowrap">
                                Created {formatReceptionDateTime(request.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 xl:min-w-[220px]">
                            <select
                              className={receptionFieldClassName}
                              name={`service-status-${request.id}`}
                              value={draftStatus}
                              onChange={(event) =>
                                setStatusDrafts((current) => ({ ...current, [request.id]: event.target.value }))
                              }
                              disabled={isCompleted}
                            >
                              {serviceRequestStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            <Button
                              type="button"
                              variant="outline"
                              disabled={updateRequestMutation.isPending || isCompleted || draftStatus === request.status}
                              onClick={() =>
                                updateRequestMutation.mutate({
                                  requestId: request.id,
                                  payload: { status: draftStatus },
                                })
                              }
                            >
                              Save status
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No guest service requests found.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
