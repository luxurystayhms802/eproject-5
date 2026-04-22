import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coffee,
  Expand,
  HeartHandshake,
  MapPinHouse,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  Users,
  Wifi,
  Wine,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/app/store/auth-store';
import { PublicRoomCard } from '@/features/public/components/public-room-card';
import { PublicSectionHeading } from '@/features/public/components/public-section-heading';
import {
  useCreateReservation,
  useHotelSettings,
  useAvailabilitySearch,
  usePublishedFeedback,
  useRoomType,
  useRoomTypes,
  useRooms,
} from '@/features/public/hooks';
import { reservationBookingSchema } from '@/features/public/schemas';
import {
  attachRoomImagesToRoomTypes,
  buildImageBackdrop,
  formatCurrency,
  getBookingDatesSummary,
  getPrimaryImage,
  getPublicBranding,
  getRoomGalleryForType,
} from '@/features/public/utils';

const getTodayString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const today = new Date();
const addDays = (days) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const getAmenityIcon = (amenity) => {
  const value = String(amenity || '').toLowerCase();

  if (value.includes('wifi') || value.includes('internet')) return Wifi;
  if (value.includes('bath') || value.includes('wash') || value.includes('jacuzzi')) return Bath;
  if (value.includes('bed') || value.includes('sleep')) return BedDouble;
  if (value.includes('breakfast') || value.includes('dining') || value.includes('minibar') || value.includes('coffee')) return Coffee;
  if (value.includes('balcony') || value.includes('view') || value.includes('space')) return Expand;

  return Sparkles;
};

