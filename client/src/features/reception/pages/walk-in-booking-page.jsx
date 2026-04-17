import { useEffect, useMemo, useState } from 'react';
import { BedDouble, CalendarPlus, PlusCircle, UserRoundPlus, Users, Banknote, CalendarClock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { validateAdminGuestForm, validateAdminReservationForm } from '@/features/admin/form-utils';
import {
  bookingSourceOptions,
  formatReceptionCurrency,
  formatReceptionDate,
  idTypeOptions,
  receptionFieldClassName,
  receptionLabelClassName,
  receptionLabelTextClassName,
  receptionTextAreaClassName,
} from '@/features/reception/config';
import { receptionApi } from '@/features/reception/api';
import {
  useCreateReceptionGuest,
  useCreateReceptionReservation,
  useReceptionRoomTypes,
  useReceptionReservations,
} from '@/features/reception/hooks';
import {
  buildReceptionGuestPayload,
  buildReceptionReservationPayload,
  calculateReceptionStayNights,
  createReceptionGuestForm,
  createReceptionReservationForm,
} from '@/features/reception/utils';
import { getApiErrorMessage } from '@/lib/api-error';

const getTodayString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const normalizeRoom = (room) => ({
  ...room,
  id: room.id ?? room._id ?? room.roomId ?? '',
  roomTypeId:
    typeof room.roomTypeId === 'object'
      ? room.roomTypeId.id ?? room.roomTypeId._id ?? room.roomType?.id ?? ''
      : room.roomTypeId ?? room.roomType?.id ?? '',
  effectivePrice: room.effectivePrice ?? room.customPrice ?? room.roomType?.basePrice ?? 0,
});

export const WalkInBookingPage = () => {
  const roomTypesQuery = useReceptionRoomTypes();
  const createGuestMutation = useCreateReceptionGuest();
  const createReservationMutation = useCreateReceptionReservation();
  const reservationsQuery = useReceptionReservations({ bookingSource: 'desk' });

  const [guestForm, setGuestForm] = useState(createReceptionGuestForm());
  const [stayForm, setStayForm] = useState(() => ({
    ...createReceptionReservationForm(),
    bookingSource: 'desk',
  }));
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const roomTypes = roomTypesQuery.data ?? [];
  const nights = calculateReceptionStayNights(stayForm.checkInDate, stayForm.checkOutDate);
  const shouldCheckAvailability =
    Boolean(stayForm.checkInDate) &&
    Boolean(stayForm.checkOutDate) &&
    Number(stayForm.adults) >= 1 &&
    Number(stayForm.children) >= 0 &&
    nights > 0;

  useEffect(() => {
    let cancelled = false;

    if (stayForm.checkInDate && stayForm.checkOutDate && nights <= 0) {
      setAvailableRooms([]);
      setAvailabilityLoading(false);
      setAvailabilityError('Your check-out date must be at least one day after your check-in date.');
      return () => {
        cancelled = true;
      };
    }

    if (!shouldCheckAvailability) {
      setAvailableRooms([]);
      setAvailabilityError('Select stay dates and occupancy to load matching rooms.');
      setAvailabilityLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError('');

      try {
        const rooms = await receptionApi.searchAvailableRooms({
          checkInDate: stayForm.checkInDate,
          checkOutDate: stayForm.checkOutDate,
          adults: Number(stayForm.adults),
          children: Number(stayForm.children),
        });

        if (cancelled) {
          return;
        }

        const normalizedRooms = (rooms ?? []).map(normalizeRoom);
        setAvailableRooms(normalizedRooms);

        if (normalizedRooms.length === 0) {
          setAvailabilityError('No matching rooms are open for the selected stay window.');
        }
      } catch (error) {
        if (!cancelled) {
          setAvailableRooms([]);
          setAvailabilityError(getApiErrorMessage(error, 'Unable to load room inventory right now.'));
        }
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
  }, [shouldCheckAvailability, stayForm.adults, stayForm.checkInDate, stayForm.checkOutDate, stayForm.children]);

  const categoryOptions = useMemo(() => {
    const availableTypeIds = new Set(availableRooms.map((room) => String(room.roomTypeId)));

    return roomTypes.map((roomType) => ({
      ...roomType,
      isSelectable: shouldCheckAvailability ? availableTypeIds.has(String(roomType.id)) : true,
    }));
  }, [availableRooms, roomTypes, shouldCheckAvailability]);

  const matchingRooms = useMemo(
    () =>
      availableRooms.filter((room) =>
        stayForm.roomTypeId ? String(room.roomTypeId) === String(stayForm.roomTypeId) : true,
      ),
    [availableRooms, stayForm.roomTypeId],
  );

  useEffect(() => {
    if (!stayForm.roomTypeId || !categoryOptions.length) {
      return;
    }

    const selectedType = categoryOptions.find((roomType) => String(roomType.id) === String(stayForm.roomTypeId));
    if (selectedType?.isSelectable) {
      return;
    }

    setStayForm((current) => ({ ...current, roomTypeId: '', roomId: '' }));
  }, [categoryOptions, stayForm.roomTypeId]);

  useEffect(() => {
    if (!stayForm.roomId) {
      return;
    }

    const stillVisible = matchingRooms.some((room) => String(room.id) === String(stayForm.roomId));
    if (!stillVisible) {
      setStayForm((current) => ({ ...current, roomId: '' }));
    }
  }, [matchingRooms, stayForm.roomId]);

  const selectedRoomType =
    roomTypes.find((roomType) => String(roomType.id) === String(stayForm.roomTypeId)) ?? null;
  const selectedRoom =
    matchingRooms.find((room) => String(room.id) === String(stayForm.roomId)) ?? null;
  const effectiveRate = Number(selectedRoom?.effectivePrice ?? selectedRoomType?.basePrice ?? 0);
  const estimatedTotal =
    nights > 0 && effectiveRate > 0
      ? Number((effectiveRate * nights - Number(stayForm.discountAmount || 0)).toFixed(2))
      : 0;

  const dailyMetrics = useMemo(() => {
    const allDeskReservations = reservationsQuery.data ?? [];
    const today = new Date();
    
    let walkInsToday = 0;
    let revenueToday = 0;
    let activeStay = 0;
    let pendingAllocations = 0;

    for (const res of allDeskReservations) {
      const resDate = new Date(res.createdAt);
      if (resDate.toDateString() === today.toDateString()) {
        walkInsToday++;
        revenueToday += (res.totalAmount || 0);
      }
      if (res.status === 'checked_in') {
        activeStay++;
      }
      if (['pending', 'confirmed'].includes(res.status) && !res.roomId) {
        pendingAllocations++;
      }
    }
    
    return {
      walkIns: walkInsToday,
      revenue: revenueToday,
      active: activeStay,
      pending: pendingAllocations,
    };
  }, [reservationsQuery.data]);

  const resetForms = () => {
    setGuestForm(createReceptionGuestForm());
    setStayForm({
      ...createReceptionReservationForm(),
      bookingSource: 'desk',
    });
    setAvailableRooms([]);
    setAvailabilityError('Select stay dates and occupancy to load matching rooms.');
  };

  const handleGuestChange = (key, value) => {
    setGuestForm((current) => ({ ...current, [key]: value }));
  };

  const handleGuestProfileChange = (key, value) => {
    setGuestForm((current) => ({
      ...current,
      profile: { ...current.profile, [key]: value },
    }));
  };

  const handleStayChange = (key, value) => {
    setStayForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'roomTypeId' ? { roomId: '' } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const guestValidation = validateAdminGuestForm(guestForm, false);
    if (guestValidation) {
      toast.error(guestValidation);
      return;
    }

    const reservationValidation = validateAdminReservationForm({
      ...stayForm,
      guestUserId: 'temporary',
    });
    if (reservationValidation) {
      toast.error(reservationValidation);
      return;
    }

    if (shouldCheckAvailability && stayForm.roomTypeId) {
      const selectedType = categoryOptions.find((roomType) => String(roomType.id) === String(stayForm.roomTypeId));
      if (!selectedType?.isSelectable) {
        toast.error('Select an available room category for this stay.');
        return;
      }
    }

    try {
      const guest = await createGuestMutation.mutateAsync(buildReceptionGuestPayload(guestForm));
      await createReservationMutation.mutateAsync(
        buildReceptionReservationPayload({
          ...stayForm,
          guestUserId: guest.id,
        }),
      );
      resetForms();
    } catch {
      // mutation toasts already handle errors
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Walk-In Booking"
        description="Register a guest and secure a same-desk booking from live inventory."
      >
        <Button variant="outline" onClick={resetForms}>
          Reset form
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Today's Walk-ins" value={String(dailyMetrics.walkIns)} description="Created today at desk" icon={Users} />
        <StatsCard title="Today's Revenue" value={formatReceptionCurrency(dailyMetrics.revenue)} description="Walk-in revenue today" icon={Banknote} />
        <StatsCard title="Active Walk-ins" value={String(dailyMetrics.active)} description="Currently checked-in" icon={CalendarClock} />
        <StatsCard title="Pending Room" value={String(dailyMetrics.pending)} description="Needs allocation" icon={Search} />
      </div>

      <form className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]" onSubmit={handleSubmit}>
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Guest profile</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Account details for the arriving guest.</p>
            </div>
            <UserRoundPlus className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>First name</span>
              <input
                className={receptionFieldClassName}
                name="firstName"
                value={guestForm.firstName}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  handleGuestChange('firstName', val);
                }}
              />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Last name</span>
              <input
                className={receptionFieldClassName}
                name="lastName"
                value={guestForm.lastName}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  handleGuestChange('lastName', val);
                }}
              />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Email</span>
              <input className={receptionFieldClassName} name="email" type="email" autoComplete="off" value={guestForm.email} onChange={(event) => handleGuestChange('email', event.target.value)} />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Phone</span>
              <input
                className={receptionFieldClassName}
                name="phone"
                value={guestForm.phone}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^0-9+]/g, '');
                  handleGuestChange('phone', val);
                }}
              />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Password</span>
              <input className={receptionFieldClassName} name="password" type="password" autoComplete="new-password" value={guestForm.password} onChange={(event) => handleGuestChange('password', event.target.value)} />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Gender</span>
              <select className={receptionFieldClassName} name="gender" value={guestForm.profile.gender} onChange={(event) => handleGuestProfileChange('gender', event.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Date of birth</span>
              <input type="date" className={receptionFieldClassName} name="dateOfBirth" value={guestForm.profile.dateOfBirth || ''} onChange={(event) => handleGuestProfileChange('dateOfBirth', event.target.value)} />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>ID type</span>
              <select className={receptionFieldClassName} name="idType" value={guestForm.profile.idType} onChange={(event) => handleGuestProfileChange('idType', event.target.value)}>
                <option value="">Select ID type</option>
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
                name="idNumber"
                value={guestForm.profile.idNumber}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^0-9a-zA-Z-]/g, '');
                  handleGuestProfileChange('idNumber', val);
                }}
              />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Nationality</span>
              <input
                className={receptionFieldClassName}
                name="nationality"
                value={guestForm.profile.nationality}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  handleGuestProfileChange('nationality', val);
                }}
              />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>City</span>
              <input
                className={receptionFieldClassName}
                name="city"
                value={guestForm.profile.city}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  handleGuestProfileChange('city', val);
                }}
              />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Country</span>
              <input
                className={receptionFieldClassName}
                name="country"
                value={guestForm.profile.country || ''}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  handleGuestProfileChange('country', val);
                }}
              />
            </label>
          </div>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Address</span>
            <input className={receptionFieldClassName} name="addressLine1" value={guestForm.profile.addressLine1} onChange={(event) => handleGuestProfileChange('addressLine1', event.target.value)} />
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Guest notes</span>
            <textarea className={receptionTextAreaClassName} name="guestNotes" rows={4} value={guestForm.profile.notes} onChange={(event) => handleGuestProfileChange('notes', event.target.value)} />
          </label>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Stay plan</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Live inventory, rate, and optional room assignment.</p>
            </div>
            <BedDouble className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Check-in date</span>
              <input className={receptionFieldClassName} name="checkInDate" type="date" min={getTodayString()} value={stayForm.checkInDate} onChange={(event) => handleStayChange('checkInDate', event.target.value)} />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Check-out date</span>
              <input className={receptionFieldClassName} name="checkOutDate" type="date" min={stayForm.checkInDate || getTodayString()} value={stayForm.checkOutDate} onChange={(event) => handleStayChange('checkOutDate', event.target.value)} />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Adults</span>
              <input className={receptionFieldClassName} name="adults" type="number" min="1" max="20" value={stayForm.adults} onChange={(event) => handleStayChange('adults', event.target.value)} />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Children</span>
              <input className={receptionFieldClassName} name="children" type="number" min="0" max="20" value={stayForm.children} onChange={(event) => handleStayChange('children', event.target.value)} />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Room category</span>
              <select className={receptionFieldClassName} name="roomTypeId" value={stayForm.roomTypeId} onChange={(event) => handleStayChange('roomTypeId', event.target.value)}>
                <option value="">Select room category</option>
                {categoryOptions.map((roomType) => (
                  <option key={roomType.id} value={roomType.id} disabled={!roomType.isSelectable}>
                    {roomType.name} | {formatReceptionCurrency(roomType.basePrice)} / night{shouldCheckAvailability && !roomType.isSelectable ? ' | unavailable' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Assign room now</span>
              <select className={receptionFieldClassName} name="roomId" value={stayForm.roomId} onChange={(event) => handleStayChange('roomId', event.target.value)} disabled={!stayForm.roomTypeId || matchingRooms.length === 0}>
                <option value="">Leave unassigned for now</option>
                {matchingRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} | Floor {room.floor} | {formatReceptionCurrency(room.effectivePrice)}
                  </option>
                ))}
              </select>
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Booking source</span>
              <select className={receptionFieldClassName} name="bookingSource" value={stayForm.bookingSource} onChange={(event) => handleStayChange('bookingSource', event.target.value)}>
                {bookingSourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Discount amount</span>
              <input className={receptionFieldClassName} name="discountAmount" type="number" min="0" max="100000" value={stayForm.discountAmount} onChange={(event) => handleStayChange('discountAmount', event.target.value)} />
            </label>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Arrival time</span>
              <input className={receptionFieldClassName} name="arrivalTime" value={stayForm.arrivalTime} onChange={(event) => handleStayChange('arrivalTime', event.target.value)} placeholder="2:00 PM" />
            </label>
          </div>

          <div className="rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Category rate</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{selectedRoomType ? formatReceptionCurrency(selectedRoomType.basePrice) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Stay nights</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{nights}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Matching rooms</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{matchingRooms.length}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Estimated total</p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{formatReceptionCurrency(estimatedTotal)}</p>
              </div>
            </div>
            {availabilityError && !availabilityLoading ? (
              <div className="mt-3 rounded-[20px] border border-rose-100 bg-rose-50 p-4 border-l-4 border-l-rose-500">
                <p className="text-sm font-semibold text-rose-800 mb-1">Availability Issue</p>
                <p className="text-xs text-rose-600 leading-tight">{availabilityError}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {availabilityLoading ? 'Checking live room availability...' : 'Live category availability is ready.'}
              </p>
            )}
          </div>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Special requests</span>
            <textarea className={receptionTextAreaClassName} name="specialRequests" rows={4} value={stayForm.specialRequests} onChange={(event) => handleStayChange('specialRequests', event.target.value)} />
          </label>

          <label className={receptionLabelClassName}>
            <span className={receptionLabelTextClassName}>Internal notes</span>
            <textarea className={receptionTextAreaClassName} name="notes" rows={4} value={stayForm.notes} onChange={(event) => handleStayChange('notes', event.target.value)} />
          </label>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForms}>
              Clear
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={createGuestMutation.isPending || createReservationMutation.isPending || availabilityLoading}
            >
              Create walk-in booking
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
