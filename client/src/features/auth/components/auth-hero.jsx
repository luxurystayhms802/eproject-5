import { useLocation } from 'react-router-dom';
import { useHotelSettings } from '@/features/public/hooks';
import { getPublicBranding } from '@/features/public/utils';

export const AuthHero = ({ title, description }) => {
  const { pathname } = useLocation();
  const settingsQuery = useHotelSettings();
  const branding = getPublicBranding(settingsQuery.data);
  const websiteMedia = branding.websiteMedia || {};

  const isRegisterPage = pathname.includes('/register');
  const fallbackImage = websiteMedia.aboutHeroImageUrl || websiteMedia.destinationImageUrl || websiteMedia.diningImageUrl;
  const targetImage = isRegisterPage 
    ? (websiteMedia.registerHeroImageUrl || fallbackImage)
    : (websiteMedia.loginHeroImageUrl || fallbackImage);

  return (
    <div className="relative flex h-full w-full flex-col justify-between bg-[#081019] p-12 xl:p-16 text-white shadow-2xl">
      {/* Cinematic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.85] outline-none transition-transform duration-[25s] ease-out hover:scale-[1.04]"
        style={{ backgroundImage: `url(${targetImage})` }}
      />
      {/* Soft gradients only enough for text contrast naturally */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.1)_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] via-transparent to-transparent" />
      
      {/* Content Top */}
      <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000">
        <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#f7e3c3] drop-shadow-md">{branding.brandName}</p>
      </div>

      {/* Content Bottom */}
      <div className="relative z-10 space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-[200ms] fill-mode-both">
        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#f7e3c3] backdrop-blur-md shadow-lg">
          {branding.hotelName}
        </span>
        <h2 className="font-[var(--font-display)] text-5xl leading-[1.05] tracking-tight text-white drop-shadow-xl">{title}</h2>
        <p className="text-base leading-8 text-[rgba(255,255,255,0.85)] font-light drop-shadow-sm">{description}</p>
        
        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-white/15">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#f7e3c3]">Stay control</p>
            <p className="mt-1 text-[13px] font-medium text-white/70">Unified management</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#f7e3c3]">Secure access</p>
            <p className="mt-1 text-[13px] font-medium text-white/70">Private & guided recovery</p>
          </div>
        </div>
      </div>
    </div>
  );
};

