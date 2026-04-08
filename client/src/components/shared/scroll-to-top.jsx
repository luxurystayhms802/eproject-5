import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { useHotelSettings } from '@/features/public/hooks';
import { getPublicBranding } from '@/features/public/utils';

export const ScrollToTop = ({ targetId }) => {
  const { data: settings } = useHotelSettings();
  const branding = getPublicBranding(settings);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = targetId ? document.getElementById(targetId) : window;
    if (!target) return;

    const toggleVisibility = () => {
      const scrollY = target === window ? window.scrollY : target.scrollTop;
      setIsVisible(scrollY > 300);
    };

    target.addEventListener('scroll', toggleVisibility);
    return () => target.removeEventListener('scroll', toggleVisibility);
  }, [targetId]);

  const scrollToTop = () => {
    const target = targetId ? document.getElementById(targetId) : window;
    if (!target) return;
    
    target.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!branding?.scrollToTopUrl) {
    return null;
  }

  return (
    <div
      className={`group fixed bottom-6 right-6 z-[999] p-2 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-12 opacity-0'
      }`}
    >
      <button
        onClick={scrollToTop}
        className="relative flex cursor-pointer flex-col items-center justify-center transition-all duration-500 group-hover:-translate-y-4"
        aria-label="Scroll to top"
      >
        <div className="absolute -top-7 flex items-center justify-center text-[#b88c4a] opacity-70 animate-pulse drop-shadow-sm transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-110 group-hover:animate-none group-hover:opacity-100 group-hover:drop-shadow-md">
          <ChevronUp className="h-6 w-6" strokeWidth={2.5} />
        </div>

        <img
          src={branding.scrollToTopUrl}
          alt="Scroll up"
          className="h-16 w-16 object-contain opacity-90 drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.15] group-hover:rotate-[6deg] group-hover:opacity-100 group-hover:drop-shadow-[0_24px_48px_rgba(184,140,74,0.4)]"
        />
      </button>
    </div>
  );
};
