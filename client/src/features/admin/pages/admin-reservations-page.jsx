import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ClipboardList, Eye, Plus, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AdminDetailDrawer,
  AdminDetailGrid,
  AdminDetailItem,
  AdminDetailSection,
} from '@/features/admin/components/admin-detail-drawer';
import { AdminEmptyState, AdminResultsSummary } from '@/features/admin/components/admin-list-state';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import { adminApi } from '@/features/admin/api';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  adminTextAreaClassName,
  BOOKING_SOURCE_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  formatAdminCurrency,
  formatAdminDate,
} from '@/features/admin/config';
import { getApiErrorMessage } from '@/lib/api-error';
import { getDisplayName } from '@/features/admin/display-utils';
import { validateAdminReservationForm } from '@/features/admin/form-utils';
import {
  useAdminGuests,
  useAdminReservations,
  useAdminRooms,
  useAdminRoomTypes,
  adminQueryKeys,
  useCancelReservation,
  useConfirmReservation,
  useCreateReservation,
  useUpdateReservation,
} from '@/features/admin/hooks';

const getTodayString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const createInitialForm = (guestUserId = '', roomTypeId = '') => ({
  guestUserId,
  roomTypeId,
  roomId: '',
  bookingSource: 'desk',
  checkInDate: '',
  checkOutDate: '',
  adults: '2',
  children: '0',
  discountAmount: '0',
  arrivalTime: '',
  specialRequests: '',
  notes: '',
});

const mapReservationToForm = (reservation) => ({
  guestUserId: reservation.guestUserId ?? '',
  roomTypeId: reservation.roomTypeId ?? '',
  roomId: reservation.roomId ?? '',
  bookingSource: reservation.bookingSource ?? 'desk',
  checkInDate: reservation.checkInDate ? new Date(reservation.checkInDate).toISOString().slice(0, 10) : '',
  checkOutDate: reservation.checkOutDate ? new Date(reservation.checkOutDate).toISOString().slice(0, 10) : '',
  adults: String(reservation.adults ?? 1),
  children: String(reservation.children ?? 0),
  discountAmount: String(reservation.discountAmount ?? 0),
  arrivalTime: reservation.arrivalTime ?? '',
  specialRequests: reservation.specialRequests ?? '',
  notes: reservation.notes ?? '',
});

const buildReservationPayload = (form) => ({
  guestUserId: form.guestUserId,
  roomTypeId: form.roomTypeId,
  roomId: form.roomId || null,
  bookingSource: form.bookingSource,
  checkInDate: form.checkInDate,
  checkOutDate: form.checkOutDate,
  adults: Number(form.adults),
  children: Number(form.children),
  discountAmount: Number(form.discountAmount || 0),
  arrivalTime: form.arrivalTime.trim() || null,
  specialRequests: form.specialRequests.trim() || null,
  notes: form.notes.trim() || null,
});

const isSameDay = (left, right) => left.toDateString() === right.toDateString();

const createInitialFilters = () => ({
  search: '',
  status: '',
  bookingSource: '',
});

const calculateReservationNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getAssignableRoomPrice = (room, reservation) => {
  const customPrice = Number(room?.customPrice);
  const roomTypeBasePrice = Number(room?.roomType?.basePrice ?? reservation?.roomType?.basePrice ?? reservation?.roomRate ?? 0);
  const hasValidCustomPrice =
    room?.customPrice !== null &&
    room?.customPrice !== undefined &&
    room?.customPrice !== '' &&
    !Number.isNaN(customPrice) &&
    customPrice > 0;

  return hasValidCustomPrice ? customPrice : roomTypeBasePrice;
};

const normalizeAvailableRoom = (room) => {
  if (!room) {
    return null;
  }

  const normalizedId =
    room.id ??
    room._id ??
    room.roomId ??
    '';
  const normalizedRoomType =
    room.roomType ??
    (room.roomTypeId && typeof room.roomTypeId === 'object'
      ? {
          id: room.roomTypeId.id ?? room.roomTypeId._id ?? '',
          name: room.roomTypeId.name,
          basePrice: room.roomTypeId.basePrice,
          maxAdults: room.roomTypeId.maxAdults,
          maxChildren: room.roomTypeId.maxChildren,
        }
      : null);

  return {
    ...room,
    id: String(normalizedId),
    roomType: normalizedRoomType,
    roomTypeId:
      typeof room.roomTypeId === 'object'
        ? room.roomTypeId.id ?? room.roomTypeId._id ?? normalizedRoomType?.id ?? ''
        : room.roomTypeId ?? normalizedRoomType?.id ?? '',
    effectivePrice:
      room.effectivePrice ??
      room.customPrice ??
      normalizedRoomType?.basePrice ??
      0,
  };
};

