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
} from '@/features/reception/hooks';
import { validateReceptionServiceRequestForm } from '@/features/reception/utils';

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

  const [filters, setFilters] = useState({ status: '', requestType: '' });
  const [draft, setDraft] = useState(initialServiceDraft);
  const [statusDrafts, setStatusDrafts] = useState({});

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
        preferredTime: draft.preferredTime || null,
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
                value={draft.preferredTime}
                onChange={(event) => setDraft((current) => ({ ...current, preferredTime: event.target.value }))}
                placeholder="Immediately or 8:30 PM"
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
              {requests.map((request) => {
                const draftStatus = statusDrafts[request.id] ?? request.status;
                return (
                  <div
                    key={request.id}
                    className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-white/80 p-5 xl:grid-cols-[minmax(0,1.2fr)_auto]"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={request.status} />
                        <StatusBadge value={request.requestType} className="bg-slate-100 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="text-xl text-[var(--primary)] [font-family:var(--font-display)]">
                          {getDisplayName(request.reservation?.guest, 'Guest service')}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {request.reservation?.reservationCode ?? 'Reservation pending'} | Preferred {request.preferredTime || 'Immediate'}
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-[var(--muted-foreground)]">{request.description}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Created {formatReceptionDateTime(request.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 xl:min-w-[220px]">
                      <select
                        className={receptionFieldClassName}
                        name={`service-status-${request.id}`}
                        value={draftStatus}
                        onChange={(event) =>
                          setStatusDrafts((current) => ({ ...current, [request.id]: event.target.value }))
                        }
                        disabled={['completed', 'cancelled'].includes(request.status)}
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
                        disabled={updateRequestMutation.isPending || draftStatus === request.status || ['completed', 'cancelled'].includes(request.status)}
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
