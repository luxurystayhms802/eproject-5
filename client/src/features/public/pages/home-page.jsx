import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CarFront,
  ConciergeBell,
  Gem,
  Sparkles,
  Star,
  UtensilsCrossed,
  Users,
  Waves,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { guestTestimonials } from '@/features/public/content';
import { useHotelSettings, usePublishedFeedback, useRoomTypes, useRooms } from '@/features/public/hooks';
import { availabilitySearchSchema } from '@/features/public/schemas';
import { attachRoomImagesToRoomTypes, formatCurrency, getPrimaryImage, getPublicBranding, getBookingDatesSummary } from '@/features/public/utils';

const getTodayString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const today = new Date();
const addDays = (days) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const amenities = [
  {
    icon: Sparkles,
    title: 'Spa & Wellness',
    description: 'Private treatments and restorative rituals shaped for slower mornings.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Fine Dining',
    description: 'Elegant dining rooms, seasonal menus, and polished evening service.',
  },
  {
    icon: Waves,
    title: 'Infinity Pool',
    description: 'A quiet poolside setting for leisure, recovery, and soft afternoon light.',
  },
  {
    icon: CarFront,
    title: 'Airport Transfer',
    description: 'Comfortable arrivals and departures handled with warm discretion.',
  },
  {
    icon: ConciergeBell,
    title: '24/7 Concierge',
    description: 'Dining reservations, itineraries, and attentive guest assistance at any hour.',
  },
  {
    icon: Gem,
    title: 'Private Lounge',
    description: 'An intimate lounge for coffee, meetings, and quieter moments between plans.',
  },
];

const amenityHighlights = [
  'Private wellness rituals',
  'Table reservations on request',
  'Arrival-to-departure guest assistance',
];

const aboutHighlights = [
  'Editorial room styling with calmer proportions',
  'Warm, attentive service from arrival to departure',
  'A quieter five-star atmosphere in the heart of the city',
];

const Typewriter = ({ words, typingSpeed = 90, deletingSpeed = 40, pauseTime = 2500 }) => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    let timer;
    const currentWord = words[loopNum % words.length];

    if (isDeleting) {
      if (text === '') {
        setIsDeleting(false);
        setLoopNum((prev) => prev + 1);
      } else {
        timer = setTimeout(() => {
          setText(currentWord.substring(0, text.length - 1));
        }, deletingSpeed);
      }
    } else {
      if (text === currentWord) {
        timer = setTimeout(() => setIsDeleting(true), pauseTime);
      } else {
        timer = setTimeout(() => {
          setText(currentWord.substring(0, text.length + 1));
        }, typingSpeed);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, words, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <span className="inline-block text-[var(--accent-strong)] italic">
      {text}
      <span className="animate-[pulse_0.8s_ease-in-out_infinite] ml-[1px] font-sans font-light not-italic text-[var(--accent)]">|</span>
    </span>
  );
};

const SectionHeading = ({ eyebrow, title, description, centered = false }) => (
  <div className={centered ? 'mx-auto max-w-[50rem] text-center flex flex-col items-center' : 'max-w-[40rem]'}>
    <span className="inline-flex rounded-full border border-[rgba(184,140,74,0.18)] bg-[var(--accent-soft)]/65 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[var(--accent-strong)]">
      {eyebrow}
    </span>
    <h2 className={`mt-4 font-[var(--font-display)] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--primary)] text-[clamp(1.85rem,3.2vw,2.75rem)] ${centered ? 'w-full' : 'max-w-[28ch]'} min-h-[4rem] sm:min-h-0`}>
      {title}
    </h2>
    <p className={`mt-3.5 text-[0.92rem] md:text-base leading-[1.75] text-[var(--muted-foreground)] ${centered ? 'max-w-[62ch]' : 'max-w-[66ch]'}`}>
      {description}
    </p>
  </div>
);

