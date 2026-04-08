import { useState } from 'react';
import { Minus, Plus, MessageSquareText } from 'lucide-react';

import { PublicSectionHeading } from '@/features/public/components/public-section-heading';
import { useFaqs, useHotelSettings, useRoomTypes } from '@/features/public/hooks';
import { getPrimaryImage, getPublicBranding } from '@/features/public/utils';

export const FaqPage = () => {
  const settingsQuery = useHotelSettings();
  const roomTypesQuery = useRoomTypes({ isActive: true, limit: 6 });
  const faqsQuery = useFaqs();

  const branding = getPublicBranding(settingsQuery.data);
  const roomTypes = roomTypesQuery.data?.data ?? [];
  const faqs = faqsQuery.data?.filter(f => f.isActive) ?? [];

  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-24 pb-8">
      <section className="relative px-4 pb-12 pt-6 md:px-6">
        <div className="mx-auto max-w-[1380px]">
          <div className="relative overflow-hidden rounded-[40px] bg-[#0c1c30] shadow-[0_24px_64px_rgba(16,36,63,0.15)]">
            <div className="absolute inset-0">
              <img
                src={branding.websiteMedia?.faqHeroImageUrl || getPrimaryImage(roomTypes[0])}
                alt="Frequently asked questions"
                className="h-full w-full object-cover opacity-60 contrast-[1.05] transition-opacity duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#091524] via-[#0c1c30]/50 to-[#0c1c30]/10" />
            </div>

            <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-28 text-center sm:px-12 md:py-44">
              <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-2 text-[10.5px] font-bold uppercase tracking-[0.4em] text-[var(--accent)] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"></span>
                At Your Service
              </span>
              <h1 className="font-[var(--font-display)] text-[2.75rem] leading-[1.05] tracking-tight !text-white drop-shadow-sm sm:text-[4rem] md:text-[5.5rem]">
                Frequently Asked<br className="hidden md:block" /> Questions
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-[1.15rem] leading-[1.8] !text-white drop-shadow-sm sm:text-white/90 md:text-[1.3rem]">
                A premium stay begins long before arrival. Find calm, confident answers regarding your reservation, billing, and the {branding.hotelName} experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6">
        <div className="mx-auto max-w-[840px] space-y-12">
          <div className="text-center space-y-5">
            <span className="inline-flex rounded-full border border-[var(--border-strong)] bg-white/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)] shadow-sm backdrop-blur-md">
              Common Questions
            </span>
            <h2 className="font-[var(--font-display)] text-4xl leading-[1.1] text-[var(--primary)] md:text-[3.25rem]">
              Everything you need to know before you arrive.
            </h2>
          </div>

          <div className="space-y-4">
            {faqsQuery.isLoading ? (
              <div className="py-12 text-center text-[var(--muted-foreground)]">
                Loading frequently asked questions...
              </div>
            ) : faqs.length === 0 ? (
              <div className="py-12 text-center text-[var(--muted-foreground)]">
                More information and common guides will be published soon.
              </div>
            ) : (
              faqs.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div key={item.id} className={`group overflow-hidden rounded-[24px] border transition-all duration-500 ${isOpen ? 'border-[rgba(184,140,74,0.3)] bg-white shadow-[0_24px_54px_rgba(16,36,63,0.06)] scale-[1.01]' : 'border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,252,246,0.6),rgba(248,239,226,0.6))] hover:bg-white hover:border-[rgba(16,36,63,0.15)] hover:shadow-sm'}`}>
                    <button
                      className="flex w-full items-center justify-between p-6 text-left focus:outline-none sm:p-8"
                      onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    >
                      <h3 className={`font-[var(--font-display)] text-[1.4rem] leading-tight transition-colors duration-300 sm:text-[1.65rem] ${isOpen ? 'text-[var(--accent-strong)]' : 'text-[var(--primary)] group-hover:text-[var(--accent-strong)]'}`}>
                        {item.question}
                      </h3>
                      <span className={`ml-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-md' : 'border-[var(--border-strong)] bg-white text-[var(--primary)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] group-hover:bg-white'}`}>
                        {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </span>
                    </button>
                    <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-6 pb-8 sm:px-8">
                          <div className="flex gap-4">
                            <div className="mt-1 shrink-0 hidden sm:block">
                              <MessageSquareText className="h-5 w-5 text-[var(--accent)]/60" />
                            </div>
                            <p className="max-w-[640px] text-[1.05rem] leading-[1.8] text-[var(--muted-foreground)] whitespace-pre-line">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