export const RoomDetailsPage = () => {
  const navigate = useNavigate();
  const { roomTypeId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const settingsQuery = useHotelSettings();
  const publishedFeedbackQuery = usePublishedFeedback({ limit: 2 });
  const roomTypeQuery = useRoomType(roomTypeId);
  const relatedRoomTypesQuery = useRoomTypes({ featured: true, isActive: true, limit: 6 });
  const roomsQuery = useRooms({ isActive: true, limit: 200 });
  const createReservation = useCreateReservation();
  const form = useForm({
    resolver: zodResolver(reservationBookingSchema),
    defaultValues: {
      checkInDate: searchParams.get('checkInDate') ?? addDays(2),
      checkOutDate: searchParams.get('checkOutDate') ?? addDays(5),
      adults: Number(searchParams.get('adults') ?? 2),
      children: Number(searchParams.get('children') ?? 0),
      specialRequests: '',
    },
  });

  const branding = getPublicBranding(settingsQuery.data);
  const signatureInclusions = useMemo(
    () => [
      {
        title: 'Arrival rhythm',
        description: `Check-in from ${branding.checkInTime} with a polished handover into the stay.`,
        Icon: Clock3,
      },
      {
        title: 'Flexible reassurance',
        description: branding.cancellationPolicy || 'Clear reservation policies presented before confirmation.',
        Icon: ShieldCheck,
      },
      {
        title: 'In-room rituals',
        description: 'Curated essentials for rest, refreshment, and a seamless overnight experience.',
        Icon: Wine,
      },
    ],
    [branding.cancellationPolicy, branding.checkInTime],
  );
  
  const checkInDate = form.watch('checkInDate');
  const checkOutDate = form.watch('checkOutDate');
  const adults = form.watch('adults');
  const children = form.watch('children');
  const roomType = roomTypeQuery.data;
  const liveRooms = roomsQuery.data?.data ?? [];
  const roomImages = roomType ? getRoomGalleryForType(roomType, liveRooms) : [];
  const galleryImages = roomImages.length ? roomImages : [getPrimaryImage(roomType)].filter(Boolean);
  const [activeImage, setActiveImage] = useState(galleryImages[0] ?? null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => setIsLightboxOpen(false);
  const nextLightboxImage = () => setLightboxIndex((i) => (i + 1) % galleryImages.length);
  const prevLightboxImage = () => setLightboxIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);

  const publishedReviews = publishedFeedbackQuery.data ?? [];
  const guestVoices = publishedReviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    quote: review.comment,
    name: review.guestName,
  }));

  const availabilityQuery = useAvailabilitySearch(
    roomType
      ? {
          roomTypeId: roomType.id,
          checkInDate,
          checkOutDate,
          adults,
          children,
        }
      : null,
  );

  useEffect(() => {
    setActiveImage(galleryImages[0] ?? null);
  }, [roomType?.id, galleryImages]);

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      setSearchParams({
        checkInDate,
        checkOutDate,
        adults: String(adults),
        children: String(children),
      });
    }
  }, [adults, checkInDate, checkOutDate, children, setSearchParams]);

  if (roomTypeQuery.isLoading) {
    return (
      <div className="px-4 md:px-6">
        <div className="mx-auto max-w-[1240px]">
          <Card className="h-[500px] animate-pulse rounded-[36px] bg-white/72" />
        </div>
      </div>
    );
  }

  if (!roomType) {
    return (
      <div className="px-4 md:px-6">
        <div className="mx-auto max-w-[1240px]">
          <Card className="rounded-[34px] p-8">
            <h1 className="font-[var(--font-display)] text-4xl leading-none text-[var(--primary)]">Room category not found</h1>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">The requested room collection could not be loaded.</p>
          </Card>
        </div>
      </div>
    );
  }

  const availabilityForRoomType = availabilityQuery.data?.availableRoomTypes.find((item) => item.id === roomType.id);
  const relatedRooms = attachRoomImagesToRoomTypes(relatedRoomTypesQuery.data?.data ?? [], liveRooms)
    .filter((item) => item.id !== roomType.id)
    .slice(0, 2);
  const nights = getBookingDatesSummary(checkInDate, checkOutDate);
  const hasStayWindow = Boolean(checkInDate && checkOutDate);
  const isValidDateRange = hasStayWindow && nights > 0;
  const heroImage = activeImage ?? getPrimaryImage(roomType);
  const estimatedTotal = availabilityForRoomType?.pricing?.totalAmount ?? roomType.basePrice * Math.max(nights, 1);
  const bookingUrl = `/booking?roomTypeId=${roomType.id}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=${adults}&children=${children}`;
  const amenityShowcase = (roomType.amenities ?? []).map((amenity) => ({
    label: amenity,
    Icon: getAmenityIcon(amenity),
  }));
  const quickFacts = [
    {
      label: 'Room size',
      value: roomType.roomSizeSqFt ? `${roomType.roomSizeSqFt} sq ft` : 'Signature footprint',
    },
    {
      label: 'Guests',
      value: `${roomType.maxAdults} adults / ${roomType.maxChildren} children`,
    },
    {
      label: 'Bed type',
      value: `${roomType.bedCount} ${roomType.bedType}`,
    },
    {
      label: 'Starting from',
      value: formatCurrency(roomType.basePrice, branding.currency),
    },
  ];

  const stayHighlights = [
    {
      title: 'Layered comfort',
      description: 'Quiet palettes, softened lighting, and a composed layout create a calm arrival and an easier evening routine.',
      Icon: SunMedium,
    },
    {
      title: 'Thoughtful room proportions',
      description: roomType.roomSizeSqFt
        ? `${roomType.roomSizeSqFt} sq ft arranged for lounging, working, and unwinding with ease.`
        : 'Balanced hospitality proportions arranged for lounging, working, and unwinding with ease.',
      Icon: MapPinHouse,
    },
    {
      title: 'Live stay confidence',
      description: 'Availability, rate updates, and reservation flow remain tied to the hotel system while the page presents them more elegantly.',
      Icon: HeartHandshake,
    },
  ];

  const factTiles = [
    {
      label: 'Occupancy',
      value: `${roomType.maxAdults} adults`,
      detail: roomType.maxChildren ? `Up to ${roomType.maxChildren} children welcome` : 'Best suited to adult stays',
      Icon: Users,
    },
    {
      label: 'Sleep setting',
      value: `${roomType.bedCount} ${roomType.bedType}`,
      detail: 'Prepared to match the room category configuration',
      Icon: BedDouble,
    },
    {
      label: 'Stay estimate',
      value: formatCurrency(estimatedTotal, branding.currency),
      detail: availabilityForRoomType ? `${nights} nights currently available` : 'Estimate updates once live availability loads',
      Icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-24 pb-0">
      {/* 📸 HERO SECTION (VIP Edge-to-Edge feel) */}
      <section className="px-4 md:px-8 mt-4 lg:mt-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="relative aspect-[4/3] lg:aspect-[21/9] w-full rounded-[32px] overflow-hidden bg-[#0c1622] isolate">
            <img 
              src={heroImage} 
              alt={roomType.name} 
              className="absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-1000" 
            />
            {/* Lighter gradient for less darkness */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1622]/75 via-[#0c1622]/10 to-transparent" />
            
            <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-10 lg:p-14">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm">
                  {galleryImages.length} Views
                </span>
                {galleryImages.length > 1 && (
                  <button type="button" onClick={() => openLightbox(0)} className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors border border-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm cursor-pointer">
                     <ImageIcon className="h-3 w-3" /> View Gallery
                  </button>
                )}
              </div>

              <div className="max-w-3xl max-h-min mt-auto pt-24">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#ecd3a8] drop-shadow-md md:text-[12px]">
                  {roomType.featured ? 'Signature Collection' : 'Room Collection'}
                </p>
                <h1 className="font-[var(--font-display)] text-3xl leading-tight tracking-wide !text-white drop-shadow-xl md:text-4xl lg:text-5xl">
                  {roomType.name}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="px-4 md:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:gap-20 xl:grid-cols-[1fr,420px] items-start">
          
          {/* 🖋 LEFT COLUMN: Editorial Content */}
          <div className="space-y-8 lg:space-y-10">
            
            {/* Description & Inline VIP Stats */}
            <div className="space-y-6">
              <p className="text-[1.15rem] leading-[1.8] text-[#1a2433] max-w-[55ch]">
                {roomType.description || roomType.shortDescription}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-[14px]">
                <div className="bg-white border border-[#c5a059]/20 shadow-sm rounded-2xl px-5 py-3 flex items-center gap-3 text-[#0c1622]">
                  <Users className="h-5 w-5 text-[#c5a059]" />
                  <span>Up to <strong className="font-semibold">{roomType.maxAdults} Adults</strong></span>
                </div>
                <div className="bg-white border border-[#c5a059]/20 shadow-sm rounded-2xl px-5 py-3 flex items-center gap-3 text-[#0c1622]">
                  <BedDouble className="h-5 w-5 text-[#c5a059]" />
                  <span><strong className="font-semibold">{roomType.bedCount} {roomType.bedType}</strong> Bed</span>
                </div>
                {roomType.roomSizeSqFt && (
                  <div className="bg-white border border-[#c5a059]/20 shadow-sm rounded-2xl px-5 py-3 flex items-center gap-3 text-[#0c1622]">
                    <Ruler className="h-4 w-4 text-[#c5a059]" />
                    <span><strong className="font-semibold">{roomType.roomSizeSqFt}</strong> ft²</span>
                  </div>
                )}
              </div>
            </div>

            {/* Elegant Pills Amenities (Not peeka) */}
            <div className="border-t border-[#0c1622]/5 pt-8">
              <h2 className="text-xl font-[var(--font-display)] text-[#0c1622] mb-4">In-room amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(roomType.amenities ?? []).map((item, i) => (
                  <span key={i} className="bg-white border border-[#0c1622]/10 shadow-sm rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#556375]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* VIP Gallery Grid (Bento Style) */}
            {galleryImages.length > 1 && (
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0c1622] mb-5">Visual Exploration</h2>
                <div className={`grid gap-4 ${galleryImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                  {galleryImages.slice(0, 5).map((image, index) => (
                    <button
                      type="button"
                      key={`${roomType.id}-thumb-${index}`}
                      className={`relative overflow-hidden rounded-[24px] cursor-pointer transition-all duration-700 bg-[#fbf9f6] group w-full ${
                        index === 0 && galleryImages.length > 2
                          ? 'col-span-2 row-span-2 aspect-[4/3] lg:aspect-square' 
                          : 'aspect-[4/3] lg:aspect-[4/3.5]'
                      }`}
                      onClick={() => openLightbox(index)}
                    >
                       <img 
                         src={image} 
                         alt="Room View" 
                         className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]" 
                       />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                       {index === 4 && galleryImages.length > 5 && (
                         <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur bg-opacity-40 transition-colors group-hover:bg-black/60">
                           <ImageIcon className="h-6 w-6 text-white mb-2 opacity-80" />
                           <span className="text-white font-bold tracking-[0.2em] uppercase text-xs">+ {galleryImages.length - 5} Views</span>
                         </div>
                       )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Inclusions (Structured list) */}
            <div className="border-t border-[#0c1622]/5 pt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c5a059] mb-2">Highlights</p>
              <h2 className="text-2xl font-[var(--font-display)] text-[#0c1622] mb-5">Stay Signatures</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {signatureInclusions.map(({ title, description, Icon }) => (
                  <div key={title} className="flex gap-3 items-start bg-white border border-[#c5a059]/15 rounded-[20px] p-4 shadow-sm">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fbf9f6] text-[#c5a059]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-[#0c1622]">{title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#556375]">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

             {/* Guest Feedback (if any) */}
            {guestVoices.length > 0 && (
              <div className="border-t border-[#0c1622]/5 pt-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c5a059] mb-2">Feedback</p>
                <h2 className="text-2xl font-[var(--font-display)] text-[#0c1622] mb-6">Guest Impressions</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  {guestVoices.map((review) => (
                    <div key={review.id} className="space-y-4">
                      <div className="flex gap-1.5 text-[#c5a059]">
                         {Array.from({ length: review.rating }).map((_, i) => (
                           <Star key={i} className="h-4 w-4 fill-current" />
                         ))}
                      </div>
                      <p className="font-[var(--font-display)] text-[1.5rem] leading-snug text-[#0c1622]">"{review.quote}"</p>
                      <p className="text-[12px] font-bold tracking-[0.1em] uppercase text-[#8896a6]">{review.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          {/* 💳 RIGHT COLUMN: Sticky Booking Panel */}
          <div className="bg-[#fbf9f6] rounded-[32px] p-8 md:p-10 xl:sticky xl:top-[120px] transition-all duration-500 shadow-[0_10px_40px_rgba(8,24,44,0.03)] border border-[#0c1622]/5">
            <div className="space-y-6">
              <h2 className="font-[var(--font-display)] text-[2.4rem] leading-none text-[#0c1622]">Reserve.</h2>
              <div className="flex items-baseline gap-2 pb-6 border-b border-[#0c1622]/5">
                 <span className="font-[var(--font-display)] text-[3rem] tracking-tight text-[#c5a059] leading-[0.9]">
                   {formatCurrency(estimatedTotal, branding.currency)}
                 </span>
                 <span className="text-[11px] text-[#8896a6] font-bold uppercase tracking-widest">{availabilityForRoomType ? 'Est. Total' : 'From'}</span>
              </div>

              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(async (values) => {
                  if (!user || user.role !== 'guest') {
                    toast.info('Please sign in with a guest account to reserve this stay.');
                    navigate('/login');
                    return;
                  }

                  await createReservation.mutateAsync({
                    ...values,
                    roomTypeId: roomType.id,
                  });
                  navigate('/guest/dashboard');
                })}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8896a6] ml-2">Arrive</label>
                    <input type="date" min={getTodayString()} className="w-full rounded-2xl border-0 bg-white shadow-sm px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#c5a059]" {...form.register('checkInDate')} />
                    {form.formState.errors.checkInDate && <p className="text-xs text-rose-500 px-2">{form.formState.errors.checkInDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8896a6] ml-2">Depart</label>
                    <input type="date" min={checkInDate || getTodayString()} className="w-full rounded-2xl border-0 bg-white shadow-sm px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#c5a059]" {...form.register('checkOutDate')} />
                    {form.formState.errors.checkOutDate && <p className="text-xs text-rose-500 px-2">{form.formState.errors.checkOutDate.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8896a6] ml-2">Adults</label>
                    <input type="number" min={1} max={roomType.maxAdults} className="w-full rounded-2xl border-0 bg-white shadow-sm px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#c5a059]" {...form.register('adults', { valueAsNumber: true })} />
                    {adults > roomType.maxAdults && <p className="text-xs text-rose-500 px-2 mt-1 leading-tight">Maximum {roomType.maxAdults} adults allowed.</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8896a6] ml-2">Children</label>
                    <input type="number" min={0} max={roomType.maxChildren} className="w-full rounded-2xl border-0 bg-white shadow-sm px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#c5a059]" {...form.register('children', { valueAsNumber: true })} />
                    {children > roomType.maxChildren && <p className="text-xs text-rose-500 px-2 mt-1 leading-tight">Maximum {roomType.maxChildren} children allowed.</p>}
                  </div>
                </div>

                {!isValidDateRange && hasStayWindow ? (
                   <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 border-l-4 border-l-amber-500">
                     <p className="text-sm font-bold text-amber-800 mb-1">Invalid Stay Dates</p>
                     <p className="text-xs text-amber-700 leading-tight">Your check-out date must be at least one day after your check-in date. Please adjust your dates above.</p>
                   </div>
                ) : availabilityQuery.isLoading ? (
                  <p className="text-xs font-semibold text-[#8896a6] animate-pulse">Confirming live availability...</p>
                ) : availabilityForRoomType ? (
                  <div className="rounded-2xl bg-[#0c1622]/5 p-5 text-sm space-y-3">
                     <p className="text-[#0c1622] font-semibold flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                       Dates are available
                     </p>
                     <div className="flex justify-between text-[#556375]">
                        <span>{nights} Nights @ {formatCurrency(availabilityForRoomType.pricing.totalAmount / Math.max(nights, 1), branding.currency)} / night</span>
                     </div>
                  </div>
                ) : (adults > roomType.maxAdults || children > roomType.maxChildren) ? (
                  <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 border-l-4 border-l-rose-500">
                    <p className="text-sm font-bold text-rose-800 mb-1">Capacity Exceeded</p>
                    <p className="text-xs text-rose-700 leading-tight">This room can accommodate a maximum of {roomType.maxAdults} adults and {roomType.maxChildren} children. Please reduce the number of guests or book multiple rooms.</p>
                  </div>
                ) : hasStayWindow ? (
                  <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 border-l-4 border-l-rose-500">
                    <p className="text-sm font-bold text-rose-800 mb-1">Room Unavailable</p>
                    <p className="text-xs text-rose-700 leading-tight">Dates unavailable. Please adjust your stay window.</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full rounded-full h-[3.8rem] px-8 bg-[#0c1622] text-[#ecd3a8] hover:bg-[#152336] shadow-xl hover:shadow-2xl hover:-translate-y-1 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 border-none mt-4 disabled:opacity-50 disabled:hover:shadow-none"
                  disabled={createReservation.isPending || !isValidDateRange || availabilityQuery.isLoading || (hasStayWindow && !availabilityForRoomType) || adults > roomType.maxAdults || children > roomType.maxChildren}
                >
                  {createReservation.isPending
                    ? 'Wait...'
                    : user?.role === 'guest'
                      ? 'Confirm Stay'
                      : 'Sign in to reserve'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Related Rooms - Keeping minimalist */}
      {relatedRooms.length > 0 && (
        <section className="px-4 md:px-8 mt-32 mb-0">
          <div className="bg-white rounded-[48px] shadow-[0_20px_80px_rgba(8,24,44,0.03)] border border-[#0c1622]/5 p-10 md:p-16 lg:p-20 max-w-[1500px] mx-auto">
            <div className="mx-auto max-w-[1400px] mb-16 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#c5a059] mb-5">Further Options</p>
              <h2 className="text-4xl lg:text-5xl font-[var(--font-display)] text-[#0c1622] leading-tight">Continue Exploring.</h2>
            </div>
            <div className="mx-auto max-w-[1400px]">
              <div className="grid gap-x-12 gap-y-16 lg:gap-16 lg:grid-cols-2">
                {relatedRooms.map((room) => (
                  <PublicRoomCard
                    key={room.id}
                    room={room}
                    currency={branding.currency}
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    adults={adults}
                    children={children}
                    align="vertical"
                  />
                ))}
              </div>
              <div className="flex justify-center mt-16 pt-10 border-t border-black/5">
                 <Link to="/rooms">
                   <Button variant="ghost" className="rounded-full px-10 h-12 bg-black/[0.03] text-[#0c1622] hover:bg-black/10 text-[11px] font-black tracking-[0.2em] uppercase transition-all">
                     View Complete Collection
                   </Button>
                 </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VIP LUXURY LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0c1622]/95 backdrop-blur-xl">
          {/* Close Header */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-5 z-50">
            <p className="text-white/60 text-[11px] uppercase tracking-[0.3em] font-bold">
              {lightboxIndex + 1} / {galleryImages.length}
            </p>
            <button 
              type="button"
              className="text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/20 rounded-full p-2 backdrop-blur-md"
              onClick={closeLightbox}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Main Image View */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
             <img 
               src={galleryImages[lightboxIndex]} 
               alt="Gallery Full View" 
               className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl drop-shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-opacity duration-300"
             />
          </div>

          {/* Navigation Controls */}
          {galleryImages.length > 1 && (
            <>
              <button 
                type="button"
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-3 md:p-4 rounded-full backdrop-blur transition-all"
                onClick={prevLightboxImage}
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button 
                type="button"
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-3 md:p-4 rounded-full backdrop-blur transition-all"
                onClick={nextLightboxImage}
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </>
          )}

          {/* Filmstrip Thumbnails */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
             <div className="flex gap-2 p-3 bg-black/40 backdrop-blur-md rounded-2xl max-w-full overflow-x-auto scrollbar-invisible">
               {galleryImages.map((img, idx) => (
                 <button
                   key={idx}
                   type="button"
                   onClick={() => setLightboxIndex(idx)}
                   className={`relative h-14 w-20 md:h-16 md:w-24 shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${lightboxIndex === idx ? 'ring-2 ring-white scale-105 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                 >
                   <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