const dedupeCollectionById = (items = [], fallbackLabel = 'item') => {
  const seen = new Set();

  return items.filter((item, index) => {
    const rawKey = item?.id ?? item?._id ?? item?.roomNumber ?? item?.name ?? `${fallbackLabel}-${index}`;
    const key = String(rawKey);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const mergeAssignedRoomIntoReservation = (reservation, room) => {
  if (!reservation || !room) {
    return reservation;
  }

  return {
    ...reservation,
    roomId: reservation.roomId ?? room.id,
    roomRate: reservation.roomRate ?? getAssignableRoomPrice(room, reservation),
    room: reservation.room ?? {
      id: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      status: room.status,
      housekeepingStatus: room.housekeepingStatus,
      customPrice: room.customPrice ?? null,
    },
  };
};

export const AdminReservationsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(createInitialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [form, setForm] = useState(createInitialForm);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningReservation, setAssigningReservation] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [availableRoomTypes, setAvailableRoomTypes] = useState([]);
  const [reservationAvailableRooms, setReservationAvailableRooms] = useState([]);
  const [reservationAvailabilityLoading, setReservationAvailabilityLoading] = useState(false);
  const [reservationAvailabilityError, setReservationAvailabilityError] = useState('');
  const [reservationPricingSummary, setReservationPricingSummary] = useState(null);

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('reservations.update');
  const canCreate = isAdmin || permissions.includes('reservations.create');
  const canConfirm = isAdmin || permissions.includes('reservations.confirm');
  const canAssignRoom = isAdmin || permissions.includes('reservations.assignRoom');
  const canCancel = isAdmin || permissions.includes('reservations.cancel');

  const reservationsQuery = useAdminReservations({
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    bookingSource: filters.bookingSource || undefined,
  });
  const guestsQuery = useAdminGuests();
  const roomTypesQuery = useAdminRoomTypes({ isActive: true });
  const roomInventoryQuery = useAdminRooms(
    {
      roomTypeId: form.roomTypeId || undefined,
      isActive: true,
    },
    Boolean(modalOpen && form.roomTypeId),
  );

  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();
  const confirmReservation = useConfirmReservation();
  const cancelReservation = useCancelReservation();

  const reservations = useMemo(() => dedupeCollectionById(reservationsQuery.data ?? [], 'reservation'), [reservationsQuery.data]);
  const guests = useMemo(() => dedupeCollectionById(guestsQuery.data ?? [], 'guest'), [guestsQuery.data]);
  const roomTypes = useMemo(() => dedupeCollectionById(roomTypesQuery.data ?? [], 'room-type'), [roomTypesQuery.data]);
  const roomInventory = useMemo(() => dedupeCollectionById(roomInventoryQuery.data ?? [], 'room'), [roomInventoryQuery.data]);
  const reservationNights = calculateReservationNights(form.checkInDate, form.checkOutDate);
  const canQueryReservationAvailability =
    modalOpen &&
    Boolean(form.checkInDate) &&
    Boolean(form.checkOutDate) &&
    Number(form.adults) >= 1 &&
    Number(form.children) >= 0 &&
    reservationNights > 0;
  const roomTypeAvailabilityMap = useMemo(
    () =>
      new Map(
        availableRoomTypes.map((roomType) => [
          roomType.id,
          roomType,
        ]),
      ),
    [availableRoomTypes],
  );
  const roomTypeOptions = useMemo(
    () =>
      roomTypes.map((roomType) => {
        const liveAvailability = roomTypeAvailabilityMap.get(roomType.id);
        return {
          ...roomType,
          liveAvailability,
          isAvailable: canQueryReservationAvailability ? Boolean(liveAvailability) : true,
          displayPricing: liveAvailability?.pricing?.totalAmount ?? null,
        };
      }),
    [canQueryReservationAvailability, roomTypeAvailabilityMap, roomTypes],
  );
  const reservationRoomOptions = useMemo(
    () =>
      reservationAvailableRooms.filter((room) =>
        form.roomTypeId ? String(room.roomTypeId) === String(form.roomTypeId) : true,
      ),
    [form.roomTypeId, reservationAvailableRooms],
  );
  const selectedStaticRoomType = roomTypes.find((roomType) => roomType.id === form.roomTypeId) ?? null;
  const selectedRoomTypeAvailability = availableRoomTypes.find((roomType) => roomType.id === form.roomTypeId) ?? null;
  const selectedRoomTypeMeta = selectedRoomTypeAvailability ?? selectedStaticRoomType ?? null;
  const selectedReservationRoom =
    reservationRoomOptions.find((room) => String(room.id) === String(form.roomId)) ?? null;
  const hasSelectableAvailableRoomType = availableRoomTypes.length > 0;
  const occupancyMatchingInventory = roomInventory.filter(
    (room) => room.capacityAdults >= Number(form.adults) && room.capacityChildren >= Number(form.children),
  );
  const maintenanceBlockedInventory = occupancyMatchingInventory.filter((room) =>
    ['maintenance', 'out_of_service'].includes(room.status),
  );
  const reservationAvailabilityDiagnostic = useMemo(() => {
    if (!form.roomTypeId || !selectedStaticRoomType) {
      return '';
    }

    if (!canQueryReservationAvailability) {
      return 'Select valid stay dates and occupancy to evaluate live room availability for this category.';
    }

    if (roomInventoryQuery.isLoading) {
      return 'Checking linked room inventory for the selected category...';
    }

    if (roomInventory.length === 0) {
      return 'This category exists, but no active rooms are linked to it in the Rooms page yet.';
    }

    if (occupancyMatchingInventory.length === 0) {
      return `Rooms exist in ${selectedStaticRoomType.name}, but none support ${form.adults} adult(s) and ${form.children} child(ren).`;
    }

    if (maintenanceBlockedInventory.length === occupancyMatchingInventory.length) {
      return 'Matching rooms exist, but all of them are currently blocked by maintenance or out-of-service status.';
    }

    if (!selectedRoomTypeAvailability) {
      return 'Matching rooms exist, but they are already booked or otherwise unavailable for the selected stay dates.';
    }

    return `${selectedRoomTypeAvailability.availableRoomCount} matching room(s) are available for this category and stay window.`;
  }, [
    canQueryReservationAvailability,
    form.adults,
    form.children,
    form.roomTypeId,
    maintenanceBlockedInventory.length,
    occupancyMatchingInventory.length,
    roomInventory.length,
    roomInventoryQuery.isLoading,
    selectedRoomTypeAvailability,
    selectedStaticRoomType,
  ]);
  const estimatedBaseRate = Number(
    selectedReservationRoom?.effectivePrice ??
      selectedReservationRoom?.customPrice ??
      selectedRoomTypeMeta?.basePrice ??
      0,
  );
  const estimatedSubtotal = Number((estimatedBaseRate * reservationNights).toFixed(2));
  const estimatedTaxPercentage = Number(reservationPricingSummary?.taxPercentage ?? 0);
  const estimatedTaxAmount = Number(((estimatedSubtotal * estimatedTaxPercentage) / 100).toFixed(2));
  const estimatedDiscountAmount = Number(form.discountAmount || 0);
  const estimatedReservationTotal =
    reservationNights > 0 && estimatedBaseRate > 0
      ? Number((estimatedSubtotal - estimatedDiscountAmount + estimatedTaxAmount).toFixed(2))
      : null;
  const selectedAssignableRoom = availableRooms.find((room) => room.id === selectedRoomId) ?? null;

  const summary = useMemo(() => {
    const today = new Date();
    return {
      total: reservations.length,
      pending: reservations.filter((reservation) => ['draft', 'pending'].includes(reservation.status)).length,
      arrivalsToday: reservations.filter((reservation) => isSameDay(new Date(reservation.checkInDate), today)).length,
      unassigned: reservations.filter((reservation) => !reservation.roomId && !['cancelled', 'checked_out', 'no_show'].includes(reservation.status)).length,
    };
  }, [reservations]);

  const activeFilters = useMemo(
    () => [
      filters.search ? `Search: ${filters.search}` : null,
      filters.status ? `Status: ${filters.status}` : null,
      filters.bookingSource ? `Source: ${filters.bookingSource}` : null,
    ].filter(Boolean),
    [filters],
  );

  const openCreateModal = () => {
    setEditingReservation(null);
    setForm(createInitialForm('', ''));
    setAvailableRoomTypes([]);
    setReservationAvailabilityError('');
    setReservationPricingSummary(null);
    setModalOpen(true);
  };

  const openEditModal = (reservation) => {
    setSelectedReservation(null);
    setEditingReservation(reservation);
    setForm(mapReservationToForm(reservation));
    setAvailableRoomTypes([]);
    setReservationAvailabilityError('');
    setReservationPricingSummary(null);
    setModalOpen(true);
  };

  useEffect(() => {
    let cancelled = false;

    if (!modalOpen) {
      setAvailableRoomTypes([]);
      setReservationAvailableRooms([]);
      setReservationAvailabilityError('');
      setReservationPricingSummary(null);
      setReservationAvailabilityLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!form.checkInDate || !form.checkOutDate) {
      setAvailableRoomTypes([]);
      setReservationAvailableRooms([]);
      setReservationPricingSummary(null);
      setReservationAvailabilityError('Select check-in and check-out dates to load available room types.');
      setReservationAvailabilityLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (reservationNights <= 0) {
      setAvailableRoomTypes([]);
      setReservationAvailableRooms([]);
      setReservationPricingSummary(null);
      setReservationAvailabilityError('Check-out date must be after check-in date.');
      setReservationAvailabilityLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (Number(form.adults) < 1 || Number(form.children) < 0) {
      setAvailableRoomTypes([]);
      setReservationAvailableRooms([]);
      setReservationPricingSummary(null);
      setReservationAvailabilityError('Enter a valid occupancy to load matching room types.');
      setReservationAvailabilityLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadReservationAvailability = async () => {
      setReservationAvailabilityLoading(true);
      setReservationAvailabilityError('');

      try {
        const result = await adminApi.searchAvailability({
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          adults: Number(form.adults),
          children: Number(form.children),
          ...(editingReservation ? { excludeReservationId: editingReservation.id } : {}),
        });

        if (cancelled) {
          return;
        }

        const nextAvailableRoomTypes = dedupeCollectionById(result.availableRoomTypes ?? [], 'room-type');
        const nextAvailableRooms = dedupeCollectionById(
          (result.availableRooms ?? [])
            .map((room) => normalizeAvailableRoom(room))
            .filter(Boolean),
          'room',
        );
        setAvailableRoomTypes(nextAvailableRoomTypes);
        setReservationAvailableRooms(nextAvailableRooms);
        setReservationPricingSummary(result.pricingSummary ?? null);

        if (nextAvailableRoomTypes.length === 0) {
          setReservationAvailabilityError(
            form.roomTypeId
              ? 'Selected room category is unavailable for the selected dates and occupancy.'
              : 'No room types are currently available for the selected dates and occupancy.',
          );
        } else if (form.roomTypeId && !nextAvailableRoomTypes.some((roomType) => roomType.id === form.roomTypeId)) {
          setReservationAvailabilityError('Selected room category is unavailable for the selected dates and occupancy.');
          setForm((current) => ({
            ...current,
            roomId: '',
          }));
        } else if (!form.roomTypeId && nextAvailableRoomTypes[0]?.id) {
          setForm((current) => ({
            ...current,
            roomTypeId: nextAvailableRoomTypes[0].id,
            roomId: '',
          }));
          setReservationAvailabilityError('');
        } else {
          setReservationAvailabilityError('');
        }

        setForm((current) => {
          if (!current.roomId) {
            return current;
          }

          const roomStillAvailable = nextAvailableRooms.some((room) => String(room.id) === String(current.roomId));
          if (roomStillAvailable) {
            return current;
          }

          return {
            ...current,
            roomId: '',
          };
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAvailableRoomTypes([]);
        setReservationAvailableRooms([]);
        setReservationPricingSummary(null);
        setReservationAvailabilityError(error?.response?.data?.message ?? 'Unable to load available room types right now.');
      } finally {
        if (!cancelled) {
          setReservationAvailabilityLoading(false);
        }
      }
    };

    loadReservationAvailability();

    return () => {
      cancelled = true;
    };
  }, [
    editingReservation,
    form.adults,
    form.checkInDate,
    form.checkOutDate,
    form.children,
    modalOpen,
    reservationNights,
  ]);

  useEffect(() => {
    setForm((current) => {
      if (!current.roomId) {
        return current;
      }

      const roomStillMatchesSelection = reservationRoomOptions.some(
        (room) => String(room.id) === String(current.roomId),
      );

      if (roomStillMatchesSelection) {
        return current;
      }

      return {
        ...current,
        roomId: '',
      };
    });
  }, [reservationRoomOptions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateAdminReservationForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    if (canQueryReservationAvailability && !availableRoomTypes.some((roomType) => roomType.id === form.roomTypeId)) {
      toast.error('Select an available room type for the chosen dates and occupancy.');
      return;
    }

    const payload = buildReservationPayload(form);

    try {
      if (editingReservation) {
        await updateReservation.mutateAsync({
          reservationId: editingReservation.id,
          payload,
        });
      } else {
        await createReservation.mutateAsync(payload);
      }

      setModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const loadAvailability = async (reservation) => {
    setAvailabilityLoading(true);
    setAssignError('');
    try {
      const result = await adminApi.searchAvailability({
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        adults: reservation.adults,
        children: reservation.children,
        roomTypeId: reservation.roomTypeId,
      });
      const nextAvailableRooms = dedupeCollectionById(
        (result.availableRooms ?? [])
          .map((room) => normalizeAvailableRoom(room))
          .filter(Boolean),
        'room',
      );
      setAvailableRooms(nextAvailableRooms);
      setSelectedRoomId((current) => {
        if (reservation.roomId && nextAvailableRooms.some((room) => room.id === reservation.roomId)) {
          return reservation.roomId;
        }

        if (current && nextAvailableRooms.some((room) => room.id === current)) {
          return current;
        }

        return nextAvailableRooms[0]?.id ?? '';
      });
    } catch (error) {
      setAvailableRooms([]);
      setSelectedRoomId('');
      setAssignError(getApiErrorMessage(error, 'Unable to load available rooms for this reservation'));
      toast.error(error?.response?.data?.message ?? 'Unable to load available rooms for this reservation');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const openAssignModal = async (reservation) => {
    setSelectedReservation(null);
    setAssigningReservation(reservation);
    setSelectedRoomId('');
    setAssignError('');
    setAssignModalOpen(true);
    await loadAvailability(reservation);
  };

  const handleAssignRoom = async (roomOverride = null) => {
    const targetRoomId = roomOverride?.id ?? selectedRoomId;
    const targetRoom = roomOverride ?? selectedAssignableRoom;

    if (!assigningReservation || !targetRoomId) {
      toast.error('Select an available room before assigning it.');
      return;
    }

    if (!targetRoom) {
      const message = 'Selected room details could not be resolved. Refresh availability and try again.';
      setAssignError(message);
      toast.error(message);
      return;
    }

    setAssignSubmitting(true);
    setAssignError('');

    try {
      let updatedReservation;

      try {
        updatedReservation = await adminApi.assignReservationRoom({
          reservationId: assigningReservation.id,
          roomId: targetRoomId,
        });
      } catch (assignError) {
        updatedReservation = await adminApi.updateReservation({
          reservationId: assigningReservation.id,
          payload: { roomId: targetRoomId },
        });
      }

      const freshReservation = await adminApi
        .getReservation(updatedReservation?.id ?? assigningReservation.id)
        .catch(() => updatedReservation);

      const nextReservation = mergeAssignedRoomIntoReservation(freshReservation, targetRoom);

      queryClient.setQueriesData({ queryKey: ['admin', 'reservations'] }, (current) =>
        Array.isArray(current)
          ? current.map((reservation) => (reservation.id === nextReservation.id ? { ...reservation, ...nextReservation } : reservation))
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });

      setAssigningReservation(nextReservation);
      setSelectedReservation(nextReservation);
      setAvailableRooms([]);
      setSelectedRoomId('');
      setAssignError('');
      setAssignModalOpen(false);
      toast.success(`Room ${targetRoom.roomNumber} assigned successfully.`);
    } catch (error) {
      setAssignError(getApiErrorMessage(error, 'Unable to assign room'));
      toast.error(getApiErrorMessage(error, 'Unable to assign room'));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleAssignRoomFor = async (room) => {
    if (!room?.id) {
      const message = 'Select a valid room before assigning it.';
      setAssignError(message);
      toast.error(message);
      return;
    }

    setSelectedRoomId(room.id);
    await handleAssignRoom(room);
  };

  const handleCancelReservation = async (reservation) => {
    const cancellationReason = window.prompt('Enter a short cancellation reason', 'Cancelled by admin');
    if (cancellationReason === null) {
      return;
    }

    try {
      await cancelReservation.mutateAsync({
        reservationId: reservation.id,
        cancellationReason,
      });
      setSelectedReservation(null);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations Command"
        description="Control booking intake, approval flow, room assignment, and stay-readiness from one premium operations desk."
      >
        <div className="rounded-[22px] border border-white/60 bg-white/72 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Pending action</p>
          <p className="mt-2 text-xl text-[var(--primary)] [font-family:var(--font-display)]">{summary.pending}</p>
        </div>
        <div className="rounded-[22px] border border-white/60 bg-[linear-gradient(135deg,var(--primary)_0%,#21436b_68%,var(--accent)_160%)] px-4 py-3 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/68">Unassigned stays</p>
          <p className="mt-2 text-xl [font-family:var(--font-display)]">{summary.unassigned}</p>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Reservation volume" value={String(summary.total)} description="Bookings visible in the current operational filter scope" icon={ClipboardList} />
        <StatsCard title="Awaiting confirmation" value={String(summary.pending)} description="Draft and pending bookings needing admin or reception attention" icon={Sparkles} />
        <StatsCard title="Arrivals today" value={String(summary.arrivalsToday)} description="Stays scheduled to arrive today based on reservation dates" icon={CalendarClock} />
        <StatsCard title="Awaiting room" value={String(summary.unassigned)} description="Confirmed or pending reservations still missing room assignment" icon={ClipboardList} />
      </div>

      <AdminToolbar
        title="Reservation controls"
        description="Search bookings, filter by lifecycle state or source, then create, edit, confirm, assign, or cancel without leaving the command surface."
        actions={
          canCreate ? (
            <Button variant="secondary" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              New reservation
            </Button>
          ) : null
        }
      >
        <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,0.7fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              name="reservationSearch"
              className={`${adminInputClassName} pl-11`}
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search reservation code or guest snapshot"
            />
          </div>
          <select name="reservationStatusFilter" className={adminSelectClassName} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            {RESERVATION_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select name="reservationSourceFilter" className={adminSelectClassName} value={filters.bookingSource} onChange={(event) => setFilters((current) => ({ ...current, bookingSource: event.target.value }))}>
            <option value="">All sources</option>
            {BOOKING_SOURCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <AdminResultsSummary
        count={reservations.length}
        noun="reservations"
        activeFilters={activeFilters}
        onClearFilters={() => setFilters(createInitialFilters())}
      />

      <Card className="space-y-4">
        {reservationsQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[22px] bg-white/70" />
            ))}
          </div>
        ) : reservations.length > 0 ? (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-white/76 p-5 shadow-[0_16px_34px_rgba(16,36,63,0.05)] xl:grid-cols-[minmax(0,1.55fr)_minmax(250px,0.85fr)_auto] xl:items-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={reservation.status} />
                    <StatusBadge value={reservation.bookingSource} className="bg-slate-100 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">{reservation.reservationCode}</p>
                    <h3 className="mt-2 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">
                      {getDisplayName(reservation.guest ?? reservation.guestProfileSnapshot, 'Guest booking')}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {reservation.roomType?.name ?? 'Room type pending'} | {formatAdminDate(reservation.checkInDate)} to {formatAdminDate(reservation.checkOutDate)}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
                    <span>Guests: <strong className="font-semibold text-[var(--primary)]">{reservation.adults}A / {reservation.children}C</strong></span>
                    <span>Room: <strong className="font-semibold text-[var(--primary)]">{reservation.room?.roomNumber ? `#${reservation.room.roomNumber}` : 'Not assigned'}</strong></span>
                    <span>Nights: <strong className="font-semibold text-[var(--primary)]">{reservation.nights}</strong></span>
                    <span>Arrival time: <strong className="font-semibold text-[var(--primary)]">{reservation.arrivalTime || 'n/a'}</strong></span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Stay value</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{formatAdminCurrency(reservation.totalAmount)}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{reservation.nights} nights</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Created by</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{getDisplayName(reservation.createdBy, 'System')}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{reservation.confirmedAt ? `Confirmed ${formatAdminDate(reservation.confirmedAt)}` : 'Awaiting confirmation'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-end gap-3 xl:flex-col xl:items-stretch">
                  <Button variant="outline" onClick={() => setSelectedReservation(reservation)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </Button>
                  {canUpdate && (
                    <Button variant="outline" onClick={() => openEditModal(reservation)}>
                      Edit
                    </Button>
                  )}
                  {canAssignRoom && !reservation.roomId && ['confirmed', 'checked_in'].includes(reservation.status) ? (
                    <Button variant="outline" onClick={() => openAssignModal(reservation)}>
                      Assign room
                    </Button>
                  ) : null}
                  {canConfirm && ['draft', 'pending'].includes(reservation.status) ? (
                    <Button variant="secondary" onClick={() => confirmReservation.mutate(reservation.id)}>
                      Confirm
                    </Button>
                  ) : null}
                  {canCancel && !['cancelled', 'checked_out', 'no_show'].includes(reservation.status) ? (
                    <Button 
                      variant="outline" 
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={reservation.status === 'checked_in'}
                      title={reservation.status === 'checked_in' ? "Cannot cancel a checked-in reservation" : "Cancel Reservation"}
                      onClick={() => handleCancelReservation(reservation)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>

                <div className="xl:col-span-3 rounded-[20px] border border-[rgba(16,36,63,0.08)] bg-white/58 px-4 py-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {reservation.specialRequests || reservation.notes || 'No special requests recorded for this reservation yet.'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No reservations found"
            description="Broaden the lifecycle or source filters, or create a new reservation to start the booking and arrival workflow."
            action={
              canCreate ? (
                <Button variant="secondary" onClick={openCreateModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  New reservation
                </Button>
              ) : null
            }
          />
        )}
      </Card>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingReservation ? 'Edit reservation' : 'Create reservation'}
        description="Build a polished stay plan with guest, room type, date, occupancy, and front-desk booking context."
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Guest</span>
            <select name="guestUserId" className={adminSelectClassName} value={form.guestUserId} onChange={(event) => setForm((current) => ({ ...current, guestUserId: event.target.value }))}>
              <option value="">Select guest</option>
              {guests.map((guest, index) => (
                <option key={`${guest.id ?? guest.email ?? 'guest'}-${index}`} value={guest.id}>
                  {getDisplayName(guest, 'Guest')} | {guest.email}
                </option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Room category</span>
            <select
              name="roomTypeId"
              className={adminSelectClassName}
              value={form.roomTypeId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  roomTypeId: event.target.value,
                  roomId: '',
                }))
              }
            >
              <option value="">Select room type</option>
              {roomTypeOptions.map((roomType, index) => (
                <option key={`${roomType.id ?? roomType.name ?? 'room-type'}-${index}`} value={roomType.id} disabled={!roomType.isAvailable}>
                  {roomType.name}
                  {` | ${formatAdminCurrency(roomType.basePrice)} / night`}
                  {canQueryReservationAvailability && !roomType.isAvailable ? ' | unavailable' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted-foreground)]">
              {reservationAvailabilityLoading
                ? 'Checking live room-type availability...'
                : reservationAvailabilityError ||
                  (roomTypes.length === 0
                    ? 'No room types found yet. Create room types first from the Room Types page.'
                    : canQueryReservationAvailability
                      ? 'Unavailable room types stay visible but cannot be selected.'
                      : 'All active room types are shown first. Dates and occupancy then refine live availability.')}
            </p>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Assign room now</span>
            <select
              name="roomId"
              className={adminSelectClassName}
              value={form.roomId}
              onChange={(event) => setForm((current) => ({ ...current, roomId: event.target.value }))}
              disabled={!form.roomTypeId || reservationAvailabilityLoading || reservationRoomOptions.length === 0}
            >
              <option value="">Leave unassigned for now</option>
              {reservationRoomOptions.map((room, index) => (
                <option key={`${room.id ?? room.roomNumber ?? 'room'}-${index}`} value={room.id}>
                  Room {room.roomNumber} | Floor {room.floor} | {formatAdminCurrency(getAssignableRoomPrice(room, { roomType: selectedRoomTypeMeta }))}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted-foreground)]">
              {form.roomTypeId
                ? reservationRoomOptions.length > 0
                  ? 'Optional: select an exact room now, or leave it unassigned and allocate it later from the assign-room flow.'
                  : 'No exact room is currently available for this category and date range.'
                : 'Select a room category first to load matching available rooms.'}
            </p>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Check-in date</span>
            <input name="checkInDate" type="date" min={getTodayString()} className={adminInputClassName} value={form.checkInDate} onChange={(event) => setForm((current) => ({ ...current, checkInDate: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Check-out date</span>
            <input name="checkOutDate" type="date" min={form.checkInDate || getTodayString()} className={adminInputClassName} value={form.checkOutDate} onChange={(event) => setForm((current) => ({ ...current, checkOutDate: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Adults</span>
            <input name="adults" type="number" min="1" className={adminInputClassName} value={form.adults} onChange={(event) => setForm((current) => ({ ...current, adults: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Children</span>
            <input name="children" type="number" min="0" className={adminInputClassName} value={form.children} onChange={(event) => setForm((current) => ({ ...current, children: event.target.value }))} />
          </label>
          <div className="rounded-[20px] border border-[var(--border)] bg-white/72 px-4 py-4 md:col-span-2">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Category rate</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">
                  {selectedRoomTypeMeta ? formatAdminCurrency(estimatedBaseRate) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Stay nights</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{reservationNights || '0'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Available room types</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{canQueryReservationAvailability ? availableRoomTypes.length : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Estimated total</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">
                  {estimatedReservationTotal !== null
                    ? formatAdminCurrency(estimatedReservationTotal)
                    : reservationPricingSummary?.startingFrom
                      ? `${formatAdminCurrency(reservationPricingSummary.startingFrom)}+`
                      : 'N/A'}
                </p>
              </div>
            </div>
            {selectedRoomTypeMeta ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {selectedRoomTypeMeta.name} supports up to {selectedRoomTypeMeta.maxAdults ?? 'N/A'} adults and {selectedRoomTypeMeta.maxChildren ?? 'N/A'} children.
                {' '}Base amount {formatAdminCurrency(estimatedSubtotal)} plus tax {formatAdminCurrency(estimatedTaxAmount)}
                {estimatedDiscountAmount > 0 ? ` minus discount ${formatAdminCurrency(estimatedDiscountAmount)}` : ''}.
                {selectedRoomTypeAvailability
                  ? ` ${selectedRoomTypeAvailability.availableRoomCount} room(s) are currently available for this stay.`
                  : canQueryReservationAvailability
                    ? ' This category is currently not available for the selected stay details.'
                    : ''}
                {selectedReservationRoom ? ` Selected room: ${selectedReservationRoom.roomNumber}.` : ''}
              </p>
            ) : null}
            {reservationAvailabilityError ? (
              <div className="mt-3 rounded-[20px] bg-rose-50 border border-rose-100 p-4 border-l-4 border-l-rose-500">
                 <p className="text-sm font-semibold text-rose-800 mb-1">Availability Issue</p>
                 <p className="text-xs text-rose-600 leading-tight">{reservationAvailabilityError}</p>
              </div>
            ) : reservationAvailabilityDiagnostic ? (
              <p className="mt-2 text-sm font-semibold text-amber-700">
                {reservationAvailabilityDiagnostic}
              </p>
            ) : null}
          </div>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Booking source</span>
            <select name="bookingSource" className={adminSelectClassName} value={form.bookingSource} onChange={(event) => setForm((current) => ({ ...current, bookingSource: event.target.value }))}>
              {BOOKING_SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Discount amount</span>
            <input name="discountAmount" type="number" min="0" className={adminInputClassName} value={form.discountAmount} onChange={(event) => setForm((current) => ({ ...current, discountAmount: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Arrival time</span>
            <input name="arrivalTime" className={adminInputClassName} value={form.arrivalTime} onChange={(event) => setForm((current) => ({ ...current, arrivalTime: event.target.value }))} placeholder="e.g. 3:00 PM" />
          </label>
          <div />
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Special requests</span>
            <textarea name="specialRequests" className={adminTextAreaClassName} value={form.specialRequests} onChange={(event) => setForm((current) => ({ ...current, specialRequests: event.target.value }))} />
          </label>
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Internal notes</span>
            <textarea name="notes" className={adminTextAreaClassName} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={
                createReservation.isPending ||
                updateReservation.isPending ||
                reservationAvailabilityLoading ||
                !form.roomTypeId ||
                (canQueryReservationAvailability && !hasSelectableAvailableRoomType)
              }
            >
              {editingReservation ? 'Save reservation' : 'Create reservation'}
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign room"
        description={assigningReservation ? `Available rooms for ${assigningReservation.reservationCode} during the selected stay window.` : 'Available rooms'}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--primary)]">{assigningReservation?.roomType?.name ?? 'Room type'}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {assigningReservation ? `${formatAdminDate(assigningReservation.checkInDate)} to ${formatAdminDate(assigningReservation.checkOutDate)}` : 'Select a reservation'}
              </p>
            </div>
            <Button variant="outline" onClick={() => assigningReservation && loadAvailability(assigningReservation)} disabled={availabilityLoading}>
              Refresh availability
            </Button>
          </div>

          {availabilityLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-[22px] bg-white/70" />
              ))}
            </div>
          ) : availableRooms.length > 0 ? (
            <div className="space-y-3">
              {availableRooms.map((room, index) => (
                <div
                  key={`${room.id ?? room.roomNumber ?? 'room'}-${index}`}
                  className={[
                    'w-full rounded-[22px] border p-4 text-left transition',
                    selectedRoomId === room.id
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_14px_32px_rgba(184,140,74,0.12)]'
                      : 'border-[var(--border)] bg-white/78 hover:bg-white',
                  ].join(' ')}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setAssignError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedRoomId(room.id);
                      setAssignError('');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--primary)]">Room {room.roomNumber}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Floor {room.floor} | {room.capacityAdults} adults / {room.capacityChildren} children</p>
                      {selectedRoomId === room.id ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">Selected for assignment</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--primary)]">{formatAdminCurrency(getAssignableRoomPrice(room, assigningReservation))}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">effective nightly rate</p>
                      <button
                        type="button"
                        name={`assign-room-${room.id ?? room.roomNumber ?? index}`}
                        className="mt-3 inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a97c3d] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleAssignRoomFor(room);
                        }}
                        disabled={assignSubmitting}
                      >
                        {assignSubmitting && selectedRoomId === room.id ? 'Assigning room...' : 'Assign this room'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm leading-7 text-[var(--muted-foreground)]">
              No available rooms were returned for this stay. Adjust the reservation dates, occupancy, or room type first.
            </div>
          )}

          {assignError ? (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {assignError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setAssignModalOpen(false)}>
              Close
            </Button>
            <Button type="button" variant="secondary" onClick={handleAssignRoom} disabled={!selectedRoomId || assignSubmitting}>
              {assignSubmitting
                ? 'Assigning room...'
                : selectedAssignableRoom
                  ? `Assign Room ${selectedAssignableRoom.roomNumber}`
                  : 'Select a room to assign'}
            </Button>
          </div>
        </div>
      </AdminModal>

      <AdminDetailDrawer
        open={Boolean(selectedReservation)}
        onClose={() => setSelectedReservation(null)}
        title={selectedReservation?.reservationCode}
        subtitle="Review guest, stay, financial posture, and room assignment from one clear reservation side panel."
        actions={selectedReservation ? (
          <>
            {canUpdate && (
              <Button variant="outline" onClick={() => openEditModal(selectedReservation)}>
                Edit reservation
              </Button>
            )}
            {canAssignRoom && !selectedReservation.roomId && ['confirmed', 'checked_in'].includes(selectedReservation.status) ? (
              <Button variant="outline" onClick={() => openAssignModal(selectedReservation)}>
                Assign room
              </Button>
            ) : null}
            {canConfirm && ['draft', 'pending'].includes(selectedReservation.status) ? (
              <Button variant="secondary" onClick={() => confirmReservation.mutate(selectedReservation.id)}>
                Confirm
              </Button>
            ) : null}
            {canCancel && !['cancelled', 'checked_out', 'no_show'].includes(selectedReservation.status) ? (
              <Button 
                variant="outline" 
                className="border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={selectedReservation.status === 'checked_in'}
                title={selectedReservation.status === 'checked_in' ? "Cannot cancel a checked-in reservation" : "Cancel Reservation"}
                onClick={() => handleCancelReservation(selectedReservation)}
              >
                Cancel
              </Button>
            ) : null}
          </>
        ) : null}
      >
        {selectedReservation ? (
          <>
            <AdminDetailSection title="Reservation summary" description="Lifecycle posture and stay window.">
              <AdminDetailGrid>
                <AdminDetailItem label="Status" value={selectedReservation.status} emphasis />
                <AdminDetailItem label="Booking source" value={selectedReservation.bookingSource} />
                <AdminDetailItem label="Check-in" value={formatAdminDate(selectedReservation.checkInDate)} />
                <AdminDetailItem label="Check-out" value={formatAdminDate(selectedReservation.checkOutDate)} />
                <AdminDetailItem label="Adults" value={String(selectedReservation.adults)} />
                <AdminDetailItem label="Children" value={String(selectedReservation.children)} />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Guest and room" description="Assigned guest snapshot and room allocation posture.">
              <AdminDetailGrid>
                <AdminDetailItem label="Guest" value={getDisplayName(selectedReservation.guest ?? selectedReservation.guestProfileSnapshot, 'Guest booking')} emphasis />
                <AdminDetailItem label="Guest email" value={selectedReservation.guest?.email ?? selectedReservation.guestProfileSnapshot?.email ?? 'Not captured'} />
                <AdminDetailItem label="Room type" value={selectedReservation.roomType?.name ?? 'Pending'} />
                <AdminDetailItem label="Assigned room" value={selectedReservation.room?.roomNumber ? `Room ${selectedReservation.room.roomNumber}` : 'Not assigned'} emphasis />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Financial posture" description="Reservation pricing before invoice finalization.">
              <AdminDetailGrid>
                <AdminDetailItem label="Room rate" value={formatAdminCurrency(selectedReservation.roomRate)} />
                <AdminDetailItem label="Subtotal" value={formatAdminCurrency(selectedReservation.subtotal)} />
                <AdminDetailItem label="Tax amount" value={formatAdminCurrency(selectedReservation.taxAmount)} />
                <AdminDetailItem label="Discount amount" value={formatAdminCurrency(selectedReservation.discountAmount)} />
                <AdminDetailItem label="Total amount" value={formatAdminCurrency(selectedReservation.totalAmount)} emphasis />
                <AdminDetailItem label="Arrival time" value={selectedReservation.arrivalTime || 'Not set'} />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Requests and notes" description="Special guest requests and internal front-desk notes.">
              <AdminDetailGrid columns={1}>
                <AdminDetailItem label="Special requests" value={selectedReservation.specialRequests || 'No special requests'} />
                <AdminDetailItem label="Internal notes" value={selectedReservation.notes || 'No internal notes'} />
              </AdminDetailGrid>
            </AdminDetailSection>
          </>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
};
