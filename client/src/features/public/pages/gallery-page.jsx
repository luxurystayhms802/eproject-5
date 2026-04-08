import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PublicGalleryLightbox } from '@/features/public/components/public-gallery-lightbox';
import { PublicPageHero } from '@/features/public/components/public-page-hero';
import { PublicSectionHeading } from '@/features/public/components/public-section-heading';
import { useHotelSettings, useRoomTypes, useRooms } from '@/features/public/hooks';
import { attachRoomImagesToRoomTypes, buildGalleryItems, getPrimaryImage, getPublicBranding } from '@/features/public/utils';

export const GalleryPage = () => {
  const settingsQuery = useHotelSettings();
  const roomTypesQuery = useRoomTypes({ isActive: true, limit: 24 });
  const roomsQuery = useRooms({ isActive: true, limit: 200 });
  const branding = getPublicBranding(settingsQuery.data);
  const websiteMedia = branding.websiteMedia || {};
  const liveRooms = roomsQuery.data?.data ?? [];
  const roomTypes = attachRoomImagesToRoomTypes(roomTypesQuery.data?.data ?? [], liveRooms);
  const galleryItems = buildGalleryItems(roomTypes, liveRooms);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const categories = ['All', ...Array.from(new Set(galleryItems.map((item) => item.category)))];
  const categoryCounts = categories.reduce(
    (counts, category) => ({
      ...counts,
      [category]: category === 'All' ? galleryItems.length : galleryItems.filter((item) => item.category === category).length,
    }),
    {},
  );
  const visibleItems =
    activeCategory === 'All' ? galleryItems : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <div className="space-y-20 pb-8">
      <section className="relative h-[700px] w-full bg-[#08101a] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-65 transition-transform duration-[20s] ease-out hover:scale-110"
          style={{ backgroundImage: `url(${websiteMedia.galleryHighlightUrl || websiteMedia.destinationImageUrl || getPrimaryImage(roomTypes[0])})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,16,26,0.3)_0%,rgba(8,16,26,0.1)_40%,var(--primary)_100%)]" />
        
        <div className="relative z-10 mx-auto flex h-full max-w-[1380px] flex-col items-center justify-center px-4 text-center md:px-6">
          <span className="mb-8 inline-flex rounded-full border border-[rgba(184,140,74,0.3)] bg-[rgba(184,140,74,0.1)] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.35em] text-[#f7e3c3] shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
            The Gallery
          </span>
          <h1 className="font-[var(--font-display)] text-5xl leading-[1.05] !text-white drop-shadow-xl md:text-7xl lg:text-[5.5rem] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-both">
            A cinematic view of rooms, <br className="hidden md:block" /> atmosphere, and lifestyle.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-[1.8] !text-[rgba(255,255,255,0.8)] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
            {branding.hotelName} is presented through a gallery language that stays calm, tactile, and unmistakably hospitality-first.
          </p>
          
          <div className="mt-16 flex flex-wrap justify-center gap-16 border-t border-white/15 pt-8 md:gap-24 animate-in fade-in duration-1000 delay-500 fill-mode-both">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)] text-shadow-sm">Visual library</p>
              <p className="mt-2 font-[var(--font-display)] text-4xl !text-white">{galleryItems.length}+</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)] text-shadow-sm">Categories</p>
              <p className="mt-2 font-[var(--font-display)] text-4xl !text-white">{categories.length - 1}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6">
        <div className="mx-auto max-w-[1380px] space-y-8">
          <PublicSectionHeading
            eyebrow="Visual edit"
            title="Explore the hotel through room imagery, atmosphere, and hospitality scenes."
            description="Use the gallery to move through the brand with the same ease and confidence expected from the stay itself."
          />

          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <Card className="rounded-[28px] p-6 lg:p-8 before:hidden">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--muted-foreground)]">Total visual assets</p>
                  <p className="mt-3 font-[var(--font-display)] text-3xl sm:text-4xl leading-none text-[var(--primary)]">{categoryCounts.All}</p>
                </div>
                {categories.length > 2 ? (
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--muted-foreground)]">Currently viewing</p>
                    <p className="mt-3 font-[var(--font-display)] text-3xl sm:text-4xl leading-none text-[var(--primary)]">{visibleItems.length}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--muted-foreground)]">Gallery presentation</p>
                    <p className="mt-3 font-[var(--font-display)] text-2xl sm:text-3xl leading-none text-[var(--primary)]">Complete collection</p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex flex-wrap items-center gap-2 md:justify-end h-full">
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-[32px] border border-[var(--border)] bg-white/40 shadow-sm backdrop-blur-md">
                {categories.length > 2 && categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`relative rounded-full px-6 py-3 text-xs sm:text-[13px] font-semibold uppercase tracking-[0.12em] transition-all duration-500 ease-out ${
                      activeCategory === category
                        ? 'bg-[var(--primary)] text-white shadow-lg scale-100'
                        : 'bg-transparent text-[var(--muted-foreground)] hover:bg-white/60 hover:text-[var(--primary)]'
                    }`}
                  >
                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span className={`ml-2 transition-opacity ${activeCategory === category ? 'opacity-70' : 'opacity-40 hover:opacity-100'}`}>
                      ({categoryCounts[category]})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 auto-rows-[300px]">
            {visibleItems.map((item, index) => {
              const isLargeSpace = visibleItems.length > 3 && index % 6 === 0;
              const isTall = visibleItems.length > 5 && index % 7 === 1;
              const isWide = visibleItems.length > 4 && index % 5 === 2;

              let spanClasses = 'col-span-1 row-span-1';
              if (isLargeSpace) spanClasses = 'md:col-span-2 md:row-span-2';
              else if (isTall) spanClasses = 'md:col-span-1 md:row-span-2';
              else if (isWide) spanClasses = 'md:col-span-2 md:row-span-1';

              return (
                <button
                  type="button"
                  key={item.id}
                  style={{ animationDelay: `${Math.min(index * 75, 1000)}ms` }}
                  className={`group relative overflow-hidden rounded-[32px] border border-white/30 text-left shadow-[var(--shadow-soft)] transition-all duration-700 hover:shadow-2xl hover:-translate-y-1 block animate-in fade-in slide-in-from-bottom-12 duration-[1.2s] ease-out fill-mode-both ${spanClasses}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div 
                    className="absolute inset-0 transition-transform duration-[1.8s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.12] bg-[#0c1c30]"
                    style={
                      item.image
                        ? {
                            backgroundImage: `url(${item.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : item.backdropStyle
                    }
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,24,44,0)_0%,rgba(8,24,44,0.15)_45%,rgba(5,15,30,0.95)_100%)] transition-opacity duration-700 group-hover:opacity-90" />

                  <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
                    <span className="w-max rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.34em] text-[#f7e3c3] backdrop-blur-md shadow-sm transition-all duration-500 group-hover:-translate-y-3 group-hover:border-[var(--accent)]/80">
                      {item.category}
                    </span>
                    <h3 className="mt-5 font-[var(--font-display)] text-3xl leading-[1.1] md:text-4xl lg:text-[2.6rem] text-white drop-shadow-md transition-transform duration-500 delay-[50ms] group-hover:-translate-y-3">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-white/85 transition-all duration-500 delay-[120ms] group-hover:-translate-y-3 opacity-0 group-hover:opacity-100 translate-y-6">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {visibleItems.length === 0 ? (
            <Card className="rounded-2xl p-8">
              <h3 className="font-[var(--font-display)] text-4xl leading-none text-[var(--primary)]">No images in this category yet</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
                New room and hotel imagery will appear here as the visual collection continues to grow.
              </p>
            </Card>
          ) : null}
        </div>
      </section>

      <PublicGalleryLightbox item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};

