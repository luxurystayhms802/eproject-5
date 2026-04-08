import { useState } from 'react';
import { AlertCircle, BadgeCheck, DoorOpen, KeyRound, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { getDisplayName } from '@/features/admin/display-utils';
import { validateCheckInDraft } from '@/features/admin/form-utils';
import { receptionApi } from '@/features/reception/api';
import {
  idTypeOptions,
  receptionFieldClassName,
  receptionLabelClassName,
  receptionLabelTextClassName,
} from '@/features/reception/config';
import { useAssignRoom, useCheckInReservation, useConfirmedReservations } from '@/features/reception/hooks';

const defaultDraft = {
  idType: 'cnic',
  idNumber: '',
  arrivalNote: '',
  keyIssueNote: '',
  roomId: '',
};

const normalizeRoom = (room) => ({
  ...room,
  id: room.id ?? room._id ?? room.roomId ?? '',
  effectivePrice: room.effectivePrice ?? room.customPrice ?? room.roomType?.basePrice ?? 0,
});

export const CheckInDeskPage = () => {
  const confirmedReservationsQuery = useConfirmedReservations();
  const checkInMutation = useCheckInReservation();
  const assignRoomMutation = useAssignRoom();

  const [drafts, setDrafts] = useState({});
  const [availabilityByReservation, setAvailabilityByReservation] = useState({});
  const [loadingAvailabilityId, setLoadingAvailabilityId] = useState(null);

  const reservations = (confirmedReservationsQuery.data ?? []).sort(
    (left, right) => new Date(left.checkInDate).getTime() - new Date(right.checkInDate).getTime(),
  );

  const updateDraft = (reservationId, patch) => {
    setDrafts((current) => ({
      ...current,
      [reservationId]: {
        ...(current[reservationId] ?? defaultDraft),
        ...patch,
      },
    }));
  };

  const handleAssignRoom = (reservationId, roomId) => {
    if (!roomId) {
      toast.error('Select an available room before assigning it.');
      return;
    }

    assignRoomMutation.mutate({ reservationId, roomId });
  };

  const handleCheckIn = (reservation, draft) => {
    const validationMessage = validateCheckInDraft(draft, Boolean(reservation.room));
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    checkInMutation.mutate({
      reservationId: reservation.id,
      roomId: (reservation.room?.id ?? draft.roomId) || undefined,
      idType: draft.idType,
      idNumber: draft.idNumber.trim(),
      arrivalNote: draft.arrivalNote.trim(),
      keyIssueNote: draft.keyIssueNote.trim(),
    });
  };

  const loadAvailableRooms = async (reservation) => {
    try {
      setLoadingAvailabilityId(reservation.id);
      const rooms = await receptionApi.searchAvailableRooms({
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        adults: reservation.adults,
        children: reservation.children,
        roomTypeId: reservation.roomTypeId,
      });

      const normalizedRooms = (rooms ?? []).map(normalizeRoom);
      setAvailabilityByReservation((current) => ({ ...current, [reservation.id]: normalizedRooms }));
      updateDraft(reservation.id, { roomId: normalizedRooms[0]?.id ?? '' });

      if (normalizedRooms.length === 0) {
        toast.error('No matching rooms are open for this arrival.');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load available rooms.'));
    } finally {
      setLoadingAvailabilityId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Check-In Desk" description="Verify identity, assign rooms, and move arrivals into in-house status." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Confirmed arrivals</p>
          <p className="text-3xl font-semibold text-[var(--primary)]">{reservations.length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Assigned rooms</p>
          <p className="text-3xl font-semibold text-[var(--primary)]">{reservations.filter((reservation) => reservation.room).length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Pending room</p>
          <p className="text-3xl font-semibold text-[var(--primary)]">{reservations.filter((reservation) => !reservation.room).length}</p>
        </Card>
      </div>

      <div className="grid gap-4">
        {confirmedReservationsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <Card key={index} className="h-52 animate-pulse bg-white/70" />)
        ) : reservations.length > 0 ? (
          reservations.map((reservation) => {
            const draft = drafts[reservation.id] ?? defaultDraft;
            const availableRooms = availabilityByReservation[reservation.id] ?? [];

            return (
              <Card key={reservation.id} className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">{reservation.reservationCode}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--primary)]">
                      {getDisplayName(reservation.guest, 'Guest reservation')}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {reservation.roomType?.name ?? 'Room type'} | {new Date(reservation.checkInDate).toLocaleDateString()} to{' '}
                      {new Date(reservation.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={[
                      'rounded-full px-3 py-1 text-sm font-semibold',
                      reservation.room ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                    ].join(' ')}
                  >
                    {reservation.room ? `Room ${reservation.room.roomNumber}` : 'Room assignment required'}
                  </div>
                </div>

                {!reservation.room ? (
                  <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-medium">Room assignment is still pending.</p>
                        <p className="mt-1 text-amber-800/90">Load live inventory, pick a room, and assign it before check-in.</p>
                      </div>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[auto,1fr,auto]">
                      <Button type="button" variant="outline" onClick={() => loadAvailableRooms(reservation)} disabled={loadingAvailabilityId === reservation.id}>
                        <Search className="mr-2 h-4 w-4" />
                        {loadingAvailabilityId === reservation.id ? 'Loading rooms...' : 'Load rooms'}
                      </Button>

                      <select
                        className={receptionFieldClassName}
                        name={`room-${reservation.id}`}
                        value={draft.roomId}
                        onChange={(event) => updateDraft(reservation.id, { roomId: event.target.value })}
                        disabled={availableRooms.length === 0}
                      >
                        <option value="">Select an available room</option>
                        {availableRooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            Room {room.roomNumber} | Floor {room.floor} | ${Number(room.effectivePrice).toFixed(2)}
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        onClick={() => handleAssignRoom(reservation.id, draft.roomId)}
                        disabled={!draft.roomId || assignRoomMutation.isPending}
                      >
                        <DoorOpen className="mr-2 h-4 w-4" />
                        {assignRoomMutation.isPending ? 'Assigning...' : 'Assign room'}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className={receptionLabelClassName}>
                    <span className={receptionLabelTextClassName}>ID type</span>
                    <select
                      className={receptionFieldClassName}
                      name={`idType-${reservation.id}`}
                      value={draft.idType}
                      onChange={(event) => updateDraft(reservation.id, { idType: event.target.value })}
                    >
                      {idTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={receptionLabelClassName}>
                    <span className={receptionLabelTextClassName}>ID number</span>
                    <input
                      className={receptionFieldClassName}
                      name={`idNumber-${reservation.id}`}
                      value={draft.idNumber}
                      onChange={(event) => updateDraft(reservation.id, { idNumber: event.target.value })}
                    />
                  </label>

                  <label className={receptionLabelClassName}>
                    <span className={receptionLabelTextClassName}>Arrival note</span>
                    <input
                      className={receptionFieldClassName}
                      name={`arrivalNote-${reservation.id}`}
                      value={draft.arrivalNote}
                      onChange={(event) => updateDraft(reservation.id, { arrivalNote: event.target.value })}
                    />
                  </label>

                  <label className={receptionLabelClassName}>
                    <span className={receptionLabelTextClassName}>Key issue note</span>
                    <input
                      className={receptionFieldClassName}
                      name={`keyIssueNote-${reservation.id}`}
                      value={draft.keyIssueNote}
                      onChange={(event) => updateDraft(reservation.id, { keyIssueNote: event.target.value })}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    onClick={() => handleCheckIn(reservation, draft)}
                    disabled={(!reservation.room && !draft.roomId) || !draft.idNumber.trim() || checkInMutation.isPending}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    {checkInMutation.isPending ? 'Checking in...' : 'Complete check-in'}
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="space-y-3">
            <div className="flex items-center gap-3 text-[var(--primary)]">
              <BadgeCheck className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-xl font-semibold">No arrivals waiting</h2>
            </div>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">Confirmed arrivals will appear here for assignment and key issue.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
