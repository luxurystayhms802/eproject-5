import { X } from 'lucide-react';

export const PublicGalleryLightbox = ({ item, onClose }) => {
  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,14,27,0.82)] p-6 backdrop-blur-md">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/12 bg-[rgba(9,18,32,0.96)] text-white shadow-[0_34px_120px_rgba(0,0,0,0.38)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition hover:bg-white/14"
          aria-label="Close gallery preview"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid min-h-[540px] lg:grid-cols-[1.25fr,0.75fr]">
          <div
            className="min-h-[420px]"
            style={
              item.image
                ? {
                    backgroundImage: `linear-gradient(180deg,rgba(5,14,27,0.08),rgba(5,14,27,0.62)), url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : item.backdropStyle
            }
          />
          <div className="flex flex-col justify-end gap-6 p-6 md:p-8">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f3d7aa]">
                {item.category}
              </span>
              <h3 className="font-[var(--font-display)] text-4xl leading-none">{item.title}</h3>
              <p className="text-sm leading-7 text-white/74">{item.description}</p>
            </div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/44">LuxuryStay public gallery</p>
          </div>
        </div>
      </div>
    </div>
  );
};

