import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicPageHero } from '@/features/public/components/public-page-hero';
import { PublicSectionHeading } from '@/features/public/components/public-section-heading';
import { brandPillars, signatureExperiences } from '@/features/public/content';
import { useHotelSettings, usePublishedFeedback, useRoomTypes, useRooms } from '@/features/public/hooks';
import { attachRoomImagesToRoomTypes, buildImageBackdrop, getPrimaryImage, getPublicBranding } from '@/features/public/utils';

const servicePromises = [
  'Refined arrival and departure rhythm',
  'Elegant room presentation with boutique character',
  'Personalised guest care from reservation to departure',
  'Calm communication with modern hospitality clarity',
];

export const AboutPage = () => {
  const navigate = useNavigate();
  const settingsQuery = useHotelSettings();
  const publishedFeedbackQuery = usePublishedFeedback({ limit: 6 });
  const roomTypesQuery = useRoomTypes({ isActive: true, limit: 12 });
  const roomsQuery = useRooms({ isActive: true, limit: 120 });
  const branding = getPublicBranding(settingsQuery.data);
  const websiteMedia = branding.websiteMedia || {};
  const liveRooms = roomsQuery.data?.data ?? [];
  const roomTypes = attachRoomImagesToRoomTypes(roomTypesQuery.data?.data ?? [], liveRooms);
  const heroImage = websiteMedia.aboutHeroImageUrl || websiteMedia.storyImageUrl || getPrimaryImage(roomTypes[0]);
  const editorialImages = [
    {
      id: 'story-image',
      title: 'Brand story',
      image: websiteMedia.storyImageUrl || getPrimaryImage(roomTypes[0]),
      description: 'Warm textures, quieter luxury, and a brand atmosphere that feels composed from the first arrival.',
    },
    {
      id: 'dining-image',
      title: 'Dining mood',
      image: websiteMedia.diningImageUrl || getPrimaryImage(roomTypes[1] || roomTypes[0]),
      description: 'Late-evening tables, lounge energy, and service moments shaped for longer stays and memorable nights.',
    },
    {
      id: 'events-image',
      title: 'Celebration spaces',
      image: websiteMedia.eventsImageUrl || getPrimaryImage(roomTypes[2] || roomTypes[0]),
      description: 'Polished settings for gatherings, milestones, and event-led hospitality across the property.',
    },
  ].filter((item) => item.image);
  const publishedReviews = publishedFeedbackQuery.data ?? [];
  const averageRating = publishedReviews.length
    ? (publishedReviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) / publishedReviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-16 pb-8">
      <section className="px-4 md:px-6 mt-4">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[32px] md:rounded-[40px] bg-[#FAF8F5] border border-[rgba(184,140,74,0.15)] shadow-[0_24px_50px_rgba(8,24,44,0.05)]">
          <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-12">
            <div className="flex flex-col justify-center px-6 pt-12 pb-6 md:px-12 md:pt-16 lg:py-24 lg:pl-16 lg:pr-8">
              <span className="mb-4 md:mb-6 inline-flex w-fit items-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
                <span className="h-px w-6 bg-[var(--accent)]" />
                About LuxuryStay
              </span>
              <h1 className="font-[var(--font-display)] text-4xl leading-[1.1] text-[var(--primary)] md:text-5xl lg:text-[4.5rem]">
                Designed to feel quietly unforgettable.
              </h1>
              <p className="mt-6 text-base md:text-lg leading-relaxed text-[var(--muted-foreground)]">
                LuxuryStay blends editorial elegance, boutique intimacy, and five-star hospitality so the first impression and the actual stay feel equally refined.
              </p>
              
              <div className="mt-8 md:mt-12 flex flex-wrap gap-4">
                <Button onClick={() => navigate('/rooms')} variant="secondary" className="rounded-full px-6 py-5 md:px-8 md:py-6 text-xs font-semibold uppercase tracking-[0.2em] shadow-md">
                  Explore rooms
                </Button>
                <Button onClick={() => navigate('/booking')} variant="outline" className="rounded-full border-[var(--primary)] bg-transparent px-6 py-5 md:px-8 md:py-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white">
                  Book a stay
                </Button>
              </div>

              <div className="mt-10 md:mt-16 grid grid-cols-2 gap-6 md:gap-8 border-t border-[rgba(184,140,74,0.15)] pt-6 md:pt-8">
                <div>
                  <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Room collections</p>
                  <p className="mt-2 font-[var(--font-display)] text-3xl md:text-4xl text-[var(--primary)]">{String(roomTypes.length).padStart(2, '0')}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Guest sentiment</p>
                  <p className="mt-2 font-[var(--font-display)] text-3xl md:text-4xl text-[var(--primary)]">{averageRating ? `${averageRating}/5` : 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center p-6 md:p-10 lg:p-16">
              <div className="relative aspect-[4/5] md:aspect-[3/4] w-full max-w-[340px] md:max-w-[460px] overflow-hidden rounded-t-[140px] md:rounded-t-[200px] border-[8px] md:border-[10px] border-white shadow-[0_30px_60px_rgba(8,24,44,0.12)]">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                  style={{ backgroundImage: `url(${heroImage})` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 mt-24 mb-16">
        <div className="mx-auto max-w-[1380px]">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            <div className="relative h-[600px] lg:h-[800px] w-full mt-10 lg:mt-0 order-2 lg:order-1 hidden md:block">
              <div className="absolute top-0 left-0 w-[75%] h-[80%] rounded-[40px] overflow-hidden shadow-[0_30px_60px_rgba(10,20,30,0.12)] z-10 transition-transform duration-1000 hover:scale-[1.02]">
                 <div
                   className="h-full w-full bg-cover bg-center"
                   style={{ backgroundImage: `url(${editorialImages[0]?.image || heroImage})` }}
                 />
                 <div className="absolute inset-0 bg-black/5" />
              </div>
              
              <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-[32px] overflow-hidden shadow-[0_40px_80px_rgba(10,20,30,0.2)] z-20 border-[10px] border-[#FAF8F5] transition-transform duration-1000 hover:scale-105">
                 <div
                   className="h-full w-full bg-cover bg-center"
                   style={{ backgroundImage: `url(${editorialImages[1]?.image || heroImage})` }}
                 />
                 <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(10,25,45,0.6))] pointer-events-none" />
                 <div className="absolute bottom-6 left-6 right-6 text-center">
                    <p className="text-white text-[10px] uppercase tracking-[0.4em] font-bold">Signature</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-col justify-center order-1 lg:order-2">
               <span className="inline-flex w-fit items-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--accent)] mb-8">
                 <span className="h-px w-8 bg-[var(--accent)]" />
                 Our Story
               </span>
               <h2 className="font-[var(--font-display)] text-[2.8rem] leading-[1.05] tracking-tight text-[var(--primary)] md:text-[3.8rem] mb-8">
                 Hospitality should feel assured, not over-performed.
               </h2>
               <p className="text-[1.1rem] leading-[1.9] text-[var(--muted-foreground)] font-light max-w-[48ch] mb-10">
                 {branding.hotelName} was built around a simple belief: the tone of the brand should match the quality of the welcome. Guests should feel warmth, clarity, and quiet confidence from the first screen to the final morning.
               </p>
               
               <div className="grid gap-4 mt-4">
                 {servicePromises.map((promise, i) => (
                   <div key={i} className="flex items-center gap-5 p-4 rounded-[20px] bg-white border border-[var(--border)] shadow-sm hover:shadow-[0_12px_30px_rgba(16,36,63,0.04)] transition-shadow duration-300">
                     <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                       <CheckCircle2 className="h-4 w-4" />
                     </div>
                     <p className="text-[0.95rem] font-medium text-[var(--primary)]">{promise}</p>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Minimalist Brand Pillars */}
      <section className="pb-24 pt-10 bg-white">
        <div className="mx-auto max-w-[1380px] px-4 md:px-6">
          <div className="border-t border-b border-[var(--border)] py-16 grid lg:grid-cols-[1fr,2.2fr] gap-12 lg:gap-20">
             <div>
               <h2 className="font-[var(--font-display)] text-3xl md:text-[2.6rem] text-[var(--primary)] leading-[1.1] tracking-tight">
                 Atmosphere.<br/>Rhythm.<br/>Care.
               </h2>
               <p className="mt-6 text-[1.05rem] leading-[1.8] text-[var(--muted-foreground)] font-light max-w-xs">
                 Quiet luxury works when every guest-facing touchpoint feels seamlessly considered, never crowded.
               </p>
             </div>
             
             <div className="grid sm:grid-cols-3 gap-10 sm:gap-8 pt-2 lg:pt-0">
               {brandPillars.map((pillar, i) => (
                 <div key={pillar.title} className="relative">
                   <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--accent)] mb-4 lg:mb-6">0{i + 1}</p>
                   <h3 className="font-[var(--font-display)] text-[1.5rem] leading-tight text-[var(--primary)] mb-3">{pillar.title}</h3>
                   <p className="text-[0.95rem] leading-[1.7] text-[var(--muted-foreground)] font-light max-w-sm">{pillar.description}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Condensed Philosophy & Moments */}
      <section className="py-24 bg-[#0A111A] text-white mt-8 mb-20 relative overflow-hidden rounded-[40px] shadow-[0_20px_50px_rgba(10,20,30,0.15)] mx-4 md:mx-6">
        <div className="absolute top-0 right-0 w-[60%] h-[100%] bg-[radial-gradient(ellipse_at_right,rgba(184,140,74,0.05),transparent_70%)] pointer-events-none" />
        
        <div className="mx-auto max-w-[1300px] px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-[1.1fr,1fr] gap-16 lg:gap-24 items-start">
             
             <div className="lg:sticky lg:top-12">
                <span className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#ecd3a8] mb-6">
                  <span className="h-px w-6 bg-[#ecd3a8]" />
                  Philosophy
                </span>
                <h3 className="font-[var(--font-display)] text-[2.6rem] md:text-[3.4rem] leading-[1.05] tracking-tight mb-8 max-w-[16ch]">
                  The guest should notice the calm.
                </h3>
                <p className="text-[1.1rem] leading-[1.8] text-white/70 mb-12 max-w-md font-light">
                  A premium hotel should never feel disjointed. The suite, the welcome, the service rhythm, and the departure should all reinforce the exact same sense of thoughtful care.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex items-center gap-4 border border-white/10 rounded-[16px] px-5 py-4 bg-white/5 backdrop-blur-sm">
                    <ShieldCheck className="h-5 w-5 text-[#ecd3a8]" />
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ecd3a8]/70">Confidence</p>
                      <p className="text-[13px] text-white mt-0.5">Clear details & pacing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border border-white/10 rounded-[16px] px-5 py-4 bg-white/5 backdrop-blur-sm">
                    <MapPin className="h-5 w-5 text-[#ecd3a8]" />
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ecd3a8]/70">Location</p>
                      <p className="text-[13px] text-white mt-0.5 max-w-[200px] truncate">{branding.address}</p>
                    </div>
                  </div>
                </div>
             </div>

             <div className="space-y-0 border-t border-white/10">
               {signatureExperiences.map((item, index) => (
                 <div key={item.title} className="py-8 group border-b border-white/10 transition-colors hover:bg-white/[0.02]">
                   <div className="flex justify-between items-center cursor-default mb-3">
                     <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ecd3a8] flex items-center gap-2">
                       <Sparkles className="h-3 w-3" /> {item.eyebrow}
                     </p>
                     <p className="text-[10px] tracking-[0.2em] text-white/30">0{index + 1}</p>
                   </div>
                   <h4 className="font-[var(--font-display)] text-[1.8rem] text-white mt-1 mb-3 tracking-tight group-hover:pl-2 transition-all duration-300">{item.title}</h4>
                   <p className="text-[1rem] leading-[1.7] text-white/60 max-w-md font-light group-hover:pl-2 transition-all duration-300">{item.description}</p>
                 </div>
               ))}
             </div>

          </div>
        </div>
      </section>

      <section className="py-0">
        <div className="mx-auto max-w-[1380px] md:px-6">
          <div className="relative overflow-hidden rounded-t-[40px] md:rounded-t-[60px] bg-white border border-[var(--border)] shadow-[0_-10px_60px_rgba(10,20,30,0.04)] pt-24 pb-28 px-6 text-center">
            <div className="absolute inset-0 bg-[#FAF8F5] pointer-events-none mix-blend-multiply opacity-50" />
            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
               <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent)] mb-6">Continue Exploring</p>
               <h2 className="font-[var(--font-display)] text-[2.8rem] leading-[1.05] md:text-[4rem] tracking-tight text-[var(--primary)] mb-8">
                 Move from brand story to room selection.
               </h2>
               <p className="text-[1.1rem] leading-[1.8] text-[var(--muted-foreground)] font-light max-w-xl mb-12">
                 Explore the room collection, compare rates, and continue into a booking journey designed to be effortlessly beautiful.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full max-w-md mx-auto">
                 <Link to="/rooms" className="w-full">
                   <Button className="w-full h-14 rounded-full bg-[var(--primary)] text-[12px] font-bold uppercase tracking-[0.2em] text-white shadow-xl hover:bg-[var(--accent)] transition-all">
                     View Rooms
                   </Button>
                 </Link>
                 <Link to="/booking" className="w-full">
                   <Button variant="outline" className="w-full h-14 rounded-full border-[var(--border-strong)] bg-white text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm">
                     Book Now
                   </Button>
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