const BookingBar = ({ form, onSubmit }) => {
  const checkInDate = form.watch('checkInDate');
  const checkOutDate = form.watch('checkOutDate');
  const nights = getBookingDatesSummary(checkInDate, checkOutDate);
  const isValidDateRange = Boolean(checkInDate && checkOutDate) && nights > 0;

  return (
    <div className="relative">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-2 md:gap-3 rounded-[28px] lg:rounded-full border border-white/20 bg-white/10 p-2 lg:p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-md md:grid-cols-[1fr_1fr_0.82fr_auto] relative z-10"
      >
        <div className="rounded-[20px] lg:rounded-full bg-white/85 px-5 py-3 shadow-sm ring-1 ring-black/5 transition-all hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--accent)]">
          <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Check-in</label>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--primary)]" />
            <input
              type="date"
              min={getTodayString()}
              className="w-full bg-transparent text-[13px] font-semibold text-[var(--primary)] outline-none"
              {...form.register('checkInDate')}
            />
          </div>
        </div>

        <div className="rounded-[20px] lg:rounded-full bg-white/85 px-5 py-3 shadow-sm ring-1 ring-black/5 transition-all hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--accent)]">
          <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Check-out</label>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--primary)]" />
            <input
              type="date"
              min={form.watch('checkInDate') || getTodayString()}
              className="w-full bg-transparent text-[13px] font-semibold text-[var(--primary)] outline-none"
              {...form.register('checkOutDate')}
            />
          </div>
        </div>

        <div className="rounded-[20px] lg:rounded-full bg-white/85 px-5 py-3 shadow-sm ring-1 ring-black/5 transition-all hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--accent)]">
          <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Guests</label>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-[var(--primary)]" />
            <select className="w-full cursor-pointer bg-transparent text-[13px] font-semibold text-[var(--primary)] outline-none" {...form.register('adults', { valueAsNumber: true })}>
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count} Guest{count > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button type="submit" disabled={!isValidDateRange} className="h-full w-full lg:w-auto rounded-[20px] lg:rounded-full bg-[var(--primary)] px-8 py-3 sm:py-4 text-[13px] font-semibold tracking-[0.05em] text-white shadow-md transition hover:bg-[var(--accent)] disabled:opacity-75 disabled:hover:bg-[var(--primary)]">
          Search Rooms
        </Button>

        <input type="hidden" {...form.register('children', { valueAsNumber: true })} />
      </form>

      {!isValidDateRange && (
        <div className="mt-3 rounded-[20px] bg-amber-50 border border-amber-100 p-4 border-l-4 border-l-amber-500 shadow-xl mx-1 lg:mx-0">
          <p className="text-sm font-bold text-amber-900 mb-1">Invalid Stay Dates</p>
          <p className="text-xs text-amber-800 leading-tight">Your check-out date must be at least one day after your check-in date. Please adjust your dates above.</p>
        </div>
      )}
    </div>
  );
};

