import { Clock3, ConciergeBell, Dumbbell, Car, Flower2, GlassWater, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PublicPageHero } from '@/features/public/components/public-page-hero';
import { PublicSectionHeading } from '@/features/public/components/public-section-heading';
import { curatedAmenities } from '@/features/public/content';
import { useHotelSettings, useRoomTypes } from '@/features/public/hooks';
import { getPrimaryImage, getPublicBranding, getUniqueAmenities } from '@/features/public/utils';

const serviceIcons = {
  spa: Flower2,
  dining: GlassWater,
  concierge: ConciergeBell,
  events: Sparkles,
  pool: Dumbbell,
  service: Car,
};

const supportingAmenities = [
  { icon: Wifi, title: 'High-speed Wi-Fi' },
  { icon: Car, title: 'Airport transfer' },
  { icon: ConciergeBell, title: 'Room service' },
  { icon: Sparkles, title: 'Housekeeping care' },
];

export const AmenitiesPage = () => {
  const settingsQuery = useHotelSettings();
  const roomTypesQuery = useRoomTypes({ isActive: true, limit: 12 });
  const branding = getPublicBranding(settingsQuery.data);
  const websiteMedia = branding.websiteMedia || {};
  const roomTypes = roomTypesQuery.data?.data ?? [];
  const uniqueAmenities = getUniqueAmenities(roomTypes).slice(0, 12);
  const serviceStandards = [
    {
      icon: Clock3,
      title: 'Arrival rhythm',
      detail: `${branding.checkInTime} check-in | ${branding.checkOutTime} departure`,
    },
    {
      icon: ShieldCheck,
      title: 'Booking confidence',
      detail: branding.cancellationPolicy,
    },
    {
      icon: ConciergeBell,
      title: 'Guest support',
      detail: `${branding.contactPhone} | ${branding.contactEmail}`,
    },
  ];

  return (
    <div className="pb-0">
      <section className="px-4 md:px-6 mt-6 md:mt-12 mb-8">
        <div className="mx-auto max-w-[1380px]">
          <div className="grid gap-12 lg:grid-cols-[1fr,0.85fr] lg:items-center">
            <div className="space-y-8 lg:py-16 xl:pr-12">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
                  <span className="h-px w-8 bg-[var(--accent)]" />
                  Amenities and services
                </span>
                <h1 className="font-[var(--font-display)] text-5xl leading-[1.05] text-[var(--primary)] md:text-6xl lg:text-[4.5rem]">
                  Services should feel quiet, capable, and deeply considered.
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-[var(--muted-foreground)]">
                  LuxuryStay presents hotel amenities with the same calm confidence that shapes the stay itself. A premium hospitality layer crafted for every resident.
                </p>
              </div>

              <div className="grid gap-6 border-t border-[rgba(184,140,74,0.15)] pt-8 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Support channels</p>
                  <p className="mt-2 font-[var(--font-display)] text-4xl text-[var(--primary)]">24/7</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">Concierge and hotel communications continuously supported.</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Service categories</p>
                  <p className="mt-2 font-[var(--font-display)] text-4xl text-[var(--primary)]">{curatedAmenities.length}+</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">Dining, wellness, events, and premium care.</p>
                </div>
              </div>
            </div>

            <div className="relative h-[550px] lg:h-[700px] w-full mt-10 lg:mt-0">
               <div className="absolute right-0 top-0 w-[85%] h-[85%] rounded-[32px] overflow-hidden shadow-[0_30px_90px_rgba(10,20,30,0.15)] z-10">
                 <div
                   className="h-full w-full bg-cover bg-center transition-transform duration-[1.5s] hover:scale-105"
                   style={{ backgroundImage: `url(${websiteMedia.wellnessImageUrl || websiteMedia.diningImageUrl || getPrimaryImage(roomTypes[1] || roomTypes[0])})` }}
                 />
                 <div className="absolute inset-0 bg-black/5" />
               </div>
               
               <div className="absolute left-0 bottom-0 w-[60%] h-[60%] rounded-[24px] overflow-hidden shadow-[0_40px_80px_rgba(10,20,30,0.25)] z-20 border-8 border-white bg-white">
                 <div
                   className="h-full w-full bg-cover bg-center"
                   style={{ backgroundImage: `url(${websiteMedia.eventsImageUrl || websiteMedia.aboutHeroImageUrl || getPrimaryImage(roomTypes[0])})` }}
                 />
                 <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(10,25,45,0.7))] pointer-events-none" />
                 <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-white text-xl font-[var(--font-display)] italic tracking-wide">Refined Detail</p>
                    <p className="text-white/80 text-[12px] leading-relaxed mt-1 font-light">Service as calm as the space itself.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(to_bottom,transparent,white_15%,white_85%,transparent)] pt-12 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_top_right,rgba(184,140,74,0.06),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,36,63,0.03),transparent_70%)]" />
        
        <div className="mx-auto max-w-[1380px] px-4 md:px-6 relative z-10">
          <div className="mb-14 text-center flex flex-col items-center">
            <span className="inline-flex rounded-full border border-[rgba(184,140,74,0.22)] bg-[var(--accent-soft)]/65 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent)]">
              Signature Care
            </span>
            <h2 className="mt-5 max-w-2xl font-[var(--font-display)] text-3xl leading-tight text-[var(--primary)] md:text-4xl">
              Everything around the stay is shaped to reflect {branding.hotelName}.
            </h2>
            <p className="mt-4 max-w-2xl text-[1rem] leading-[1.7] text-[var(--muted-foreground)]">
              The hotel experience extends far beyond the room. Each amenity supports comfort, confidence, and a premium sense of ease.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {curatedAmenities.map((item, i) => {
              const Icon = serviceIcons[item.key] || Sparkles;
              return (
                <div key={item.key} className="group relative overflow-hidden rounded-[24px] bg-white border border-[var(--border)] p-6 shadow-[0_8px_30px_rgba(16,36,63,0.03)] transition-all duration-500 hover:shadow-[0_16px_40px_rgba(184,140,74,0.08)] hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(184,140,74,0.1),transparent_70%)] transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                  
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(184,140,74,0.1),rgba(184,140,74,0.05))] text-[var(--accent)] transition-transform duration-700 group-hover:scale-110 group-hover:bg-[var(--accent)] group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="mb-3 font-[var(--font-display)] text-[1.4rem] leading-tight text-[var(--primary)] tracking-tight">
                    {item.title}
                  </h3>
                  
                  <p className="text-[0.95rem] leading-[1.6] text-[var(--muted-foreground)] font-light">
                    {item.description}
                  </p>
                  
                  <div className="mt-6 flex items-center">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] opacity-60 transition-opacity group-hover:opacity-100">
                      Discover More
                    </span>
                    <div className="ml-3 h-px w-0 bg-[var(--accent)] transition-all duration-500 group-hover:w-8 opacity-60" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-6 pt-8">
        <div className="mx-auto grid max-w-[1380px] gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="group rounded-[24px] border border-[var(--border)] bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(16,36,63,0.03)] relative overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-[0_20px_50px_rgba(16,36,63,0.06)]">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[radial-gradient(circle_at_top_right,rgba(16,36,63,0.03),transparent_70%)]" />
            <div className="relative z-10 mb-8 mt-2">
               <span className="inline-flex rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--primary)] shadow-sm mb-4">
                 Room-level Comfort
               </span>
               <h2 className="font-[var(--font-display)] text-[1.8rem] leading-[1.15] text-[var(--primary)] md:text-[2.2rem] max-w-sm tracking-tight">
                 Details that make every suite feel composed and complete.
               </h2>
               <p className="mt-4 text-[0.95rem] leading-[1.7] text-[var(--muted-foreground)] max-w-md font-light">
                 In-room comforts shape the tone of the stay, acting as the quiet foundation from first arrival through the final night.
               </p>
            </div>
            
            <div className="relative z-10 flex flex-wrap gap-2.5">
              {uniqueAmenities.map((amenity) => (
                <span key={amenity} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[0.8rem] font-medium text-[var(--primary)] shadow-sm hover:border-[var(--accent)] transition-colors cursor-default">
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] bg-[linear-gradient(150deg,#0a1626,#122845)] p-6 sm:p-8 text-white shadow-[0_20px_50px_rgba(10,20,35,0.15)] relative overflow-hidden flex flex-col">
            <div className="absolute -right-10 -top-10 w-60 h-60 rounded-full border border-white/5 bg-white/5 blur-3xl mix-blend-overlay" />
            
            <div className="relative z-10 mt-2">
              <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[#ecd3a8] mb-4">
                <span className="h-px w-5 bg-[#ecd3a8]" />
                Service Standards
              </span>
              <h2 className="font-[var(--font-display)] text-[1.8rem] leading-[1.1] md:text-[2.2rem] tracking-tight text-white mb-8 max-w-sm">
                Discreet, polished, and beautifully timed.
              </h2>
            </div>
            
            <div className="relative z-10 flex-1 grid gap-3 grid-cols-1 sm:grid-cols-2">
              {supportingAmenities.map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-[16px] bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors backdrop-blur-md">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#ecd3a8]">
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[0.85rem] font-medium tracking-wide text-white">{item.title}</p>
                </div>
              ))}
            </div>
            
            <div className="relative z-10 mt-8 grid gap-4 border-t border-white/10 pt-6">
              {serviceStandards.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-[#ecd3a8]">
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[0.95rem] font-semibold tracking-wide text-white">{item.title}</p>
                    <p className="mt-1 text-[0.85rem] leading-[1.5] text-white/60 font-light max-w-[30ch]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

