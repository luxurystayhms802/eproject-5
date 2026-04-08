import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, Expand, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildImageBackdrop, formatCurrency } from '@/features/public/utils';

const createFallbackSlide = (branding, currency) => ({
  id: 'fallback-slide',
  kicker: branding.brandName,
  title: branding.heroTitle,
  description: branding.heroSubtitle,
  name: branding.hotelName,
  image: null,
  bookingUrl: '/booking',
  detailsUrl: '/rooms',
  nightlyRate: 0,
  occupancyLabel: 'Guest-first luxury',
  bedLabel: 'Signature room collections',
  roomSizeLabel: 'Curated interiors',
  amenities: ['Concierge', 'Dining', 'Wellness'],
  highlightLabel: currency || 'PKR',
});

export const PublicHomeHeroCarousel = ({
  branding,
  slides = [],
  currency = 'PKR',
}) => {
  const normalizedSlides = useMemo(
    () => (slides.length ? slides : [createFallbackSlide(branding, currency)]),
    [branding, currency, slides],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, normalizedSlides.length - 1));
  }, [normalizedSlides.length]);

  useEffect(() => {
    if (normalizedSlides.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % normalizedSlides.length);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, [normalizedSlides.length]);

  const activeSlide = normalizedSlides[activeIndex];

  const showPreviousSlide = () => {
    setActiveIndex((current) => (current - 1 + normalizedSlides.length) % normalizedSlides.length);
  };

  const showNextSlide = () => {
    setActiveIndex((current) => (current + 1) % normalizedSlides.length);
  };

  const suiteFacts = [
    {
      label: 'Nightly rate',
      value: activeSlide.nightlyRate ? formatCurrency(activeSlide.nightlyRate, currency) : 'Tailored rate',
      icon: Sparkles,
    },
    {
      label: 'Occupancy',
      value: activeSlide.occupancyLabel,
      icon: Users,
    },
    {
      label: 'Bed setup',
      value: activeSlide.bedLabel,
      icon: BedDouble,
    },
    {
      label: 'Room scale',
      value: activeSlide.roomSizeLabel,
      icon: Expand,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[38px] border border-white/45 shadow-[0_40px_120px_rgba(7,17,31,0.24)]">
      <div className="absolute inset-0">
        {normalizedSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={[
              'absolute inset-0 transition-all duration-700 ease-out',
              index === activeIndex ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0',
            ].join(' ')}
            style={
              slide.image
                ? {
                    backgroundImage: `url(${slide.image})`,
                    backgroundPosition: 'center 42%',
                    backgroundSize: 'cover',
                  }
                : buildImageBackdrop(null, index)
            }
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(248,241,233,0.78)_0%,rgba(248,241,233,0.34)_44%,rgba(8,16,28,0.06)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,255,255,0.2),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(198,155,93,0.22),transparent_24%),linear-gradient(180deg,rgba(8,14,24,0.02)_0%,rgba(8,14,24,0.1)_52%,rgba(8,14,24,0.32)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-[620px] flex-col px-4 py-4 text-white md:min-h-[700px] md:px-7 md:py-7 xl:min-h-[760px] xl:px-9 xl:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur-md">
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.34em] text-[#f3d7aa] md:text-[11px]">
              {branding.brandName}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-white/34 sm:block" />
            <span className="truncate text-[11px] font-medium text-white/68 md:text-xs">{activeSlide.kicker}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-medium text-white/70 md:flex">
              <span>{String(activeIndex + 1).padStart(2, '0')}</span>
              <span className="text-white/36">/</span>
              <span>{String(normalizedSlides.length).padStart(2, '0')}</span>
            </div>
            <button
              type="button"
              onClick={showPreviousSlide}
              aria-label="Show previous slide"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white transition hover:bg-white/14 md:h-11 md:w-11"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={showNextSlide}
              aria-label="Show next slide"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white transition hover:bg-white/14 md:h-11 md:w-11"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-10 grid flex-1 gap-8 lg:grid-cols-[1.24fr,0.76fr] lg:items-end">
          <div className="max-w-4xl space-y-6 rounded-[34px] bg-black/25 p-6 shadow-2xl backdrop-blur-md border border-white/10 md:p-8">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#ecd3a8] md:text-[11px]">
                {activeSlide.highlightLabel}
              </span>
              <div className="space-y-4">
                <h1 className="public-heading-xl max-w-4xl !text-white drop-shadow-xl !leading-[1.1]">
                  {activeSlide.title}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/90 drop-shadow-md md:text-lg">
                  {activeSlide.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={activeSlide.bookingUrl || '/booking'}>
                <Button variant="secondary" className="rounded-full px-7 py-3 text-sm !text-white shadow-[0_18px_36px_rgba(184,140,74,0.28)]">
                  Reserve now
                </Button>
              </Link>
              <Link to={activeSlide.detailsUrl || '/rooms'}>
                <Button variant="outline" className="rounded-full border-white/30 bg-white/10 px-7 py-3 text-sm !text-white hover:bg-white/20 backdrop-blur-sm">
                  Explore suite
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {(activeSlide.amenities ?? []).slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-sm"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:justify-self-end lg:max-w-[430px]">
            <div className="rounded-[30px] border border-white/12 bg-[rgba(7,15,28,0.22)] p-6 shadow-[0_26px_70px_rgba(4,10,20,0.2)] backdrop-blur-2xl">
              <div className="space-y-3 border-b border-white/10 pb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f3d7aa]">Signature stay</p>
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="public-heading-md text-white">
                      {activeSlide.name}
                    </h2>
                    <p className="text-sm leading-7 text-white/68">
                      Spacious interiors, composed finishes, and a guest journey shaped for slower, more memorable stays.
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/54">From</p>
                    <p className="mt-2 font-[var(--font-display)] text-[2rem] leading-none text-white">
                      {activeSlide.nightlyRate ? formatCurrency(activeSlide.nightlyRate, currency) : 'Tailored'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {suiteFacts.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/56">
                        <Icon className="h-4 w-4 text-[#f3d7aa]" />
                        {item.label}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/80">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 py-4 backdrop-blur-md md:grid-cols-[1fr,auto] md:px-5">
          <div className="flex flex-col gap-3 text-sm text-white/72 md:flex-row md:flex-wrap md:items-center md:gap-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#f3d7aa]" />
              <span>Elegant arrival planning</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#f3d7aa]" />
              <span>Thoughtful guest care</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#f3d7aa]" />
              <span>Boutique warmth with five-star polish</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {normalizedSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show slide ${index + 1}`}
                className={[
                  'rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition md:px-4',
                  index === activeIndex
                    ? 'border-[#d5b178] bg-[#d5b178]/12 text-[#f3d7aa]'
                    : 'border-white/10 bg-white/6 text-white/58 hover:bg-white/10 hover:text-white/82',
                ].join(' ')}
              >
                {slide.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