const RoomCard = ({ room, currency, checkInDate, checkOutDate, adults }) => {
  const rate = Number(room.pricing?.ratePerNight ?? room.basePrice ?? 0);
  const image = getPrimaryImage(room);

  return (
    <article className="group overflow-hidden rounded-[22px] bg-white/88 shadow-[0_16px_34px_rgba(13,28,46,0.06)] ring-1 ring-black/5">
      <div className="relative aspect-[4/3.2] overflow-hidden bg-[linear-gradient(135deg,#223652,#425e80)]">
        {image ? <img src={image} alt={room.name} className="public-media h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,18,30,0.04),rgba(9,18,30,0.18))]" />
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="space-y-2">
          <h3 className="text-[1.22rem] leading-tight text-[var(--primary)]">{room.name}</h3>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {room.shortDescription || 'A refined stay with warm interiors, tailored comfort, and a quietly premium feel.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-[12px] text-[var(--muted-foreground)]">
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--accent-strong)]" />
            {room.maxAdults || 2} Guests
          </span>
          <span className="inline-flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-[var(--accent-strong)]" />
            {room.bedType ? `${room.bedType} Bed` : 'Luxury Bed'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-black/6 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">From</p>
            <p className="mt-1 text-base font-semibold text-[var(--primary)]">
              {formatCurrency(rate, currency)} <span className="text-sm font-normal text-[var(--muted-foreground)]">/ night</span>
            </p>
          </div>
          <Link
            to={`/rooms/${room.slug || room.id}?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=${adults}&children=0`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition hover:text-[var(--accent-strong)]"
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};

const VIPTestimonialCarousel = ({ testimonials }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (testimonials.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length, isHovered]);

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div 
      className="relative w-full max-w-7xl mx-auto overflow-hidden py-10 lg:py-14 flex flex-col justify-center items-center min-h-[400px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full max-w-[1000px] h-[300px] md:h-[320px] lg:h-[340px] flex items-center justify-center perspective-[1000px]">
        {testimonials.map((review, index) => {
          let diff = index - activeIndex;
          if (diff < -testimonials.length / 2) diff += testimonials.length;
          if (diff > testimonials.length / 2) diff -= testimonials.length;

          let positionClass = '';
          let zIndexClass = '';
          
          if (diff === 0) {
            positionClass = 'translate-x-0 scale-100 opacity-100 blur-none';
            zIndexClass = 'z-30';
          } else if (diff === -1) {
            positionClass = 'translate-x-0 md:-translate-x-[65%] lg:-translate-x-[85%] scale-[0.75] opacity-0 md:opacity-50 blur-none md:blur-[3px] cursor-pointer';
            zIndexClass = 'z-20';
          } else if (diff === 1) {
            positionClass = 'translate-x-0 md:translate-x-[65%] lg:translate-x-[85%] scale-[0.75] opacity-0 md:opacity-50 blur-none md:blur-[3px] cursor-pointer';
            zIndexClass = 'z-20';
          } else {
            positionClass = `${diff < 0 ? '-translate-x-[120%]' : 'translate-x-[120%]'} scale-50 opacity-0 blur-[6px] pointer-events-none`;
            zIndexClass = 'z-0';
          }

          return (
            <div
              key={review.id}
              className={`absolute top-0 left-1/2 -ml-[140px] sm:-ml-[160px] md:-ml-[190px] lg:-ml-[210px] w-[280px] sm:w-[320px] md:w-[380px] lg:w-[420px] h-full transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${positionClass} ${zIndexClass}`}
              onClick={() => {
                if (Math.abs(diff) === 1) setActiveIndex(index);
              }}
            >
              <div className="w-full h-full bg-white rounded-3xl shadow-[0_24px_54px_rgba(10,20,30,0.08)] border border-black/[0.04] p-6 lg:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-4 lg:mb-5 text-[var(--accent)]">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-[0.95rem] lg:text-[1.1rem] leading-[1.6] text-[var(--primary)] font-[var(--font-display)] italic line-clamp-4">
                    "{review.quote}"
                  </p>
                </div>
                
                <div className="flex items-center gap-3 mt-4 border-t border-black/[0.04] pt-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent-strong)] text-[14px] font-[var(--font-display)] uppercase shrink-0">
                    {review.name ? review.name.charAt(0) : 'G'}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold tracking-wide text-[var(--primary)]">{review.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-[0.15em] mt-0.5">{review.location}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-6 mt-12 z-40">
        <button 
          onClick={() => setActiveIndex((activeIndex - 1 + testimonials.length) % testimonials.length)}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-black/10 text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent-strong)] hover:border-[var(--accent)]/30 transition-all"
          aria-label="Previous testimonial"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
        </button>
        
        <div className="flex justify-center gap-2.5">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View testimonial ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-500 ${
                idx === activeIndex ? 'w-8 bg-[var(--accent)]' : 'w-2 bg-[var(--accent)]/30 hover:bg-[var(--accent)]/50'
              }`}
            />
          ))}
        </div>
        
        <button 
          onClick={() => setActiveIndex((activeIndex + 1) % testimonials.length)}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-black/10 text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent-strong)] hover:border-[var(--accent)]/30 transition-all"
          aria-label="Next testimonial"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const HomePage = () => {
  const navigate = useNavigate();
  const settingsQuery = useHotelSettings();
  const reviewsQuery = usePublishedFeedback({ limit: 10 });
  const featuredRoomTypesQuery = useRoomTypes({ featured: true, isActive: true, limit: 3 });
  const activeRoomTypesQuery = useRoomTypes({ isActive: true, limit: 6 });
  const roomsQuery = useRooms({ isActive: true, limit: 120 });
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const form = useForm({
    resolver: zodResolver(availabilitySearchSchema),
    defaultValues: {
      checkInDate: addDays(2),
      checkOutDate: addDays(5),
      adults: 2,
      children: 0,
    },
  });

  const liveRooms = roomsQuery.data?.data ?? [];
  const featuredRoomTypes = attachRoomImagesToRoomTypes(featuredRoomTypesQuery.data?.data ?? [], liveRooms);
  const activeRoomTypes = attachRoomImagesToRoomTypes(activeRoomTypesQuery.data?.data ?? [], liveRooms);
  const featuredRooms = (featuredRoomTypes.length ? featuredRoomTypes : activeRoomTypes).slice(0, 3);
  const branding = getPublicBranding(settingsQuery.data);
  const websiteMedia = branding.websiteMedia || {};
  const watchedCheckInDate = form.watch('checkInDate');
  const watchedCheckOutDate = form.watch('checkOutDate');
  const watchedAdults = form.watch('adults');

  const heroImages = [...(websiteMedia.heroGalleryUrls || []), ...featuredRooms.flatMap((room) => room.images || [])].filter(Boolean);

  useEffect(() => {
    if (heroImages.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroImages.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [heroImages.length]);

  useEffect(() => {
    if (activeHeroIndex >= heroImages.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, heroImages.length]);

  const testimonials = (reviewsQuery.data ?? []).map((review, index) => ({
    id: review.id || `review-${index}`,
    name: review.guestName || 'LuxuryStay Guest',
    quote: review.comment || review.title || 'A memorable stay shaped by calm service and refined comfort.',
    rating: Number(review.rating || 5),
    location: review.roleLabel || 'Verified guest',
  }));

  const homePageSettings = branding.homePageSettings || {};

  const heroImage = heroImages[activeHeroIndex] || getPrimaryImage(featuredRooms[0]) || null;
  const aboutImage =
    homePageSettings.aboutPrimaryImageUrl ||
    getPrimaryImage(featuredRooms[1] || featuredRooms[0]);
  const aboutSecondaryImage =
    homePageSettings.aboutSecondaryImageUrl ||
    getPrimaryImage(featuredRooms[0]);

  const metrics = [
    {
      label: 'Premium Rooms',
      value: `${liveRooms.length || 120}+`,
      detail: 'Rooms and suites prepared for city breaks, celebrations, and longer refined stays.',
    },
    {
      label: 'Concierge',
      value: '24/7',
      detail: 'Arrival support, guest guidance, and discreet assistance across the day.',
    },
    {
      label: 'Guest Experience',
      value: '5-Star',
      detail: 'Warm service and polished hospitality shaped to feel calm rather than formal.',
    },
  ];
  const featuredTestimonial = testimonials[0];
  const secondaryTestimonials = testimonials.slice(1, 3);

  return (
    <div className="space-y-14 pt-2 md:space-y-16 pb-0">
      <section className="px-4 md:px-6">
        <div className="mx-auto max-w-[1320px]">
          <div className="relative overflow-hidden rounded-[28px] bg-[#0f1a28] shadow-[0_22px_60px_rgba(10,20,30,0.14)]">
            {heroImage ? <img src={heroImage} alt={branding.hotelName} className="absolute inset-0 h-full w-full object-cover" /> : null}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,23,0.58)_0%,rgba(8,15,23,0.28)_44%,rgba(8,15,23,0.1)_100%)]" />

            <div className="relative z-10 flex min-h-[500px] flex-col justify-between px-5 py-6 md:min-h-[560px] md:px-8 md:py-8 lg:px-9 lg:py-9">
              <div className="max-w-[480px] pt-12 md:pt-14">
                <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ecd3a8]">
                  LuxuryStay Hospitality
                </span>
                <h1 className="mt-5 max-w-[12ch] font-[var(--font-display)] text-[clamp(2.05rem,3.6vw,3.45rem)] font-semibold leading-[1.04] tracking-[-0.03em] drop-shadow-xl !text-white">
                  Experience Timeless Luxury and Comfort
                </h1>
                <p className="mt-4 max-w-[40ch] text-sm leading-7 drop-shadow-md !text-white md:text-[15px]">
                  Escape into a world of refined hospitality, elegant suites, and unforgettable stays curated for modern travelers.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/booking">
                    <Button className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a97c3d]">
                      Book Your Stay
                    </Button>
                  </Link>
                  <Link to="/rooms">
                    <Button variant="outline" className="rounded-full border-white/16 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/14 hover:text-white">
                      Explore Rooms
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <BookingBar
                  form={form}
                  onSubmit={(values) => {
                    navigate(`/booking?checkInDate=${values.checkInDate}&checkOutDate=${values.checkOutDate}&adults=${values.adults}&children=0`);
                  }}
                />

                {heroImages.length > 1 ? (
                  <div className="flex items-center gap-2">
                    {heroImages.slice(0, 4).map((image, index) => (
                      <button
                        key={`hero-dot-${image}-${index}`}
                        type="button"
                        aria-label={`View slide ${index + 1}`}
                        onClick={() => setActiveHeroIndex(index)}
                        className={`h-2 rounded-full transition-all ${index === activeHeroIndex ? 'w-9 bg-[#ecd3a8]' : 'w-2 bg-white/46 hover:bg-white/74'}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="rooms" className="px-4 md:px-6">
        <div className="mx-auto max-w-[1320px] space-y-8">
          <SectionHeading
            centered
            eyebrow="Featured Rooms"
            title={
              <div className="flex flex-col items-center md:flex-row md:justify-center md:whitespace-nowrap">
                <span>Three refined stays designed for&nbsp;</span>
                <span className="relative inline-flex text-left">
                  {/* Invisible spacer to reserve an exact, unshakable pixel width covering the longest text + cursor */}
                  <span className="invisible select-none pr-3">polished arrival</span>
                  
                  {/* Absolutely positioned typewriter sitting firmly inside the reserved space */}
                  <span className="absolute left-0 top-0 bottom-0 whitespace-nowrap">
                    <Typewriter words={['comfort', 'privacy', 'polished arrival']} />
                  </span>
                </span>
              </div>
            }
            description="A focused selection of room categories presented with clean detail, warm interiors, and a restrained luxury feel."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                currency={branding.currency}
                checkInDate={watchedCheckInDate}
                checkOutDate={watchedCheckOutDate}
                adults={watchedAdults}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="amenities" className="bg-[#fbf9f6] py-24 lg:py-32 relative overflow-hidden mt-20">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[radial-gradient(ellipse_at_top_right,rgba(184,140,74,0.08),transparent_70%)]" />
        <div className="mx-auto max-w-[1320px] px-4 md:px-6 relative z-10">
          <SectionHeading
            centered
            eyebrow="Luxury Experience"
            title="Every detail designed to feel quietly exceptional."
            description="From wellness rituals to airport arrivals, the experience is shaped to feel calm, elevated, and beautifully paced."
          />

          <div className="mt-16 lg:mt-24 grid grid-cols-1 gap-y-14 gap-x-16 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="group flex flex-col items-start relative before:absolute before:-left-6 before:top-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-[var(--accent)]/40 before:to-transparent pl-4">
                  <div className="mb-6 flex">
                    <Icon className="h-8 w-8 text-[var(--accent)] transition-transform duration-700 group-hover:scale-110" strokeWidth={1.2} />
                  </div>
                  <h3 className="font-[var(--font-display)] text-[1.4rem] font-medium text-[var(--primary)] mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-[0.98rem] leading-[1.85] text-[var(--muted-foreground)] max-w-[34ch] font-light">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-20 flex flex-col items-center justify-center gap-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--accent)] whitespace-nowrap">Signature Marks</p>
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-10">
              {amenityHighlights.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/60" />
                  <p className="text-[13.5px] font-medium tracking-wide text-[var(--primary)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-8 lg:py-12 overflow-hidden bg-white">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            <div className="lg:w-1/2 relative z-10 lg:pr-14">
              <span className="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--accent)] mb-6">
                 <span className="h-px w-8 bg-[var(--accent)]" />
                 About LuxuryStay
              </span>
              <h2 className="font-[var(--font-display)] text-[clamp(2.5rem,4.5vw,3.6rem)] leading-[1.08] tracking-tight text-[var(--primary)] mb-8">
                Built around quiet luxury and understated presence.
              </h2>
              <p className="text-[1.05rem] leading-[1.9] text-[var(--muted-foreground)] max-w-[48ch] mb-14 font-light">
                Designed for travelers who appreciate calm spaces and attentive detail, the hotel offers refined suites, intuitive service, and a softer kind of five-star experience in the heart of the city.
              </p>
              
              <div className="flex flex-wrap gap-10 sm:gap-20">
                {metrics.slice(0, 2).map((item) => (
                  <div key={item.label} className="flex flex-col relative">
                    <p className="text-[3.5rem] font-[var(--font-display)] tracking-tighter leading-none text-[var(--primary)]">{item.value}</p>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.25em] text-[var(--accent)] mt-3">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:w-1/2 relative w-full h-[550px] lg:h-[700px] mt-10 lg:mt-0">
               <div className="absolute right-0 top-0 w-[82%] h-[78%] rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(10,20,30,0.12)] z-10">
                 {aboutImage && <img src={aboutImage} alt="Hotel Exterior" className="h-full w-full object-cover" />}
                 <div className="absolute inset-0 bg-black/5" />
               </div>
               
               <div className="absolute left-0 bottom-0 w-[58%] h-[62%] rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(10,20,30,0.2)] z-20 border-8 border-white">
                 {aboutSecondaryImage && <img src={aboutSecondaryImage} alt="Interior detail" className="h-full w-full object-cover" />}
                 <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(10,25,45,0.85))]" />
                 <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-white text-xl font-[var(--font-display)] italic tracking-wide">Signature tone</p>
                    <p className="text-white/80 text-[12.5px] leading-relaxed mt-1 font-light">Calm from the first moment.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="pt-2 pb-6 border-t border-[rgba(184,140,74,0.15)] bg-[#fbf9f6] !mt-0">
          <div className="mx-auto max-w-[1320px] px-4 md:px-6">
            <div className="pt-4 md:pt-6">
              <SectionHeading
                centered
                eyebrow="Guest Impressions"
                title="Consistent comfort, warmth, and presence."
                description="A restrained selection of guest feedback reflecting our daily atmosphere."
              />
            </div>
            
            <VIPTestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
      )}

      <section className="py-4 bg-white shrink-0 !mt-0">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div className="relative overflow-hidden rounded-[24px] bg-[#0c1622] px-6 py-4 sm:px-10 sm:py-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_10px_40px_rgba(12,22,34,0.1)]">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(184,140,74,0.1),transparent)]" />
            
            <div className="relative text-center md:text-left z-10 max-w-xl">
               <span className="inline-flex items-center justify-center md:justify-start gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ecd3a8] mb-2 w-full md:w-auto">
                 <span className="h-px w-4 bg-[#ecd3a8]" />
                 Arrival Awaits
               </span>
               <h2 className="font-[var(--font-display)] text-xl sm:text-2xl lg:text-3xl leading-[1.1] !text-white mb-2 tracking-tight">Reserve Your Escape.</h2>
               <p className="text-[0.9rem] md:text-[0.95rem] text-white/70 max-w-[40ch] mx-auto md:mx-0">Confirm your suite and let the stay begin with confidence.</p>
            </div>
            
            <Link to="/booking" className="relative z-10 shrink-0 mt-2 md:mt-0">
               <Button className="rounded-full bg-[#ecd3a8] h-10 px-6 text-[12px] font-bold tracking-[0.1em] uppercase text-[#0c1622] hover:bg-white transition-all duration-300 flex items-center border-none">
                 Reserve Stay
                 <ArrowRight className="ml-2 h-3.5 w-3.5" />
               </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
