import { useState, useEffect, useMemo } from 'react';
import { CalendarClock, ClipboardList, Hotel, Pencil, Plus, Search, UserMinus, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { useAuthStore } from '@/app/store/auth-store';
import { getDisplayName } from '@/features/admin/display-utils';
import { validateAdminReservationForm } from '@/features/admin/form-utils';
import { useHotelSettings } from '@/features/public/hooks';
import { formatTimeFromSettings } from '@/features/public/utils';
import {
  bookingSourceOptions,
  formatReceptionCurrency,
  formatReceptionDate,
  formatReceptionDateTime,
  receptionFieldClassName,
  receptionLabelClassName,
  receptionLabelTextClassName,
  receptionTextAreaClassName,
} from '@/features/reception/config';
import { receptionApi } from '@/features/reception/api';
import {
  useAmendReceptionStay,
  useAssignRoom,
  useCancelReceptionReservation,
  useConfirmReceptionReservation,
  useCreateReceptionReservation,
  useMarkReservationMissedArrival,
  useReceptionGuests,
  useReceptionReservations,
  useReceptionRoomTypes,
  useUpdateReceptionReservation,
} from '@/features/reception/hooks';
import {
  buildReceptionReservationPayload,
  calculateReceptionStayNights,
  createReceptionReservationForm,
  mapReservationToReceptionForm,
} from '@/features/reception/utils';
import { getApiErrorMessage } from '@/lib/api-error';

const getTodayString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const reservationStatusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'cancelled', label: 'Cancelled' },
];

const initialFilters = {
  search: '',
  status: '',
  bookingSource: '',
};

const normalizeRoom = (room) => ({
  ...room,
  id: room.id ?? room._id ?? room.roomId ?? '',
  roomTypeId:
    typeof room.roomTypeId === 'object'
      ? room.roomTypeId.id ?? room.roomTypeId._id ?? room.roomType?.id ?? ''
      : room.roomTypeId ?? room.roomType?.id ?? '',
  effectivePrice:
    room.effectivePrice ??
    room.customPrice ??
    room.roomType?.basePrice ??
    0,
});

