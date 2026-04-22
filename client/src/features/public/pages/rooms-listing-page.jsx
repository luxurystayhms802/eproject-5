import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  Clock3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Wine,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicPageHero } from '@/features/public/components/public-page-hero';
import { PublicRoomCard } from '@/features/public/components/public-room-card';
import { PublicSectionHeading } from '@/features/public/components/public-section-heading';
import { useHotelSettings, useAvailabilitySearch, usePublishedFeedback, useRoomTypes, useRooms } from '@/features/public/hooks';
import { availabilitySearchSchema } from '@/features/public/schemas';
import { attachRoomImagesToRoomTypes, formatCurrency, getPrimaryImage, getPublicBranding, getUniqueAmenities } from '@/features/public/utils';

const getTodayString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const today = new Date();
const addDays = (days) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const isAvailabilityRoomType = (room) => 'pricing' in room;

export const RoomsListingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('featured');
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '');

  useEffect(() => {
    setSearchValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  const committedFilters = {
    checkInDate: searchParams.get('checkInDate') ?? '',
    checkOutDate: searchParams.get('checkOutDate') ?? '',
    adults: Number(searchParams.get('adults') ?? 2),
    children: Number(searchParams.get('children') ?? 0),
  };

  const settingsQuery = useHotelSettings();
  const publishedFeedbackQuery = usePublishedFeedback({ limit: 6 });
  const roomTypesQuery = useRoomTypes({ isActive: true, limit: 24 });
  const roomsQuery = useRooms({ isActive: true, limit: 200 });
  const availabilityQuery = useAvailabilitySearch(
    committedFilters.checkInDate && committedFilters.checkOutDate ? committedFilters : null,
  );
  const form = useForm({
    resolver: zodResolver(availabilitySearchSchema),
    defaultValues: {
      checkInDate: committedFilters.checkInDate || addDays(2),
      checkOutDate: committedFilters.checkOutDate || addDays(5),
      adults: committedFilters.adults,
      children: committedFilters.children,
    },
  });

  const branding = getPublicBranding(settingsQuery.data);
  const publishedReviews = publishedFeedbackQuery.data ?? [];
  const liveRooms = roomsQuery.data?.data ?? [];
  const roomTypes = attachRoomImagesToRoomTypes(roomTypesQuery.data?.data ?? [], liveRooms);
  const heroImage = getPrimaryImage(roomTypes[0]);
  const liveCards = committedFilters.checkInDate && committedFilters.checkOutDate
    ? attachRoomImagesToRoomTypes(availabilityQuery.data?.availableRoomTypes ?? [], liveRooms)
    : roomTypes;
  const amenityPreview = getUniqueAmenities(roomTypes).slice(0, 8);

  const filteredCards = useMemo(
    () =>
      liveCards
        .filter((room) => {
          const combinedText = `${room.name} ${room.shortDescription} ${(room.amenities ?? []).join(' ')}`.toLowerCase();
          return combinedText.includes(searchValue.trim().toLowerCase());
        })
        .sort((first, second) => {
          if (sortBy === 'price-low') {
            return Number((first.pricing?.ratePerNight ?? first.basePrice) || 0) - Number((second.pricing?.ratePerNight ?? second.basePrice) || 0);
          }

          if (sortBy === 'price-high') {
            return Number((second.pricing?.ratePerNight ?? second.basePrice) || 0) - Number((first.pricing?.ratePerNight ?? first.basePrice) || 0);
          }

          if (sortBy === 'capacity') {
            return (second.maxAdults + second.maxChildren) - (first.maxAdults + first.maxChildren);
          }

          if (sortBy === 'availability') {
            return Number(second.availableRoomCount ?? 0) - Number(first.availableRoomCount ?? 0);
          }

          return Number(second.featured ?? false) - Number(first.featured ?? false);
        }),
    [liveCards, searchValue, sortBy],
  );

  const startingRate = availabilityQuery.data?.pricingSummary?.startingFrom
    ?? roomTypes.reduce((lowest, room) => Math.min(lowest, room.basePrice || lowest), roomTypes[0]?.basePrice || 0);
  const availabilityCount = availabilityQuery.data?.availableRoomTypes.length ?? 0;
  const matchingCollections = filteredCards.length;
  const reviewAverage = publishedReviews.length
    ? (publishedReviews.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / publishedReviews.length).toFixed(1)
    : null;
  const searchApplied = Boolean(committedFilters.checkInDate && committedFilters.checkOutDate);
  const activeStaySummary = searchApplied
    ? `${committedFilters.checkInDate} to ${committedFilters.checkOutDate} | ${committedFilters.adults} adults | ${committedFilters.children} children`
    : 'Select dates to shift from catalogue browsing into live availability mode.';
  const listingSummaryItems = [
    {
      label: 'Active collections',
      value: String(roomTypes.length).padStart(2, '0'),
      detail: 'Suites and rooms currently presented across the hotel collection.',
    },
    {
      label: 'Starting from',
      value: formatCurrency(startingRate, branding.currency),
      detail: 'Our introductory nightly rate for a refined city stay.',
    },
    {
      label: 'Live available',
      value: searchApplied ? String(availabilityCount).padStart(2, '0') : '--',
      detail: searchApplied ? 'Categories currently available for the selected travel dates.' : 'Select your dates to reveal current availability.',
    },
    {
      label: 'Guest approval',
      value: reviewAverage ? `${reviewAverage}/5` : '--',
      detail: reviewAverage ? 'Average score drawn from published guest reviews.' : 'Published guest reviews will shape this score.',
    },
  ];
  const experiencePillars = [
    {
      icon: Sparkles,
      title: 'Editorially designed stays',
      description: 'Each category balances warm materials, generous comfort, and a polished residential feel.',
    },
    {
      icon: Wine,
      title: 'Elevated moments built in',
      description: 'Room features are curated for celebrations, quiet weekends, and beautifully paced business trips.',
    },
    {
      icon: ShieldCheck,
      title: 'Confident booking flow',
      description: 'Live rates, date-aware availability, and direct reservation pathways keep every step clear.',
    },
  ];
  const signatureInclusions = [
    'Curated amenities across room categories',
    'Date-aware live availability search',
    'Premium room narratives and imagery',
    'Seamless move from inspiration to reservation',
  ];

  return (
    <div className="space-y-16 pb-0">
      <section className="px-4 md:px-6">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[34px] border border-[rgba(184,140,74,0.15)] bg-white shadow-[0_20px_60px_rgba(8,24,44,0.06)]">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center px-8 py-16 md:px-14 lg:py-24">
              <span className="mb-6 inline-flex w-fit rounded-full border border-[rgba(184,140,74,0.3)] bg-[var(--accent-soft)] px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] shadow-sm">
                Rooms and suites
              </span>
              <h1 className="font-[var(--font-display)] text-5xl leading-[1.08] text-[var(--primary)] md:text-6xl lg:text-[4.2rem]">
                Styled for city breaks & elegant stays.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--muted-foreground)]">
                Browse the full collection, compare nightly rates, and narrow the list by your exact travel dates without losing the calm luxury feel of the experience.
              </p>
              
              <div className="mt-12 grid grid-cols-2 gap-8 pt-8 border-t border-[rgba(184,140,74,0.15)]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Available categories</p>
                  <p className="mt-2 font-[var(--font-display)] text-4xl text-[var(--primary)]">{roomTypes.length || 0}+</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">Prepared for couples, families, and high-end city escapes.</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Nightly rate</p>
                  <p className="mt-2 font-[var(--font-display)] text-4xl text-[var(--primary)]">{formatCurrency(startingRate, branding.currency)}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">An elegant starting point for the current refined collection.</p>
                </div>
              </div>
            </div>
            
            <div className="relative min-h-[450px] lg:min-h-[auto]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent lg:w-48" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6">
        <div className="mx-auto max-w-[1380px] space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
            <div className="space-y-5">
              <PublicSectionHeading
                eyebrow="Curated accommodation"
                title="A refined collection shaped for restorative nights, celebratory weekends, and polished extended stays."
                description="From intimate city rooms to more expansive suite experiences, each accommodation has been presented to help guests move effortlessly from inspiration to booking. Use the filters to browse leisurely, or apply travel dates to reveal live availability across the collection."
                align="left"
              />
              <div className="flex flex-wrap gap-3 text-xs font-medium text-[var(--muted-foreground)] md:text-sm">
                <span className="rounded-full border border-[rgba(184,140,74,0.24)] bg-[var(--accent-soft)]/60 px-4 py-2">
                  Signature rooms for city escapes
                </span>
                <span className="rounded-full border border-[rgba(184,140,74,0.24)] bg-[var(--accent-soft)]/60 px-4 py-2">
                  Thoughtful occupancy and suite sizing
                </span>
                <span className="rounded-full border border-[rgba(184,140,74,0.24)] bg-[var(--accent-soft)]/60 px-4 py-2">
                  Live rates when dates are applied
                </span>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(145deg,rgba(255,248,240,0.9),rgba(255,255,255,0.86))] p-0 shadow-[var(--shadow-soft)]">
              <div className="grid gap-0 md:grid-cols-2">
                {experiencePillars.map((pillar, index) => {
                  const Icon = pillar.icon;

                  return (
                    <div
                      key={pillar.title}
                      className={[
                        'p-6 md:p-7',
                        index === 0 ? 'md:col-span-2' : '',
                        index !== experiencePillars.length - 1 ? 'border-b border-[rgba(184,140,74,0.16)] md:border-b-0' : '',
                        index === 1 ? 'md:border-r md:border-t border-[rgba(184,140,74,0.16)]' : '',
                        index === 2 ? 'md:border-t border-[rgba(184,140,74,0.16)]' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-4">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(184,140,74,0.22)] bg-white text-[var(--accent)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
                            {index === 0 ? 'Stay philosophy' : index === 1 ? 'Guest moments' : 'Reservation ease'}
                          </p>
                          <h3 className="font-[var(--font-display)] text-2xl leading-tight text-[var(--primary)]">{pillar.title}</h3>
                          <p className="text-sm leading-7 text-[var(--muted-foreground)]">{pillar.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {listingSummaryItems.map((item) => (
              <Card key={item.label} className="rounded-2xl border border-white/60 bg-white/82 px-6 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">{item.label}</p>
                <p className="mt-4 font-[var(--font-display)] text-[2.6rem] leading-none text-[var(--primary)]">{item.value}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{item.detail}</p>
              </Card>
            ))}
          </div>

          <Card className="rounded-[28px] border border-[rgba(184,140,74,0.16)] bg-[linear-gradient(135deg,rgba(12,25,44,0.96),rgba(24,42,68,0.92))] p-6 text-white before:hidden md:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.92fr,1.08fr] lg:items-center">
              <div className="space-y-3">
                <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f3d7aa]">
                  Signature inclusions
                </span>
                <h2 className="font-[var(--font-display)] text-4xl leading-none text-white">The room journey is designed to feel as elevated as the stay itself.</h2>
                <p className="text-sm leading-7 text-white/74">
                  Every listing supports a premium decision-making experience, combining elegant presentation, practical stay details, and direct pathways into booking.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {signatureInclusions.map((item) => (
                  <div key={item} className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4">
                    <p className="flex items-start gap-3 text-sm leading-7 text-white/80">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#f3d7aa]" />
                      <span>{item}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="px-4 md:px-6 mb-8 mt-12">
        <div className="mx-auto max-w-[1380px]">
          <Card className="rounded-[32px] border border-[var(--border)] bg-white/95 p-4 shadow-[0_24px_50px_rgba(16,36,63,0.06)] backdrop-blur-xl transition-all hover:bg-white md:p-6">
            <form
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.5fr,1.2fr,1.2fr,0.6fr,0.6fr,1.2fr,auto] items-end"
              onSubmit={form.handleSubmit((values) => {
                const query = {
                  checkInDate: values.checkInDate,
                  checkOutDate: values.checkOutDate,
                  adults: String(values.adults),
                  children: String(values.children),
                };
                if (searchValue) query.search = searchValue;
                setSearchParams(query, { preventScrollReset: true, replace: true });
                setTimeout(() => {
                  document.getElementById('room-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              })}
            >
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)] ml-2">Stay search</label>
                <div className="flex h-[52px] items-center rounded-[20px] bg-[var(--accent-soft)] px-4">
                  <Search className="h-4 w-4 text-[var(--muted-foreground)] mr-2" />
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Balcony, family..."
                    className="w-full border-0 bg-transparent text-sm font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)] ml-2">Check-in</label>
                <input type="date" min={getTodayString()} className="h-[52px] w-full rounded-[20px] bg-[var(--accent-soft)] px-5 font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]" {...form.register('checkInDate')} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)] ml-2">Check-out</label>
                <input type="date" min={form.watch('checkInDate') || getTodayString()} className="h-[52px] w-full rounded-[20px] bg-[var(--accent-soft)] px-5 font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]" {...form.register('checkOutDate')} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)] ml-2">Adult</label>
                <input type="number" min={1} className="h-[52px] w-full rounded-[20px] bg-[var(--accent-soft)] px-5 font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]" {...form.register('adults', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)] ml-2">Child</label>
                <input type="number" min={0} className="h-[52px] w-full rounded-[20px] bg-[var(--accent-soft)] px-5 font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]" {...form.register('children', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)] ml-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--accent)]" />
                  Sort by
                </label>
                <select
                  className="h-[52px] w-full rounded-[20px] bg-[var(--accent-soft)] px-5 font-medium text-[var(--foreground)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low</option>
                  <option value="price-high">Price: high</option>
                  <option value="capacity">Occupancy</option>
                  <option value="availability">Availability</option>
                </select>
              </div>

              <div className="flex h-[52px] gap-2 items-center">
                <Button type="button" variant="outline" className="h-full rounded-[20px] px-5" onClick={() => {
                  form.reset({ checkInDate: addDays(2), checkOutDate: addDays(5), adults: 2, children: 0 });
                  setSearchValue('');
                  setSortBy('featured');
                  setSearchParams({});
                }}>
                  Reset
                </Button>
                <Button type="submit" variant="secondary" className="h-full rounded-[20px] px-6 !text-white">
                  Search
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>

      <section className="px-4 md:px-6">
        <div className="mx-auto max-w-[1380px]">
          <div id="room-results" className="space-y-8 scroll-mt-32">
            <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/78 p-5 shadow-[var(--shadow-soft)] xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">Room collection</p>
                <h2 className="font-[var(--font-display)] text-4xl leading-none text-[var(--primary)]">
                  {searchApplied ? 'Suites currently available for your selected stay' : 'Explore the full room collection'}
                </h2>
                <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                  Compare category styles, room sizes, occupancy, and nightly rates before continuing into a polished reservation flow.
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--muted-foreground)]">
                  <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                    Showing {matchingCollections} curated {matchingCollections === 1 ? 'collection' : 'collections'}
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                    {searchApplied ? 'Stay filters active' : 'Catalogue browsing mode'}
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                    From {formatCurrency(startingRate, branding.currency)}
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:max-w-[430px]">
                <div className="rounded-[22px] border border-[rgba(184,140,74,0.18)] bg-[var(--accent-soft)]/55 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">Collection mood</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">Warm, polished, and designed for both celebratory and restorative stays.</p>
                </div>
                <div className="rounded-[22px] border border-[rgba(184,140,74,0.18)] bg-[var(--accent-soft)]/55 px-4 py-4">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
                    <Clock3 className="h-4 w-4" />
                    Active stay summary
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{activeStaySummary}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {amenityPreview.map((amenity) => (
                <span key={amenity} className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                  {amenity}
                </span>
              ))}
            </div>

            {roomTypesQuery.isLoading || availabilityQuery.isLoading ? (
              <div className="space-y-5">
                <Card className="rounded-[28px] border border-white/60 bg-white/82 p-6 md:p-7">
                  <div className="space-y-3">
                    <span className="inline-flex rounded-full border border-[rgba(184,140,74,0.22)] bg-[var(--accent-soft)]/65 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
                      Preparing collection
                    </span>
                    <h3 className="font-[var(--font-display)] text-3xl leading-none text-[var(--primary)]">Gathering room categories, live rates, and availability details for your stay.</h3>
                    <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                      We are polishing the latest room data so you can compare the collection with confidence.
                    </p>
                  </div>
                </Card>
                <div className="grid gap-5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="h-[360px] animate-pulse rounded-[28px] bg-white/70" />
                  ))}
                </div>
              </div>
            ) : null}

            {!roomTypesQuery.isLoading && !availabilityQuery.isLoading && filteredCards.length > 0 ? (
              <div className="grid gap-8 lg:gap-10">
                {filteredCards.map((room) => (
                  <PublicRoomCard
                    key={`${room.id}-${room.slug || room.name}`}
                    room={room}
                    currency={branding.currency}
                    checkInDate={form.getValues('checkInDate')}
                    checkOutDate={form.getValues('checkOutDate')}
                    adults={form.getValues('adults')}
                    children={form.getValues('children')}
                    valueLabel={isAvailabilityRoomType(room) ? 'live nightly rate' : '/ night'}
                    align="horizontal"
                  />
                ))}
              </div>
            ) : null}

            {!roomTypesQuery.isLoading && !availabilityQuery.isLoading && filteredCards.length === 0 ? (
              <Card className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,249,242,0.92))] p-8 shadow-[var(--shadow-soft)]">
                <div className="space-y-5">
                  <span className="inline-flex rounded-full border border-[rgba(184,140,74,0.22)] bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
                    No matching stay
                  </span>
                  <h3 className="font-[var(--font-display)] text-4xl leading-none text-[var(--primary)]">No room collection currently matches the selected filters.</h3>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                    Adjust dates, occupancy, or search terms and the listing will refresh to show the best current match for your stay.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/88 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Suggested next step</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">Try broader dates or remove descriptive keywords to reveal more suites.</p>
                    </div>
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/88 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Booking reassurance</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">Once a room matches, your selected dates and guest count remain ready for the next booking step.</p>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            <Card className="rounded-[28px] bg-[linear-gradient(145deg,#0b1a2f,#132845)] p-6 text-white before:hidden">
              <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f3d7aa]">
                    Guest confidence
                  </span>
                  <h3 className="font-[var(--font-display)] text-4xl leading-none text-white">Room choice, pricing, and guest trust come together in one beautifully paced journey.</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4">
                    <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/74">
                      <Star className="h-4 w-4 text-[#f3d7aa]" />
                      Review backed
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/72">Published guest reviews add confidence and warmth while you explore the room collection.</p>
                  </div>
                  <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4">
                    <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/74">
                      <Sparkles className="h-4 w-4 text-[#f3d7aa]" />
                      Booking ready
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/72">Every room card can move directly into details and reservation flows with the selected stay dates attached.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
