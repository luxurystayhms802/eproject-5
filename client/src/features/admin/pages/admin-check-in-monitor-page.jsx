import { useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, DoorOpen, KeyRound, Search, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  formatAdminCurrency,
  formatAdminDate,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import { validateCheckInDraft } from '@/features/admin/form-utils';
import { adminApi } from '@/features/admin/api';
import { useAdminCheckInReservation, useAdminReservations, useAssignReservationRoom, useAdminMarkReservationNoShow } from '@/features/admin/hooks';
import { getApiErrorMessage } from '@/lib/api-error';

const today = new Date();
const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, -1).toISOString();
const todayStartTime = new Date(startOfToday).getTime();
const MONITORED_STATUSES = new Set(['confirmed', 'checked_in']);

const defaultDraft = {
  idType: 'cnic',
  idNumber: '',
  arrivalNote: '',
  keyIssueNote: '',
  roomId: '',
};

const normalizeAssignableRoom = (room) => ({
  ...room,
  id: String(room?.id ?? room?._id ?? room?.roomId ?? ''),
  effectivePrice: Number(
    room?.effectivePrice ??
      room?.customPrice ??
      room?.roomType?.basePrice ??
      room?.roomTypeId?.basePrice ??
      0,
  ),
});

export const AdminCheckInMonitorPage = () => {
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState({});
  const [availabilityByReservation, setAvailabilityByReservation] = useState({});
  const [loadingAvailabilityId, setLoadingAvailabilityId] = useState(null);

  const arrivalsQuery = useAdminReservations({
    checkInTo: endOfToday,
    limit: 100,
  });
  const assignRoomMutation = useAssignReservationRoom();
  const checkInMutation = useAdminCheckInReservation();
  const markNoShowMutation = useAdminMarkReservationNoShow();

  const reservations = useMemo(
    () =>
      (arrivalsQuery.data ?? [])
        .filter((reservation) => MONITORED_STATUSES.has(reservation.status))
        .filter((reservation) => {
          const haystack = [
            reservation.reservationCode,
            getDisplayName(reservation.guest ?? reservation.guestProfileSnapshot),
            reservation.guest?.email,
            reservation.roomType?.name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(search.trim().toLowerCase());
        })
        .sort((left, right) => new Date(left.checkInDate).getTime() - new Date(right.checkInDate).getTime()),
    [arrivalsQuery.data, search],
  );

  const todaysReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        const reservationDay = new Date(reservation.checkInDate).toDateString();
        return reservationDay === today.toDateString();
      }),
    [reservations],
  );

  const overdueReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        const reservationTime = new Date(reservation.checkInDate).getTime();
        return reservation.status === 'confirmed' && reservationTime < todayStartTime;
      }),
    [reservations],
  );

  const checkedInTodayReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        if (reservation.status !== 'checked_in') {
          return false;
        }

        const referenceDate = reservation.checkedInAt ? new Date(reservation.checkedInAt) : new Date(reservation.checkInDate);
        return referenceDate.toDateString() === today.toDateString();
      }),
    [reservations],
  );

  const readyForCheckInReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'confirmed' && Boolean(reservation.room)),
    [reservations],
  );

  const pendingAssignmentReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'confirmed' && !reservation.room),
    [reservations],
  );

  const summary = useMemo(
    () => ({
      arrivals: todaysReservations.filter((reservation) => reservation.status === 'confirmed').length,
      checkedInToday: checkedInTodayReservations.length,
      overdue: overdueReservations.length,
      pendingAssignment: pendingAssignmentReservations.length,
      readyForCheckIn: readyForCheckInReservations.length,
    }),
    [checkedInTodayReservations.length, overdueReservations.length, pendingAssignmentReservations.length, readyForCheckInReservations.length, todaysReservations],
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

  const loadAvailableRooms = async (reservation) => {
    try {
      setLoadingAvailabilityId(reservation.id);
      const result = await adminApi.searchAvailability({
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        adults: reservation.adults,
        children: reservation.children,
        roomTypeId: reservation.roomTypeId,
      });
      const rooms = (result.availableRooms ?? [])
        .map((room) => normalizeAssignableRoom(room))
        .filter((room) => Boolean(room.id));
      setAvailabilityByReservation((current) => ({ ...current, [reservation.id]: rooms }));
      updateDraft(reservation.id, { roomId: rooms[0]?.id ?? '' });
      if (!rooms.length) {
        toast.error('No suitable rooms are currently available for this reservation.');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load available rooms.'));
    } finally {
      setLoadingAvailabilityId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check-In Monitor"
        description="Monitor today's confirmed arrivals, assign rooms where required, verify identity, and complete check-in from one admin control surface."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Arrivals today" value={String(summary.arrivals)} description="Confirmed reservations scheduled for today's arrival window." icon={BadgeCheck} />
        <StatsCard title="Checked in today" value={String(summary.checkedInToday)} description="Reservations already processed by admin or reception during today's arrival cycle." icon={DoorOpen} />
        <StatsCard title="Overdue arrivals" value={String(summary.overdue)} description="Confirmed reservations from earlier dates that still need front-desk processing." icon={AlertCircle} />
        <StatsCard title="Pending room" value={String(summary.pendingAssignment)} description="Confirmed arrivals still waiting for room assignment before check-in." icon={KeyRound} />
        <StatsCard title="Ready to process" value={String(summary.readyForCheckIn)} description="Reservations that can move straight into identity verification and key issue." icon={KeyRound} />
      </div>

      <AdminToolbar title="Arrival queue" description="Search today's arrivals, load suitable inventory, and complete the guest arrival workflow in sequence.">
        <label className="relative block w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            name="checkInSearch"
            className={`${adminInputClassName} pl-11`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reservation code, guest, or room type"
          />
        </label>
      </AdminToolbar>

      <div className="grid gap-4">
        {arrivalsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <Card key={index} className="h-64 animate-pulse bg-white/70" />)
        ) : reservations.length ? (
          reservations.map((reservation) => {
            const draft = drafts[reservation.id] ?? defaultDraft;
            const availableRooms = availabilityByReservation[reservation.id] ?? [];
            const isOverdue = new Date(reservation.checkInDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

            return (
              <Card key={reservation.id} className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={reservation.status} />
                      {reservation.room ? <StatusBadge value="assigned" /> : null}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">{reservation.reservationCode}</p>
                      <h2 className="mt-2 text-[30px] text-[var(--primary)] [font-family:var(--font-display)]">
                        {getDisplayName(reservation.guest ?? reservation.guestProfileSnapshot, 'Guest arrival')}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {reservation.roomType?.name ?? 'Room type'} | {formatAdminDate(reservation.checkInDate)} to {formatAdminDate(reservation.checkOutDate)}
                      </p>
                      {new Date(reservation.checkInDate).getTime() < todayStartTime ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                          Overdue arrival
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Room status</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--primary)]">
                        {reservation.room?.roomNumber ? `Room ${reservation.room.roomNumber}` : 'Assignment required'}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{reservation.room?.status ?? 'Not yet linked'}</p>
                    </div>
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Stay value</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{formatAdminCurrency(reservation.totalAmount)}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {reservation.adults} adults / {reservation.children} children
                      </p>
                    </div>
                  </div>
                </div>

                {reservation.status === 'checked_in' ? (
                  <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm text-emerald-800">
                    This guest has already completed check-in{reservation.checkedInAt ? ` on ${formatAdminDate(reservation.checkedInAt)}` : ''}. This monitor keeps the stay visible so the admin team can verify that front-desk processing has been completed.
                  </div>
                ) : !reservation.room ? (
                  <div className="space-y-4 rounded-[22px] border border-amber-200 bg-amber-50/90 p-4">
                    <div className="flex items-start gap-3 text-amber-900">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">This arrival still needs a room assignment.</p>
                        <p className="text-sm text-amber-800/90">
                          Load live inventory for the selected stay window, choose the best-fit room, then complete the arrival check.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[auto,1fr,auto]">
                      <Button type="button" variant="outline" onClick={() => loadAvailableRooms(reservation)} disabled={loadingAvailabilityId === reservation.id}>
                        <Search className="mr-2 h-4 w-4" />
                        {loadingAvailabilityId === reservation.id ? 'Loading rooms...' : 'Load available rooms'}
                      </Button>

                      <select
                        name={`availableRoom-${reservation.id}`}
                        className={adminSelectClassName}
                        value={draft.roomId}
                        onChange={(event) => updateDraft(reservation.id, { roomId: event.target.value })}
                        disabled={!availableRooms.length}
                      >
                        <option value="">Select available room</option>
                        {availableRooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            Room {room.roomNumber} | Floor {room.floor} | {formatAdminCurrency(room.effectivePrice)}
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          if (!draft.roomId) {
                            toast.error('Select an available room before assigning it.');
                            return;
                          }

                          assignRoomMutation.mutate({ reservationId: reservation.id, roomId: draft.roomId });
                        }}
                        disabled={!draft.roomId || assignRoomMutation.isPending}
                      >
                        <DoorOpen className="mr-2 h-4 w-4" />
                        {assignRoomMutation.isPending ? 'Assigning...' : 'Assign room'}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {reservation.status !== 'checked_in' ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className={adminLabelClassName}>
                        <span className={adminLabelTextClassName}>ID type</span>
                        <input
                          name={`idType-${reservation.id}`}
                          className={adminInputClassName}
                          value={draft.idType}
                          onChange={(event) => updateDraft(reservation.id, { idType: event.target.value })}
                        />
                      </label>
                      <label className={adminLabelClassName}>
                        <span className={adminLabelTextClassName}>ID number</span>
                        <input
                          name={`idNumber-${reservation.id}`}
                          className={adminInputClassName}
                          value={draft.idNumber}
                          onChange={(event) => updateDraft(reservation.id, { idNumber: event.target.value })}
                        />
                      </label>
                      <label className={adminLabelClassName}>
                        <span className={adminLabelTextClassName}>Arrival note</span>
                        <input
                          name={`arrivalNote-${reservation.id}`}
                          className={adminInputClassName}
                          value={draft.arrivalNote}
                          onChange={(event) => updateDraft(reservation.id, { arrivalNote: event.target.value })}
                        />
                      </label>
                      <label className={adminLabelClassName}>
                        <span className={adminLabelTextClassName}>Key issue note</span>
                        <input
                          name={`keyIssueNote-${reservation.id}`}
                          className={adminInputClassName}
                          value={draft.keyIssueNote}
                          onChange={(event) => updateDraft(reservation.id, { keyIssueNote: event.target.value })}
                        />
                      </label>
                    </div>

                    <div className="flex justify-end gap-3">
                      {isOverdue && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={markNoShowMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Mark ${reservation.reservationCode} as No-Show and release any assigned room?`)) {
                              markNoShowMutation.mutate(reservation.id);
                            }
                          }}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          {markNoShowMutation.isPending ? 'Marking...' : 'Mark as No-Show'}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const validationMessage = validateCheckInDraft(draft, Boolean(reservation.room));
                          if (validationMessage) {
                            toast.error(validationMessage);
                            return;
                          }

                          checkInMutation.mutate({
                            reservationId: reservation.id,
                            payload: {
                              roomId: reservation.room?.id ?? draft.roomId ?? undefined,
                              idType: draft.idType,
                              idNumber: draft.idNumber,
                              arrivalNote: draft.arrivalNote.trim() || null,
                              keyIssueNote: draft.keyIssueNote.trim() || null,
                            },
                          });
                        }}
                        disabled={(!reservation.room && !draft.roomId) || !draft.idNumber || checkInMutation.isPending}
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        {checkInMutation.isPending ? 'Checking in...' : 'Complete check-in'}
                      </Button>
                    </div>
                  </>
                ) : null}
              </Card>
            );
          })
        ) : (
          <Card className="space-y-3">
            <div className="flex items-center gap-3 text-[var(--primary)]">
              <BadgeCheck className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-xl font-semibold">No confirmed arrivals waiting</h2>
            </div>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              Confirmed reservations arriving today will appear here for room assignment, ID verification, and check-in completion.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
