import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { validateGuestServiceRequestForm } from '@/features/guest/form-utils';
import { useCancelGuestReservation, useCancelGuestServiceRequest, useCreateGuestServiceRequest, useGuestServiceRequests } from '@/features/guest/hooks';
import { useGuestReservations } from '@/features/public/hooks';

const inputClassName = 'w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]';

const serviceRequestTypeOptions = [
  { value: 'room_service', label: 'Room service' },
  { value: 'wake_up_call', label: 'Wake-up call' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'transport', label: 'Transport' },
  { value: 'extra_bed', label: 'Extra bed' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'misc', label: 'Other request' },
];

const formatRequestType = (value) => serviceRequestTypeOptions.find((option) => option.value === value)?.label ?? value.replaceAll('_', ' ');

const getLocalISODateTime = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export const GuestServiceRequestsPage = () => {
  const reservationsQuery = useGuestReservations();
  const requestsQuery = useGuestServiceRequests();
  const createRequest = useCreateGuestServiceRequest();
  const cancelRequest = useCancelGuestServiceRequest();
  const cancelReservation = useCancelGuestReservation();

  const [reservationId, setReservationId] = useState('');
  const [requestType, setRequestType] = useState('room_service');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  const reservations = reservationsQuery.data ?? [];
  const eligibleReservations = useMemo(
    () => reservations.filter((item) => ['confirmed', 'checked_in'].includes(item.status)),
    [reservations],
  );
  const pendingReservations = useMemo(
    () => reservations.filter((reservation) => ['pending', 'confirmed'].includes(reservation.status)),
    [reservations],
  );

  const selectedReservation = useMemo(
    () => eligibleReservations.find((reservation) => reservation.id === reservationId),
    [eligibleReservations, reservationId],
  );

  const minDateTime = useMemo(() => getLocalISODateTime(new Date()), []);

  const maxDateTime = useMemo(() => {
    if (!selectedReservation || !selectedReservation.checkOutDate) return undefined;
    const maxDate = new Date(selectedReservation.checkOutDate);
    maxDate.setHours(23, 59, 0, 0);
    return getLocalISODateTime(maxDate);
  }, [selectedReservation]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationMessage = validateGuestServiceRequestForm(
      { reservationId, description },
      eligibleReservations.length > 0,
    );
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    createRequest.mutate(
      {
        reservationId,
        requestType,
        description: description.trim(),
        preferredTime: preferredTime ? new Date(preferredTime).toISOString() : null,
      },
      {
        onSuccess: () => {
          setReservationId('');
          setDescription('');
          setPreferredTime('');
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Requests"
        description="Request in-stay services, monitor fulfillment, and manage eligible upcoming bookings."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">New request</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Submit concierge, laundry, transport, or wake-up service requests for an eligible reservation.
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Reservation</span>
              <select className={inputClassName} name="reservationId" value={reservationId} onChange={(event) => setReservationId(event.target.value)}>
                <option value="">Select reservation</option>
                {eligibleReservations.map((reservation) => (
                  <option key={reservation.id} value={reservation.id}>
                    {reservation.reservationCode} | {reservation.roomType?.name ?? 'Stay'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--muted-foreground)]">
                {eligibleReservations.length > 0
                  ? 'Only confirmed or checked-in stays can receive guest service requests.'
                  : 'No eligible stays are currently available for new requests.'}
              </p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Request type</span>
              <select className={inputClassName} name="requestType" value={requestType} onChange={(event) => setRequestType(event.target.value)}>
                {serviceRequestTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Preferred time</span>
              <input
                className={inputClassName}
                name="preferredTime"
                type="datetime-local"
                min={minDateTime}
                max={maxDateTime}
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Description</span>
              <textarea
                className={`${inputClassName} min-h-28`}
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <Button type="submit" disabled={createRequest.isPending || eligibleReservations.length === 0}>
              {createRequest.isPending ? 'Submitting...' : 'Submit request'}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--primary)]">My requests</h2>

            {requestsQuery.isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
                ))}
              </div>
            ) : (requestsQuery.data ?? []).length > 0 ? (
              <div className="space-y-3">
                {(requestsQuery.data ?? []).map((request) => (
                  <div key={request.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold capitalize text-[var(--primary)]">{formatRequestType(request.requestType)}</h3>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{request.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge value={request.status} />
                        {request.status === 'pending' ? (
                          <Button variant="outline" disabled={cancelRequest.isPending} onClick={() => cancelRequest.mutate(request.id)}>
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
                No guest service requests have been submitted yet.
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--primary)]">Pending reservations</h2>

            {pendingReservations.length > 0 ? (
              <div className="space-y-3">
                {pendingReservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--primary)]">{reservation.reservationCode}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">{reservation.roomType?.name ?? 'Reservation'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge value={reservation.status} />
                        {reservation.status === 'pending' ? (
                          <Button variant="outline" disabled={cancelReservation.isPending} onClick={() => cancelReservation.mutate(reservation.id)}>
                            Cancel reservation
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
                No pending or confirmed reservations need action right now.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
