import { useState, useEffect } from 'react';
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

const Typewriter = ({ words, typingSpeed = 90, deletingSpeed = 40, pauseTime = 2500, textColorClass = "text-[#c5a059]" }) => {
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
    <span className={`inline-block ${textColorClass}`}>
      {text}
      <span className="animate-[pulse_0.8s_ease-in-out_infinite] ml-[1px] font-sans font-light not-italic">|</span>
    </span>
  );
};

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
    <div className="space-y-0 pb-0 bg-[#fbf9f6]">
      {/* 📸 HERO SECTION: Full width VIP dark background */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-[#0c1622] pt-20 px-4 md:px-8 overflow-hidden z-10">
        <div className="absolute inset-0 z-0">
          <div
            className="h-full w-full bg-cover bg-center opacity-40 mix-blend-luminosity scale-105"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c1622]/60 via-[#0c1622]/40 to-[#0c1622]" />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8 pb-10">
          <span className="inline-flex items-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-[#ecd3a8]">
            <span className="h-px w-8 bg-[#ecd3a8]" />
            About LuxuryStay
            <span className="h-px w-8 bg-[#ecd3a8]" />
          </span>
          <h1 className="font-[var(--font-display)] text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.05] !text-white drop-shadow-2xl">
            Designed to feel quietly unforgettable.
          </h1>
          <p className="text-[1.1rem] md:text-[1.2rem] leading-relaxed !text-white/90 max-w-2xl mx-auto font-light drop-shadow-md">
            LuxuryStay blends editorial elegance, boutique intimacy, and five-star hospitality so the first impression and the actual stay feel equally refined.
          </p>
        </div>
      </section>

      {/* Floating Stats Section crossing the dark/light barrier */}
      <section className="relative z-20 -mt-16 px-4 md:px-8">
        <div className="mx-auto max-w-[1200px] bg-white rounded-[32px] p-8 md:p-12 shadow-[0_30px_60px_rgba(8,24,44,0.06)] border border-[#0c1622]/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
             <div className="flex flex-col items-center">
               <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-[#c5a059] mb-3">Room Collections</p>
               <p className="font-[var(--font-display)] text-4xl md:text-5xl text-[#0c1622]">{String(roomTypes.length).padStart(2, '0')}</p>
             </div>
             <div className="flex flex-col items-center border-[rgba(8,24,44,0.05)] md:border-l">
               <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-[#c5a059] mb-3">Guest Sentiment</p>
               <p className="font-[var(--font-display)] text-4xl md:text-5xl text-[#0c1622]">{averageRating ? `${averageRating}/5` : 'N/A'}</p>
             </div>
             <div className="flex flex-col items-center border-[rgba(8,24,44,0.05)] border-t md:border-t-0 md:border-l pt-8 md:pt-0">
               <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-[#c5a059] mb-3">Signature Spaces</p>
               <p className="font-[var(--font-display)] text-4xl md:text-5xl text-[#0c1622]">03</p>
             </div>
             <div className="flex flex-col items-center border-[rgba(8,24,44,0.05)] border-t md:border-t-0 md:border-l pt-8 md:pt-0">
               <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-[#c5a059] mb-3">Check-in Vibe</p>
               <p className="font-[var(--font-display)] text-4xl md:text-5xl text-[#0c1622]">VIP</p>
             </div>
          </div>
        </div>
      </section>

      {/* Our Story Layout */}
      <section className="px-4 md:px-8 mt-24 mb-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            <div className="relative h-[600px] lg:h-[800px] w-full order-2 lg:order-1 hidden md:block">
              {/* Main Image */}
              <div className="absolute top-0 left-0 w-[80%] h-[85%] rounded-[40px] overflow-hidden shadow-[0_40px_80px_rgba(8,24,44,0.12)] z-10 bg-[#0c1622]">
                 <div
                   className="h-full w-full bg-cover bg-center transition-transform duration-[2s] hover:scale-105 opacity-90 mix-blend-screen"
                   style={{ backgroundImage: `url(${editorialImages[0]?.image || heroImage})` }}
                 />
                 <div className="absolute inset-0 border border-[#fbf9f6]/10 rounded-[40px] pointer-events-none" />
              </div>
              
              {/* Overlapping Image */}
              <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(8,24,44,0.3)] z-20 border-[8px] border-[#fbf9f6] bg-[#0c1622] group">
                 <div
                   className="h-full w-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110 opacity-90 mix-blend-screen"
                   style={{ backgroundImage: `url(${editorialImages[1]?.image || heroImage})` }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0c1622]/80 via-transparent to-transparent pointer-events-none" />
                 <div className="absolute bottom-6 left-6 right-6 text-center">
                    <p className="text-[#ecd3a8] text-[10px] uppercase tracking-[0.4em] font-bold">Signature</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-col justify-center order-1 lg:order-2 lg:pr-12">
               <span className="inline-flex w-fit items-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.35em] text-[#c5a059] mb-8">
                 <span className="h-px w-8 bg-[#c5a059]" />
                 Our Story
               </span>
               <h2 className="font-[var(--font-display)] text-[2.8rem] leading-[1.05] tracking-tight text-[#0c1622] md:text-[4rem] mb-8">
                 Hospitality should feel assured, not over-performed.
               </h2>
               <p className="text-[1.15rem] leading-[1.8] text-[#556375] font-light max-w-[48ch] mb-12">
                 {branding.hotelName} was built around a simple belief: the tone of the brand should match the quality of the welcome. Guests should feel warmth, clarity, and quiet confidence from the first screen to the final room delivery.
               </p>
               
               <div className="grid gap-5">
                 {servicePromises.map((promise, i) => (
                   <div key={i} className="flex items-center gap-5 p-5 rounded-[24px] bg-white border border-[#0c1622]/5 shadow-sm hover:shadow-[0_20px_40px_rgba(8,24,44,0.04)] transition-shadow duration-300">
                     <div className="h-12 w-12 flex shrink-0 items-center justify-center rounded-full bg-[#fbf9f6] text-[#c5a059]">
                       <CheckCircle2 className="h-5 w-5" />
                     </div>
                     <p className="text-[1rem] font-medium text-[#0c1622]">{promise}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Brand Pillars */}
      <section className="py-16 md:py-20 lg:py-24 bg-white border-y border-[#0c1622]/5">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
             <div>
               <span className="inline-flex items-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-[var(--accent)] mb-6">
                 <span className="h-px w-8 bg-[var(--accent)]" />
                 Principles
               </span>
               <h2 className="font-[var(--font-display)] text-3xl md:text-[3.2rem] lg:text-[4rem] text-[#0c1622] leading-[1.1] tracking-tight">
                 Atmosphere.<br/>
                 Rhythm.<br/>
                 <Typewriter words={['Care.', 'Presence.', 'Details.', 'Elegance.']} textColorClass="text-[var(--accent)]" />
               </h2>
               <p className="mt-6 md:mt-8 text-[1rem] md:text-[1.1rem] leading-[1.8] text-[#556375] font-light max-w-xs pl-4 md:pl-5 border-l-2 border-[var(--accent)]">
                 Quiet luxury works when every guest-facing touchpoint feels seamlessly considered, never crowded.
               </p>
             </div>
             
             <div className="flex flex-col justify-center gap-8 md:gap-10 lg:gap-12 pt-6 md:pt-0 pl-0 md:pl-8 lg:pl-12 md:border-l border-[#0c1622]/5">
               {brandPillars.map((pillar, i) => (
                 <div key={pillar.title} className="relative group">
                   <p className="text-[10px] font-black tracking-[0.4em] uppercase text-[var(--accent)] mb-2 md:mb-3 opacity-70 group-hover:opacity-100 transition-opacity">0{i + 1}</p>
                   <h3 className="font-[var(--font-display)] text-[1.5rem] md:text-[1.8rem] lg:text-[2rem] leading-tight text-[#0c1622] mb-2">{pillar.title}</h3>
                   <p className="text-[0.95rem] md:text-[1.05rem] leading-[1.7] text-[#556375] font-light max-w-md">{pillar.description}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Grand Philosophy Quote */}
      <section className="py-24 md:py-32 bg-[#fbf9f6] border-b border-[#0c1622]/5">
        <div className="mx-auto max-w-4xl text-center px-4">
          <span className="inline-flex items-center justify-center gap-4 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-[var(--accent)] mb-8 md:mb-12">
            <span className="h-px w-6 md:w-12 bg-[var(--accent)]" />
            Philosophy
            <span className="h-px w-6 md:w-12 bg-[var(--accent)]" />
          </span>
          <h3 className="font-[var(--font-display)] text-[2.8rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-tight text-[#0c1622] mb-10">
            The guest should notice the calm.
          </h3>
          <p className="text-[1.1rem] md:text-[1.25rem] leading-[1.8] text-[#556375] font-light mx-auto max-w-2xl italic">
            A premium hotel should never feel disjointed. The suite, the welcome, the service rhythm, and the departure should all reinforce the exact same sense of thoughtful care.
          </p>
        </div>
      </section>

      {/* Editorial Staggered Experiences */}
      <section className="py-24 md:py-32 bg-white">
        <div className="mx-auto max-w-[1300px] px-4 md:px-8 flex flex-col gap-24 md:gap-40">
          {(() => {
            const abs = settingsQuery.data?.aboutPageSettings;
            const dynamicExperiences = [
              {
                title: abs?.diningExperience?.title || signatureExperiences[0].title,
                description: abs?.diningExperience?.description || signatureExperiences[0].description,
                image: abs?.diningExperience?.imageUrl || editorialImages[1]?.image || getPrimaryImage(roomTypes[0])
              },
              {
                title: abs?.wellnessExperience?.title || signatureExperiences[1].title,
                description: abs?.wellnessExperience?.description || signatureExperiences[1].description,
                image: abs?.wellnessExperience?.imageUrl || getPrimaryImage(roomTypes[1] || roomTypes[0])
              },
              {
                title: abs?.eventsExperience?.title || signatureExperiences[2].title,
                description: abs?.eventsExperience?.description || signatureExperiences[2].description,
                image: abs?.eventsExperience?.imageUrl || editorialImages[2]?.image || getPrimaryImage(roomTypes[2] || roomTypes[0])
              }
            ];

            return dynamicExperiences.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={item.title + index} className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-16 lg:gap-24 items-center`}>
                  {/* Image Block */}
                  <div className="w-full md:w-1/2 aspect-[4/5] overflow-hidden rounded-[24px] md:rounded-[40px] shadow-2xl relative group">
                    <div className="absolute inset-0 bg-[#0c1622]/10 z-10 group-hover:bg-transparent transition-colors duration-700" />
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out" />
                  </div>
                  
                  {/* Text Block */}
                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-[var(--accent)] mb-6 flex items-center gap-4">
                      0{index + 1} <span className="h-px w-16 bg-[var(--accent)]" />
                    </p>
                    <h4 className="font-[var(--font-display)] text-[2.2rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.05] text-[#0c1622] mb-6 tracking-tight">
                      {item.title}
                    </h4>
                    <p className="text-[1.05rem] md:text-[1.1rem] leading-[1.8] text-[#556375] font-light max-w-lg whitespace-pre-line">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      {/* Premium Dark CTA Footer */}
      <section className="bg-[#0c1622] text-white py-32 px-4 md:px-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(197,160,89,0.06),transparent_60%)] pointer-events-none" />
        
        <div className="mx-auto max-w-3xl text-center relative z-10">
           <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-[#c5a059] mb-8">Continue Exploring</p>
           <h2 className="font-[var(--font-display)] text-[2.8rem] md:text-[4.5rem] lg:text-[5rem] leading-[1.05] tracking-tight mb-8">
             Move from brand story to room selection.
           </h2>
           <p className="text-[1.1rem] md:text-[1.2rem] leading-[1.8] text-white/50 font-light max-w-xl mx-auto mb-14">
             Explore the room collection, compare rates, and continue into a booking journey designed to be effortlessly beautiful.
           </p>
           
           <div className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full max-w-lg mx-auto">
             <Link to="/rooms" className="w-full">
               <Button className="w-full h-16 md:h-16 rounded-[12px] bg-[#c5a059] text-[11px] font-black uppercase tracking-[0.2em] text-[#0c1622] shadow-[0_0_40px_rgba(197,160,89,0.2)] hover:bg-[#d4b272] transition-all">
                 View Rooms
               </Button>
             </Link>
             <Link to="/booking" className="w-full">
               <Button variant="outline" className="w-full h-16 md:h-16 rounded-[12px] border-white/20 bg-transparent text-[11px] font-black uppercase tracking-[0.2em] text-white hover:border-white hover:bg-white/5 hover:text-white transition-all">
                 Book Now
               </Button>
             </Link>
           </div>
        </div>
      </section>
    </div>
  );
};
