import { useEffect, useMemo, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ChevronLeft, ShieldCheck, Sparkles, Users, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/app/store/auth-store';
import { PublicPageHero } from '@/features/public/components/public-page-hero';
import { PublicSectionHeading } from '@/features/public/components/public-section-heading';
import { useCreateReservation, useHotelSettings, useAvailabilitySearch, useRoomTypes, useRooms } from '@/features/public/hooks';
import { reservationBookingSchema } from '@/features/public/schemas';
import { attachRoomImagesToRoomTypes, buildImageBackdrop, formatCurrency, getBookingDatesSummary, getPrimaryImage, getPublicBranding } from '@/features/public/utils';

const getTodayString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const today = new Date();
const addDays = (days) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const bookingTrustPoints = [
  'Curated room categories and elegant stay planning',
  'Guest account access for reservations and invoices',
  'Clear pricing before you complete the stay',
];

export const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);
  const checkoutFormRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const settingsQuery = useHotelSettings();
  const roomTypesQuery = useRoomTypes({ isActive: true, limit: 24 });
  const roomsQuery = useRooms({ isActive: true, limit: 200 });
  const createReservation = useCreateReservation();
  const liveRooms = roomsQuery.data?.data ?? [];
  const roomTypes = attachRoomImagesToRoomTypes(roomTypesQuery.data?.data ?? [], liveRooms);
  const branding = getPublicBranding(settingsQuery.data);

  const form = useForm({
    resolver: zodResolver(reservationBookingSchema),
    defaultValues: {
      roomTypeId: searchParams.get('roomTypeId') ?? '',
      checkInDate: searchParams.get('checkInDate') ?? addDays(2),
      checkOutDate: searchParams.get('checkOutDate') ?? addDays(5),
      adults: Number(searchParams.get('adults') ?? 2),
      children: Number(searchParams.get('children') ?? 0),
      specialRequests: '',
    },
  });

  const roomTypeId = form.watch('roomTypeId');
  const checkInDate = form.watch('checkInDate');
  const checkOutDate = form.watch('checkOutDate');
  const rawAdults = form.watch('adults');
  const rawChildren = form.watch('children');

  const adults = Number.isNaN(rawAdults) ? 1 : Math.max(1, rawAdults);
  const children = Number.isNaN(rawChildren) ? 0 : Math.max(0, rawChildren);

  const slowScrollTo = (ref) => {
    if (!ref.current) return;
    const targetPosition = ref.current.getBoundingClientRect().top + window.pageYOffset - 190;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      // easeInOutQuad
      let t = timeElapsed / (1500 / 2); // 1.5 seconds duration
      let run = 0;
      if (t < 1) run = (distance / 2) * t * t + startPosition;
      else {
        t--;
        run = (-distance / 2) * (t * (t - 2) - 1) + startPosition;
      }
      window.scrollTo(0, run);
      if (timeElapsed < 1500) requestAnimationFrame(animation);
    };
    requestAnimationFrame(animation);
  };

  useEffect(() => {
    setSearchParams({
      roomTypeId: roomTypeId || '',
      checkInDate,
      checkOutDate,
      adults: String(adults),
      children: String(children),
    }, { replace: true });
  }, [adults, checkInDate, checkOutDate, children, roomTypeId, setSearchParams]);

  useEffect(() => {
    // Force scroll to top on mount so the smooth scroll effect is visible to the user
    window.scrollTo(0, 0);

    // If the user arrived with a checkInDate in the URL (e.g. from homepage search), auto-scroll
    if (window.location.search.includes('checkInDate')) {
      setTimeout(() => {
        // If they already have a room selected, scroll to the checkout form. Otherwise, scroll to the grid.
        if (window.location.search.includes('roomTypeId=') && checkoutFormRef.current) {
          slowScrollTo(checkoutFormRef);
        } else if (resultsRef.current) {
          slowScrollTo(resultsRef);
        }
      }, 800); // Increased delay to let the page render and user register the top before scrolling
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availabilityQuery = useAvailabilitySearch(
    checkInDate && checkOutDate
      ? {
          checkInDate,
          checkOutDate,
          adults,
          children,
        }
      : null,
  );

  const availableRoomTypes = availabilityQuery.data?.availableRoomTypes ?? [];
  const selectedRoomType = roomTypes.find((room) => room.id === roomTypeId) ?? null;
  const selectedAvailability = availableRoomTypes.find((room) => room.id === roomTypeId);
  const nights = getBookingDatesSummary(checkInDate, checkOutDate);
  const hasStayWindow = Boolean(checkInDate && checkOutDate);
  const isValidDateRange = hasStayWindow && nights > 0;
  const isSelectedRoomAvailable = !hasStayWindow ? true : Boolean(selectedAvailability);
  
  const estimatedTotal = selectedAvailability?.pricing?.totalAmount ?? Number(selectedRoomType?.basePrice ?? 0) * Math.max(nights, 1);
  const selectedImage = getPrimaryImage(selectedRoomType || roomTypes[0]);
  const availableCategoryCount = hasStayWindow ? availableRoomTypes.length : roomTypes.length;

  const bookingSummaryItems = useMemo(
    () => [
      {
        label: 'Stay nights',
        value: String(nights),
      },
      {
        label: 'Guests',
        value: `${adults} Adults / ${children} Child${children !== 1 ? 'ren' : ''}`,
      },
      {
        label: 'Estimated total',
        value: selectedRoomType ? formatCurrency(estimatedTotal, branding.currency) : '--',
      },
    ],
    [adults, branding.currency, children, estimatedTotal, nights, selectedRoomType],
  );

  const handleCreateReservation = form.handleSubmit(async (values) => {
    if (!values.roomTypeId) {
      toast.error('Please select a room category before continuing.');
      return;
    }

    if (!isSelectedRoomAvailable) {
      toast.error('The selected room category is not currently available for your stay dates.');
      return;
    }

    if (!user || user.role !== 'guest') {
      toast.info('Please sign in with a guest account to complete the reservation.');
      const returnTo = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }

    await createReservation.mutateAsync(values);
    navigate('/guest/dashboard');
  });

  return (
    <div className="space-y-16 pb-16">
      <section className="px-4 pt-4 md:px-6">
        <div className="mx-auto max-w-[1380px]">
          <div className="relative overflow-hidden rounded-[40px] bg-[#0c1420] shadow-[0_20px_40px_rgba(10,20,30,0.12)] min-h-[380px]">
            {selectedImage ? <img src={selectedImage} alt="Luxury Stay Reservation" className="absolute inset-0 h-full w-full object-cover" /> : null}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,20,32,0.86)_0%,rgba(10,20,32,0.26)_100%)]" />
            <div className="relative z-10 flex min-h-[380px] flex-col items-center justify-center px-6 py-12 text-center text-white md:px-12">
               <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#ecd3a8] backdrop-blur-md">
                 Reservation
               </span>
               <h1 className="mt-6 font-[var(--font-display)] text-5xl leading-[1.05] drop-shadow-lg md:text-[4rem] text-balance">
                 Plan your stay with absolute clarity.
               </h1>
               <p className="mt-6 max-w-2xl text-[1.1rem] leading-relaxed text-white/80">
                 Explore availability, review premium accommodations, and effortlessly secure your reservation.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: Stay Configuration Bar */}
      <section className="px-4 md:px-6 relative lg:sticky lg:top-20 z-30">
        <div className="mx-auto max-w-[1380px]">
          <Card className="rounded-[24px] border border-[var(--border)] bg-white/95 p-3 shadow-xl backdrop-blur-xl transition-all hover:bg-white md:p-4">
            <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
              <div className="space-y-1 lg:col-span-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] ml-2">Check-in</label>
                <input type="date" min={getTodayString()} className="w-full rounded-[16px] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]" {...form.register('checkInDate')} />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] ml-2">Check-out</label>
                <input type="date" min={checkInDate || getTodayString()} className="w-full rounded-[16px] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]" {...form.register('checkOutDate')} />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] ml-2">Adults</label>
                <input type="number" min={1} className="w-full rounded-[16px] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]" {...form.register('adults', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] ml-2">Children</label>
                <input type="number" min={0} className="w-full rounded-[16px] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]" {...form.register('children', { valueAsNumber: true })} />
              </div>
              <div className="flex h-full items-end lg:col-span-1">
                 {availabilityQuery.isFetching ? (
                   <div className="h-10 w-full rounded-full flex items-center justify-center bg-slate-100 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                     Checking...
                   </div>
                 ) : (
                   <div className="h-10 w-full rounded-full flex items-center justify-center bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.2em]">
                     {availableCategoryCount} Available
                   </div>
                 )}
              </div>
            </form>
          </Card>
        </div>
      </section>

      <section className="px-4 md:px-6 scroll-mt-40" ref={resultsRef} id="results">
        <div className="mx-auto max-w-[1380px]">
          
          {/* Step 2: Room Selection (Grid View) or Checkout View */}
          {!roomTypeId ? (
            <div className="space-y-10 min-h-[50vh]">
              <div className="text-center space-y-3">
                <h2 className="font-[var(--font-display)] text-3xl md:text-5xl text-[var(--primary)]">Select an Accommodation</h2>
                <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto">Browse available room categories for your chosen dates and occupancy to proceed to the checkout flow.</p>
              </div>

              {!isValidDateRange ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-[32px] bg-amber-50/50 border border-amber-100">
                  <Info className="h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-2xl font-[var(--font-display)] text-amber-900">Invalid Stay Dates</h3>
                  <p className="mt-2 text-amber-700/80">Your check-out date must be at least one day after your check-in date. Please adjust your dates above.</p>
                </div>
              ) : availabilityQuery.isFetching ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-[32px] bg-[var(--accent-soft)] border border-[var(--border)] transition-opacity duration-300">
                  <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--primary)] border-t-transparent mb-4" />
                  <h3 className="text-2xl font-[var(--font-display)] text-[var(--primary)]">Searching Availability</h3>
                  <p className="mt-2 text-[var(--muted-foreground)]">Please wait while we check our live inventory...</p>
                </div>
              ) : availableRoomTypes.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {availableRoomTypes.map((room) => (
                    <Card 
                      key={room.id} 
                      className="overflow-hidden rounded-[32px] flex flex-col hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                      onClick={() => {
                        form.setValue('roomTypeId', room.id);
                        
                        // Wait for React to render the new checkout DOM
                        setTimeout(() => {
                          // 1. Instantly jump to the top of the section (where 'Back to Rooms' is)
                          if (resultsRef.current) {
                            const topTarget = resultsRef.current.getBoundingClientRect().top + window.pageYOffset - 190;
                            window.scrollTo({ top: topTarget, behavior: 'instant' });
                          }
                          
                          // 2. Smoothly scroll down to the Checkout Form after a tiny delay
                          setTimeout(() => {
                            slowScrollTo(checkoutFormRef);
                          }, 50);
                        }, 0);
                      }}
                    >
                      <div className="h-56 w-full relative">
                        <img src={getPrimaryImage(room)} alt={room.name} className="h-full w-full object-cover" />
                        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold shadow-md text-[var(--primary)]">
                          {formatCurrency(room.basePrice, branding.currency)} / night
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-2xl font-[var(--font-display)] text-[var(--primary)]">{room.name}</h3>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)] flex-1">{room.shortDescription || 'A beautifully appointed space designed for relaxation and comfort.'}</p>
                        
                        <div className="mt-5 space-y-5">
                          <div className="flex flex-wrap gap-2">
                            {(room.amenities ?? []).slice(0, 3).map((amenity) => (
                              <span key={amenity} className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                                {amenity}
                              </span>
                            ))}
                            {(room.amenities ?? []).length > 3 && (
                               <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                                +{(room.amenities?.length ?? 0) - 3} more
                              </span>
                            )}
                          </div>
                          <Button 
                            className="w-full rounded-full py-6 text-sm font-semibold tracking-wide pointer-events-none" 
                          >
                            Select this room
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-[32px] bg-[var(--accent-soft)] border border-[var(--border)]">
                  <Info className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
                  <h3 className="text-2xl font-[var(--font-display)] text-[var(--primary)]">No availability for these dates</h3>
                  <p className="mt-2 text-[var(--muted-foreground)]">Try adjusting your check-in dates, check-out dates, or guest count to discover available accommodations.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              <Button variant="outline" className="rounded-full bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] hover:text-[var(--primary)] shadow-sm hover:shadow-md transition-all border-[var(--border)] px-5 h-10" onClick={() => form.setValue('roomTypeId', '')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Rooms
              </Button>
              <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] items-start">
                
                {/* Left Column: Room Preview */}
                <div className="space-y-4">
                  <Card className="overflow-hidden rounded-[24px] p-0 border border-[var(--border)]">
                    <div className="h-[250px] w-full" style={buildImageBackdrop(selectedImage, 0)}>
                      <div className="flex h-[250px] items-end bg-[linear-gradient(180deg,rgba(8,24,44,0.02),rgba(8,24,44,0.55))] p-6 text-white">
                        <div className="space-y-2">
                          <h2 className="font-[var(--font-display)] text-4xl leading-none text-white drop-shadow-md">
                            {selectedRoomType?.name}
                          </h2>
                          <div className="flex flex-wrap gap-3">
                            {(selectedRoomType?.amenities ?? []).slice(0, 5).map((amenity) => (
                              <span key={amenity} className="rounded-full bg-black/40 backdrop-blur-md px-4 py-1.5 text-xs font-semibold tracking-wide text-white border border-white/20">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                       <h3 className="text-lg font-semibold mb-2">Room Overview</h3>
                       <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)]">{selectedRoomType?.description || selectedRoomType?.shortDescription || 'An elegant accommodation offering exceptional comfort and refined aesthetics, tailored for your premium stay.'}</p>
                    </div>
                  </Card>

                  <Card className="rounded-[24px] bg-[linear-gradient(145deg,#091220,#132540)] p-6 text-white before:hidden shadow-xl">
                    <div className="space-y-4">
                      <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f3d7aa]">
                        Stay Policies
                      </span>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-[16px] border border-white/12 bg-white/5 p-4">
                          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
                            <ShieldCheck className="h-4 w-4 text-[#f3d7aa]" />
                            Cancellation
                          </p>
                          <p className="mt-2 text-[13px] leading-5 text-white/80">{branding.cancellationPolicy}</p>
                        </div>
                        <div className="rounded-[16px] border border-white/12 bg-white/5 p-4">
                          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
                            <Users className="h-4 w-4 text-[#f3d7aa]" />
                            Guest Account
                          </p>
                          <p className="mt-2 text-[13px] leading-5 text-white/80">You'll need a guest account to complete this booking, providing a single portal for all invoices, key updates, and operational support.</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column: Sticky Checkout Form */}
                <div className="sticky top-20" ref={checkoutFormRef}>
                  <form onSubmit={handleCreateReservation}>
                    <Card className="rounded-[24px] p-5 md:p-6 shadow-[0_20px_40px_rgba(16,36,63,0.06)] border border-[var(--border)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Sparkles className="w-32 h-32" />
                      </div>
                      
                      <div className="mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] mb-1">Finalize Reservation</p>
                        <h2 className="font-[var(--font-display)] text-3xl leading-tight text-[var(--primary)]">Checkout Summary</h2>
                      </div>

                      {/* Availability feedback */}
                      <div className="mb-8">
                        {!isValidDateRange ? (
                           <div className="rounded-[20px] bg-amber-50 border border-amber-100 p-4 border-l-4 border-l-amber-500">
                              <p className="text-sm font-semibold text-amber-800 mb-1">Invalid Stay Dates</p>
                              <p className="text-xs text-amber-700 leading-tight">Your check-out date must be at least one day after your check-in date. Please adjust your dates to continue.</p>
                           </div>
                        ) : availabilityQuery.isFetching ? (
                           <div className="rounded-[20px] bg-blue-50/50 border border-blue-100 p-4 border-l-4 border-l-blue-400 flex items-center gap-3">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                              <p className="text-sm font-semibold text-blue-800">Checking availability...</p>
                           </div>
                        ) : isSelectedRoomAvailable ? (
                           <div className="rounded-[20px] bg-emerald-50 border border-emerald-100 p-4 border-l-4 border-l-emerald-500 flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              <p className="text-sm font-semibold text-emerald-800">Your selection is available!</p>
                           </div>
                        ) : (adults > selectedRoomType?.maxAdults || children > selectedRoomType?.maxChildren) ? (
                           <div className="rounded-[20px] bg-rose-50 border border-rose-100 p-4 border-l-4 border-l-rose-500">
                              <p className="text-sm font-semibold text-rose-800 mb-1">Capacity Exceeded</p>
                              <p className="text-xs text-rose-600 leading-tight">
                                This room can accommodate a maximum of {selectedRoomType.maxAdults} adults and {selectedRoomType.maxChildren} children. Please reduce the number of guests or select a different room.
                              </p>
                           </div>
                        ) : (
                           <div className="rounded-[20px] bg-rose-50 border border-rose-100 p-4 border-l-4 border-l-rose-500">
                              <p className="text-sm font-semibold text-rose-800 mb-1">Room Unavailable</p>
                              <p className="text-xs text-rose-600 leading-tight">This room category does not have availability for your selected date range. Please modify your stay dates or select another room.</p>
                           </div>
                        )}
                      </div>

                      {/* Key details */}
                      <div className="space-y-3 mb-6 opacity-90">
                        {bookingSummaryItems.map((item) => (
                          <div key={item.label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                            <p className="text-xs font-semibold text-[var(--muted-foreground)]">{item.label}</p>
                            <p className="font-[var(--font-display)] text-xl text-[var(--primary)]">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 mb-6">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)] flex items-center justify-between">
                          <span>Any special requests?</span>
                          {form.formState.errors.specialRequests && (
                            <span className="text-rose-500 lowercase normal-case tracking-normal text-xs">{form.formState.errors.specialRequests.message}</span>
                          )}
                        </label>
                        <textarea 
                          rows={2} 
                          className={`w-full rounded-[16px] border ${form.formState.errors.specialRequests ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-[var(--border)] focus:ring-[var(--primary)]'} bg-[var(--accent-soft)] px-4 py-3 text-[13px] focus:ring-2 outline-none transition-colors`} 
                          placeholder="Arrival preferences, celebration notes, or room setup expectations." 
                          {...form.register('specialRequests')} 
                        />
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-200">
                        <Button
                          type="submit"
                          variant="secondary"
                          className="w-full rounded-[16px] py-5 text-sm font-bold tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                          disabled={!isValidDateRange || createReservation.isPending || roomTypesQuery.isLoading || availabilityQuery.isFetching || !selectedRoomType || !isSelectedRoomAvailable || (adults > selectedRoomType?.maxAdults || children > selectedRoomType?.maxChildren)}
                        >
                          {createReservation.isPending
                            ? 'Creating reservation...'
                            : !isValidDateRange
                              ? 'Select Valid Dates'
                              : availabilityQuery.isFetching
                                ? 'Refreshing availability...'
                                : user?.role === 'guest'
                                  ? 'Complete Booking'
                                  : 'Sign In required to Book'}
                        </Button>
                        <p className="text-[11px] text-center font-medium text-[var(--muted-foreground)]">
                          Your reservation will be created immediately. No credit card is required at this step. You will settle your folio at the concierge desk upon arrival.
                        </p>
                      </div>
                    </Card>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