const dedupeById = (items) => {
  const seen = new Set();
  return items.filter((item, index) => {
    const key = String(item?.id ?? item?._id ?? item?.roomNumber ?? index);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const ReservationDeskPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [amendModalOpen, setAmendModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [amendingReservation, setAmendingReservation] = useState(null);
  const [form, setForm] = useState(createReceptionReservationForm());
  const [amendForm, setAmendForm] = useState({ checkOutDate: '', notes: '' });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('reservations.update');
  const canConfirm = isAdmin || permissions.includes('reservations.confirm');
  const canAssignRoom = isAdmin || permissions.includes('reservations.assignRoom');
  const canCancel = isAdmin || permissions.includes('reservations.cancel');
  const canCreate = isAdmin || permissions.includes('reservations.create');

  const reservationsQuery = useReceptionReservations({
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    bookingSource: filters.bookingSource || undefined,
  });
  const guestsQuery = useReceptionGuests();
  const roomTypesQuery = useReceptionRoomTypes();
  const hotelSettingsQuery = useHotelSettings();

  const defaultCheckInTime = formatTimeFromSettings(hotelSettingsQuery.data?.checkInTime);

  const createReservation = useCreateReceptionReservation();
  const updateReservation = useUpdateReceptionReservation();
  const amendReservation = useAmendReceptionStay();
  const assignReservationRoom = useAssignRoom();
  const confirmReservation = useConfirmReceptionReservation();
  const cancelReservation = useCancelReceptionReservation();
  const markMissedArrivalMutation = useMarkReservationMissedArrival();

  const reservations = reservationsQuery.data ?? [];
  const guests = guestsQuery.data ?? [];
  const roomTypes = roomTypesQuery.data ?? [];

  const nights = calculateReceptionStayNights(form.checkInDate, form.checkOutDate);
  const isAvailabilityReady =
    modalOpen &&
    Boolean(form.checkInDate) &&
    Boolean(form.checkOutDate) &&
    Number(form.adults) >= 1 &&
    Number(form.children) >= 0 &&
    nights > 0;

  useEffect(() => {
    let cancelled = false;

    if (modalOpen && form.checkInDate && form.checkOutDate && nights <= 0) {
      setAvailableRooms([]);
      setAvailabilityLoading(false);
      setAvailabilityError('Your check-out date must be at least one day after your check-in date.');
      return () => {
        cancelled = true;
      };
    }

    if (!isAvailabilityReady) {
      setAvailableRooms([]);
      setAvailabilityLoading(false);
      setAvailabilityError(
        modalOpen ? 'Select stay dates and occupancy to load matching rooms.' : '',
      );
      return () => {
        cancelled = true;
      };
    }

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError('');

      try {
        const rooms = await receptionApi.searchAvailableRooms({
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          adults: Number(form.adults),
          children: Number(form.children),
          ...(editingReservation ? { excludeReservationId: editingReservation.id } : {}),
        });

        if (cancelled) {
          return;
        }

        const normalizedRooms = dedupeById((rooms ?? []).map(normalizeRoom));
        setAvailableRooms(normalizedRooms);

        if (normalizedRooms.length === 0) {
          setAvailabilityError('No rooms are available for the selected dates and occupancy.');
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAvailableRooms([]);
        setAvailabilityError(getApiErrorMessage(error, 'Unable to load available rooms right now.'));
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    };

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [editingReservation, form.adults, form.checkInDate, form.checkOutDate, form.children, isAvailabilityReady, modalOpen]);

  useEffect(() => {
    if (!form.roomId) {
      return;
    }

    const stillAvailable = availableRooms.some((room) => String(room.id) === String(form.roomId));
    if (!stillAvailable) {
      setForm((current) => ({ ...current, roomId: '' }));
    }
  }, [availableRooms, form.roomId]);

  const activeFilters = useMemo(
    () =>
      [
        filters.search ? `Search: ${filters.search}` : null,
        filters.status ? `Status: ${filters.status}` : null,
        filters.bookingSource ? `Source: ${filters.bookingSource}` : null,
      ].filter(Boolean),
    [filters.bookingSource, filters.search, filters.status],
  );

  const summary = useMemo(() => {
    const today = new Date();
    return {
      total: reservations.length,
      confirmed: reservations.filter((reservation) => reservation.status === 'confirmed').length,
      arrivalsToday: reservations.filter(
        (reservation) => new Date(reservation.checkInDate).toDateString() === today.toDateString(),
      ).length,
      unassigned: reservations.filter(
        (reservation) => ['pending', 'confirmed'].includes(reservation.status) && !reservation.roomId,
      ).length,
    };
  }, [reservations]);

  const roomTypeOptions = useMemo(() => {
    const availableTypeIds = new Set(availableRooms.map((room) => String(room.roomTypeId)));

    return roomTypes.map((roomType) => ({
      ...roomType,
      isSelectable: isAvailabilityReady ? availableTypeIds.has(String(roomType.id)) : true,
    }));
  }, [availableRooms, isAvailabilityReady, roomTypes]);

  const selectedRoomType = roomTypes.find((roomType) => String(roomType.id) === String(form.roomTypeId)) ?? null;
  const filteredRooms = useMemo(
    () =>
      availableRooms.filter((room) => {
        if (!form.roomTypeId) {
          return true;
        }

        return String(room.roomTypeId) === String(form.roomTypeId);
      }),
    [availableRooms, form.roomTypeId],
  );

  const estimatedRate = Number(
    filteredRooms.find((room) => String(room.id) === String(form.roomId))?.effectivePrice ??
      selectedRoomType?.basePrice ??
      0,
  );
  const estimatedTotal = nights > 0 && estimatedRate > 0
    ? Number((estimatedRate * nights - Number(form.discountAmount || 0)).toFixed(2))
    : null;

  const resetModal = () => {
    setEditingReservation(null);
    setForm(createReceptionReservationForm(''));
    setAvailableRooms([]);
    setAvailabilityError('');
    setModalOpen(false);
  };

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningReservation, setAssigningReservation] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [assignError, setAssignError] = useState('');
  
  const openAssignModal = async (reservation) => {
    setAssigningReservation(reservation);
    setSelectedRoomId('');
    setAssignError('');
    setAssignModalOpen(true);
    
    setAvailabilityLoading(true);
    try {
      const rooms = await receptionApi.searchAvailableRooms({
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        adults: reservation.adults,
        children: reservation.children,
      });
      const validRooms = dedupeById((rooms ?? []).map(normalizeRoom).filter(r => !reservation.roomTypeId || String(r.roomTypeId) === String(reservation.roomTypeId)));
      setAvailableRooms(validRooms);
      if (validRooms.length > 0) {
        setSelectedRoomId(validRooms[0].id);
      } else {
        setAssignError('No available rooms match this reservation.');
      }
    } catch {
      setAssignError('Failed to load available rooms.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleAssignRoom = async (event) => {
    event?.preventDefault();
    if (!assigningReservation || !selectedRoomId) {
      toast.error('Select a room first.');
      return;
    }
    try {
      await assignReservationRoom.mutateAsync({
        reservationId: assigningReservation.id,
        roomId: selectedRoomId,
      });
      setAssignModalOpen(false);
      setAssigningReservation(null);
    } catch {}
  };

  const openCreateModal = () => {
    setEditingReservation(null);
    setForm(createReceptionReservationForm(''));
    setAvailableRooms([]);
    setAvailabilityError('');
    setModalOpen(true);
  };

  const openEditModal = (reservation) => {
    setEditingReservation(reservation);
    setForm(mapReservationToReceptionForm(reservation));
    setAvailableRooms([]);
    setAvailabilityError('');
    setModalOpen(true);
  };

  const openAmendModal = (reservation) => {
    setAmendingReservation(reservation);
    setAmendForm({
      checkOutDate: formatReceptionDate(reservation.checkOutDate, 'yyyy-MM-dd'),
      notes: '',
    });
    setAmendModalOpen(true);
  };

  const handleAmendSubmit = async (event) => {
    event.preventDefault();
    if (!amendForm.checkOutDate) {
      toast.error('Select a new check-out date');
      return;
    }
    
    try {
      await amendReservation.mutateAsync({
        reservationId: amendingReservation.id,
        payload: {
          checkOutDate: amendForm.checkOutDate,
          notes: amendForm.notes || undefined,
        },
      });
      setAmendModalOpen(false);
      setAmendingReservation(null);
    } catch {
      // Handled by mutation
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateAdminReservationForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    if (isAvailabilityReady && form.roomTypeId) {
      const validRoomType = roomTypeOptions.find((roomType) => String(roomType.id) === String(form.roomTypeId));
      if (!validRoomType?.isSelectable) {
        toast.error('Select a room category with live availability for the current stay details.');
        return;
      }
    }

    const payload = buildReceptionReservationPayload(form);

    try {
      if (editingReservation) {
        await updateReservation.mutateAsync({
          reservationId: editingReservation.id,
          payload,
        });
      } else {
        await createReservation.mutateAsync(payload);
      }

      resetModal();
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reservation Desk" description="Create, adjust, confirm, and cancel front-desk bookings.">
        <div className="flex flex-wrap gap-3">
          {canCreate && (
            <Button variant="secondary" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              New reservation
            </Button>
          )}
          {canCreate && (
            <Link to="/reception/walk-ins">
              <Button variant="outline">Walk-in booking</Button>
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Reservations" value={String(summary.total)} description="Visible desk records" icon={ClipboardList} />
        <StatsCard title="Confirmed" value={String(summary.confirmed)} description="Arrival-ready bookings" icon={CalendarClock} />
        <StatsCard title="Arrivals today" value={String(summary.arrivalsToday)} description="Due today" icon={CalendarClock} />
        <StatsCard title="Pending room" value={String(summary.unassigned)} description="Need allocation" icon={Search} />
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.5fr))_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              className={`${receptionFieldClassName} pl-11`}
              name="reservation-search"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search reservation, guest, email, or phone"
            />
          </label>

          <select
            className={receptionFieldClassName}
            name="reservation-status-filter"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            {reservationStatusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className={receptionFieldClassName}
            name="reservation-source-filter"
            value={filters.bookingSource}
            onChange={(event) => setFilters((current) => ({ ...current, bookingSource: event.target.value }))}
          >
            <option value="">All sources</option>
            {bookingSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={() => setFilters(initialFilters)}>
            Clear
          </Button>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm text-[var(--muted-foreground)]">
          {activeFilters.length > 0 ? activeFilters.join(' | ') : `Viewing ${reservations.length} reservation${reservations.length === 1 ? '' : 's'}.`}
        </div>
      </Card>

      <Card className="space-y-4">
        {reservationsQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : reservations.length > 0 ? (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-white/78 p-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(240px,0.8fr)_auto]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={reservation.status} />
                    <StatusBadge value={reservation.bookingSource} className="bg-slate-100 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--accent-strong)]">{reservation.reservationCode}</p>
                    <h3 className="mt-2 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{getDisplayName(reservation.guest, 'Reservation')}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {reservation.roomType?.name ?? 'Room type'} | {formatReceptionDate(reservation.checkInDate)} to {formatReceptionDate(reservation.checkOutDate)}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
                    <span>Guests: <strong className="font-semibold text-[var(--primary)]">{reservation.adults}A / {reservation.children}C</strong></span>
                    <span>Room: <strong className="font-semibold text-[var(--primary)]">{reservation.room?.roomNumber ? `Room ${reservation.room.roomNumber}` : 'Pending'}</strong></span>
                    <span>Nights: <strong className="font-semibold text-[var(--primary)]">{reservation.nights}</strong></span>
                    {reservation.checkedInAt ? (
                      <span><strong>Checked in:</strong> <strong className="font-semibold text-[var(--primary)]">{formatReceptionDateTime(reservation.checkedInAt)}</strong></span>
                    ) : (
                      <span>Exp. arrival: <strong className="font-semibold text-[var(--primary)]">{reservation.arrivalTime || defaultCheckInTime}</strong></span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Stay value</p>
                    <p className="mt-2 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">
                      {formatReceptionCurrency(reservation.totalAmount)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{reservation.nights} night{reservation.nights === 1 ? '' : 's'}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Desk note</p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">{reservation.notes || reservation.specialRequests || 'No extra notes'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-end gap-3 xl:flex-col xl:items-stretch">
                  {canUpdate && !['checked_in', 'checked_out', 'cancelled', 'missed_arrival'].includes(reservation.status) ? (
                    <Button variant="outline" onClick={() => openEditModal(reservation)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  ) : null}
                  {canAssignRoom && ['pending', 'confirmed'].includes(reservation.status) && !reservation.roomId ? (
                    <Button variant="outline" onClick={() => openAssignModal(reservation)}>
                      <Hotel className="mr-2 h-4 w-4" />
                      Assign Room
                    </Button>
                  ) : null}
                  {canUpdate && reservation.status === 'checked_in' ? (
                    <Button variant="outline" onClick={() => openAmendModal(reservation)}>
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Amend Stay
                    </Button>
                  ) : null}
                  {canConfirm && ['pending', 'draft'].includes(reservation.status) ? (
                    <Button variant="outline" onClick={() => confirmReservation.mutate(reservation.id)}>
                      Confirm
                    </Button>
                  ) : null}
                  {canCancel && !['checked_out', 'cancelled', 'missed_arrival'].includes(reservation.status) ? (
                    <Button
                      variant="outline"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={reservation.status === 'checked_in'}
                      title={reservation.status === 'checked_in' ? "Cannot cancel a checked-in reservation" : "Cancel Reservation"}
                      onClick={() => {
                        if (window.confirm(`Cancel ${reservation.reservationCode}?`)) {
                          cancelReservation.mutate({ reservationId: reservation.id, cancellationReason: 'Cancelled from reception desk' });
                        }
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  ) : null}
                  {canUpdate && ['pending', 'confirmed'].includes(reservation.status) && new Date(reservation.checkInDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) ? (
                    <Button
                      variant="outline"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={markMissedArrivalMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Mark ${reservation.reservationCode} as Missed Arrival and release any assigned room?`)) {
                          markMissedArrivalMutation.mutate(reservation.id);
                        }
                      }}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Missed Arrival
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No reservations matched the current desk filters.
          </div>
        )}
      </Card>

      <AdminModal
        open={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setAssigningReservation(null); }}
        title="Assign Room"
        description="Select an available room to complete room allocation."
        widthClassName="max-w-md"
      >
        <form className="space-y-4" onSubmit={handleAssignRoom}>
          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Available Rooms</span>
            <select
              className={receptionFieldClassName}
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              disabled={availabilityLoading || availableRooms.length === 0}
            >
              <option value="">Select a room...</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - Floor {room.floor}
                </option>
              ))}
            </select>
          </label>
          {assignError && (
            <div className="mt-3 rounded-[20px] border border-rose-100 bg-rose-50 p-4 border-l-4 border-l-rose-500">
              <p className="text-xs text-rose-600 leading-tight">{assignError}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setAssignModalOpen(false); setAssigningReservation(null); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={assignReservationRoom.isPending || !selectedRoomId}
            >
              Assign Room
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={amendModalOpen}
        onClose={() => { setAmendModalOpen(false); setAmendingReservation(null); }}
        title="Amend Stay Dates"
        description="Change check-out date for an active guest stay. Early check-outs or stay extensions will recalculate their final bill."
        widthClassName="max-w-md"
      >
        <form className="space-y-4" onSubmit={handleAmendSubmit}>
          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>New check-out date</span>
            <input
              name="amendCheckOutDate"
              type="date"
              min={form.checkInDate || getTodayString()}
              className={receptionFieldClassName}
              value={amendForm.checkOutDate}
              onChange={(event) => setAmendForm((current) => ({ ...current, checkOutDate: event.target.value }))}
            />
          </label>
          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Amendment reason (optional)</span>
            <textarea
              name="amendNotes"
              className={receptionTextAreaClassName}
              rows={3}
              value={amendForm.notes}
              onChange={(event) => setAmendForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Guest left early due to emergency."
            />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setAmendModalOpen(false); setAmendingReservation(null); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={amendReservation.isPending}
            >
              Amend stay
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={modalOpen}
        onClose={resetModal}
        title={editingReservation ? 'Edit reservation' : 'Create reservation'}
        description="Desk booking, stay dates, category, and optional room assignment."
        widthClassName="max-w-5xl"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Guest</span>
            <select
              name="guestUserId"
              className={receptionFieldClassName}
              value={form.guestUserId}
              onChange={(event) => setForm((current) => ({ ...current, guestUserId: event.target.value }))}
            >
              <option value="">Select guest</option>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {getDisplayName(guest, 'Guest')} | {guest.email}
                </option>
              ))}
            </select>
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Room category</span>
            <select
              name="roomTypeId"
              className={receptionFieldClassName}
              value={form.roomTypeId}
              onChange={(event) => setForm((current) => ({ ...current, roomTypeId: event.target.value, roomId: '' }))}
            >
              <option value="">Select room category</option>
              {roomTypeOptions.map((roomType) => (
                <option key={roomType.id} value={roomType.id} disabled={!roomType.isSelectable}>
                  {roomType.name} | {formatReceptionCurrency(roomType.basePrice)} / night{isAvailabilityReady && !roomType.isSelectable ? ' | unavailable' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Check-in date</span>
            <input
              name="checkInDate"
              type="date"
              min={getTodayString()}
              className={receptionFieldClassName}
              value={form.checkInDate}
              onChange={(event) => setForm((current) => ({ ...current, checkInDate: event.target.value }))}
            />
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Check-out date</span>
            <input
              name="checkOutDate"
              type="date"
              min={form.checkInDate || getTodayString()}
              className={receptionFieldClassName}
              value={form.checkOutDate}
              onChange={(event) => setForm((current) => ({ ...current, checkOutDate: event.target.value }))}
            />
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Adults</span>
            <input
              name="adults"
              type="number"
              min="1"
              max="20"
              className={receptionFieldClassName}
              value={form.adults}
              onChange={(event) => setForm((current) => ({ ...current, adults: event.target.value }))}
            />
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Children</span>
            <input
              name="children"
              type="number"
              min="0"
              max="20"
              className={receptionFieldClassName}
              value={form.children}
              onChange={(event) => setForm((current) => ({ ...current, children: event.target.value }))}
            />
          </label>

          <div className="rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-4 md:col-span-2">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Category rate</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{selectedRoomType ? formatReceptionCurrency(selectedRoomType.basePrice) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Stay nights</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{nights || 0}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Matching rooms</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{filteredRooms.length}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Estimated total</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{estimatedTotal !== null ? formatReceptionCurrency(estimatedTotal) : 'N/A'}</p>
              </div>
            </div>
            {availabilityError ? (
              <div className="mt-3 rounded-[20px] border border-rose-100 bg-rose-50 p-4 border-l-4 border-l-rose-500">
                <p className="text-sm font-semibold text-rose-800 mb-1">Availability Issue</p>
                <p className="text-xs text-rose-600 leading-tight">{availabilityError}</p>
              </div>
            ) : null}
          </div>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Assign room now</span>
            <select
              name="roomId"
              className={receptionFieldClassName}
              value={form.roomId}
              onChange={(event) => setForm((current) => ({ ...current, roomId: event.target.value }))}
              disabled={!form.roomTypeId || filteredRooms.length === 0}
            >
              <option value="">Leave unassigned for now</option>
              {filteredRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} | Floor {room.floor} | {formatReceptionCurrency(room.effectivePrice)}
                </option>
              ))}
            </select>
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Booking source</span>
            <select
              name="bookingSource"
              className={receptionFieldClassName}
              value={form.bookingSource}
              onChange={(event) => setForm((current) => ({ ...current, bookingSource: event.target.value }))}
            >
              {bookingSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Discount amount</span>
            <input
              name="discountAmount"
              type="number"
              min="0"
              max="100000"
              className={receptionFieldClassName}
              value={form.discountAmount}
              onChange={(event) => setForm((current) => ({ ...current, discountAmount: event.target.value }))}
            />
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Arrival time</span>
            <input
              name="arrivalTime"
              className={receptionFieldClassName}
              value={form.arrivalTime}
              onChange={(event) => setForm((current) => ({ ...current, arrivalTime: event.target.value }))}
              placeholder="2:00 PM"
            />
          </label>

          {!editingReservation ? (
            <>
              <label className={receptionLabelClassName}>
                <span className={receptionLabelTextClassName}>Advance deposit</span>
                <input
                  name="advancePaymentAmount"
                  type="number"
                  min="0"
                  max="1000000"
                  className={receptionFieldClassName}
                  value={form.advancePaymentAmount}
                  onChange={(event) => setForm((current) => ({ ...current, advancePaymentAmount: event.target.value }))}
                  placeholder="0.00"
                />
              </label>
              
              <label className={receptionLabelClassName}>
                <span className={receptionLabelTextClassName}>Payment method</span>
                <select
                  name="advancePaymentMethod"
                  className={receptionFieldClassName}
                  value={form.advancePaymentMethod}
                  onChange={(event) => setForm((current) => ({ ...current, advancePaymentMethod: event.target.value }))}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </label>
            </>
          ) : (
            <div />
          )}

          <label className={`${receptionLabelClassName} md:col-span-2`}>
            <span className={receptionLabelTextClassName}>Special requests</span>
            <textarea
              name="specialRequests"
              className={receptionTextAreaClassName}
              rows={4}
              value={form.specialRequests}
              onChange={(event) => setForm((current) => ({ ...current, specialRequests: event.target.value }))}
            />
          </label>

          <label className={`${receptionLabelClassName} md:col-span-2`}>
            <span className={receptionLabelTextClassName}>Internal notes</span>
            <textarea
              name="notes"
              className={receptionTextAreaClassName}
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={createReservation.isPending || updateReservation.isPending || availabilityLoading}
            >
              {editingReservation ? 'Save reservation' : 'Create reservation'}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};
