import { useMemo, useState } from 'react';
import { BellRing, ClipboardList, ConciergeBell } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDisplayName } from '@/features/admin/display-utils';
import {
  formatReceptionDateTime,
  receptionFieldClassName,
  receptionLabelClassName,
  receptionLabelTextClassName,
  receptionTextAreaClassName,
  serviceRequestStatusOptions,
  serviceRequestTypeOptions,
} from '@/features/reception/config';
import {
  useCheckedInReservations,
  useConfirmedReservations,
  useCreateReceptionServiceRequest,
  useReceptionServiceRequests,
  useUpdateReceptionServiceRequest,
  useReceptionUsers,
} from '@/features/reception/hooks';
import { validateReceptionServiceRequestForm } from '@/features/reception/utils';

const getLocalISODateTime = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const SUPPORTABLE_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'];

const initialServiceDraft = {
  reservationId: '',
  requestType: 'room_service',
  preferredTime: '',
  description: '',
};

export const GuestServicesPage = () => {
  const checkedInQuery = useCheckedInReservations();
  const confirmedQuery = useConfirmedReservations();
  const requestsQuery = useReceptionServiceRequests();
  const createRequestMutation = useCreateReceptionServiceRequest();
  const updateRequestMutation = useUpdateReceptionServiceRequest();
  const usersQuery = useReceptionUsers({ limit: 100 });

  const staff = useMemo(
    () => (usersQuery.data ?? []).filter((item) => SUPPORTABLE_ROLES.includes(item.role)),
    [usersQuery.data],
  );

  const [filters, setFilters] = useState({ status: '', requestType: '' });
  const [draft, setDraft] = useState(initialServiceDraft);
  const [drafts, setDrafts] = useState({});

  const updateDraft = (requestId, patch) => {
    setDrafts((current) => ({
      ...current,
      [requestId]: { ...(current[requestId] || {}), ...patch },
    }));
  };

  const eligibleReservations = useMemo(() => {
    const merged = [...(checkedInQuery.data ?? []), ...(confirmedQuery.data ?? [])];
    const seen = new Set();
    return merged.filter((reservation) => {
      if (!reservation?.id || seen.has(reservation.id)) {
        return false;
      }
      seen.add(reservation.id);
      return true;
    });
  }, [checkedInQuery.data, confirmedQuery.data]);

  const selectedReservation = useMemo(
    () => eligibleReservations.find((res) => res.id === draft.reservationId),
    [eligibleReservations, draft.reservationId],
  );

  const minDateTime = useMemo(() => getLocalISODateTime(new Date()), []);

  const maxDateTime = useMemo(() => {
    if (!selectedReservation || !selectedReservation.checkOutDate) return undefined;
    const maxDate = new Date(selectedReservation.checkOutDate);
    maxDate.setHours(23, 59, 0, 0);
    return getLocalISODateTime(maxDate);
  }, [selectedReservation]);

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
      eligible: eligibleReservations.length,
    }),
    [eligibleReservations.length, requests],
  );

  const groupedRequests = useMemo(() => {
    const groups = {};
    for (const req of requests) {
      const resId = req.reservationId || 'unlinked';
      if (!groups[resId]) {
        groups[resId] = {
          id: resId,
          reservation: req.reservation,
          guest: req.guest,
          requests: [],
        };
      }
      groups[resId].requests.push(req);
    }
    return Object.values(groups);
  }, [requests]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateReceptionServiceRequestForm(draft);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      await createRequestMutation.mutateAsync({
        reservationId: draft.reservationId,
        requestType: draft.requestType,
        preferredTime: draft.preferredTime ? new Date(draft.preferredTime).toISOString() : null,
        description: draft.description.trim(),
      });
      setDraft(initialServiceDraft);
    } catch {
      // toast handled in mutation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Services"
        description="Track front-desk service requests, dispatch updates, and keep guest support moving."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Requests" value={String(summary.total)} description="Visible support tickets" icon={ClipboardList} />
        <StatsCard title="Pending" value={String(summary.pending)} description="Waiting to start" icon={BellRing} />
        <StatsCard title="Active" value={String(summary.active)} description="Currently in progress" icon={ConciergeBell} />
        <StatsCard title="Eligible stays" value={String(summary.eligible)} description="Confirmed or in-house" icon={ConciergeBell} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Raise a service request</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Use live reservations so requests stay linked to the correct guest and folio.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Reservation</span>
              <select
                className={receptionFieldClassName}
                name="reservationId"
                value={draft.reservationId}
                onChange={(event) => setDraft((current) => ({ ...current, reservationId: event.target.value }))}
              >
                <option value="">Select reservation</option>
                {eligibleReservations.map((reservation) => (
                  <option key={reservation.id} value={reservation.id}>
                    {getDisplayName(reservation.guest, 'Guest')} | {reservation.reservationCode}
                  </option>
                ))}
              </select>
            </label>

            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Service type</span>
              <select
                className={receptionFieldClassName}
                name="requestType"
                value={draft.requestType}
                onChange={(event) => setDraft((current) => ({ ...current, requestType: event.target.value }))}
              >
                {serviceRequestTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Preferred time</span>
              <input
                className={receptionFieldClassName}
                name="preferredTime"
                type="datetime-local"
                min={minDateTime}
                max={maxDateTime}
                value={draft.preferredTime}
                onChange={(event) => setDraft((current) => ({ ...current, preferredTime: event.target.value }))}
              />
            </label>

            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Description</span>
              <textarea
                className={receptionTextAreaClassName}
                name="description"
                rows={5}
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <div className="flex justify-end">
              <Button type="submit" variant="secondary" disabled={createRequestMutation.isPending}>
                Create request
              </Button>
            </div>
          </form>
        </Card>

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
            <div className="space-y-3">
              {groupedRequests.map((group) => (
                <div key={group.id} className="space-y-3 rounded-xl border border-[rgba(16,36,63,0.06)] bg-white/40 p-3 shadow-sm">
                  <div className="flex items-center gap-2 px-2 pt-1 pb-2 border-b border-[rgba(16,36,63,0.04)]">
                    <ConciergeBell className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                      {group.reservation ? `${group.reservation.room?.roomNumber ? `Room ${group.reservation.room.roomNumber} | ` : ''}${getDisplayName(group.guest, 'Guest')} (${group.reservation.reservationCode})` : 'Unlinked / General Requests'}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {group.requests.map((request) => {
                      const requestDraft = drafts[request.id] ?? {
                        status: request.status,
                        assignedToUserId: request.assignedToUserId ?? '',
                      };
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
                              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                                Assigned to: <strong className="font-semibold text-[var(--primary)]">{getDisplayName(request.assignedTo, 'Unassigned')}</strong>
                              </p>
                              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] border-l border-slate-200 pl-4">
                                Created {formatReceptionDateTime(request.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 xl:min-w-[220px]">
                            <select
                              className={receptionFieldClassName}
                              value={requestDraft.status}
                              onChange={(event) => updateDraft(request.id, { status: event.target.value })}
                              disabled={['completed', 'cancelled'].includes(request.status)}
                            >
                              {serviceRequestStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            
                            <select
                              className={receptionFieldClassName}
                              value={requestDraft.assignedToUserId}
                              onChange={(event) => updateDraft(request.id, { assignedToUserId: event.target.value })}
                              disabled={['completed', 'cancelled'].includes(request.status)}
                            >
                              <option value="">Unassigned</option>
                              {staff.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {getDisplayName(member, member.email)}
                                </option>
                              ))}
                            </select>

                            <Button
                              type="button"
                              variant="outline"
                              disabled={
                                updateRequestMutation.isPending || 
                                (requestDraft.status === request.status && requestDraft.assignedToUserId === (request.assignedToUserId ?? '')) || 
                                ['completed', 'cancelled'].includes(request.status)
                              }
                              onClick={() =>
                                updateRequestMutation.mutate({
                                  requestId: request.id,
                                  payload: { status: requestDraft.status, assignedToUserId: requestDraft.assignedToUserId || null },
                                })
                              }
                            >
                              Save update
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
              No service requests match the current filters.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
