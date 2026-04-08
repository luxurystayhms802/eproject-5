import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Facebook, Globe2, Instagram, Linkedin, Mail, MapPin, Menu, Phone, X, Youtube } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { getRoleLandingPath } from '@/features/auth/components/role-landing';
import { useHotelSettings } from '@/features/public/hooks';
import { getPublicBranding } from '@/features/public/utils';
import { ScrollToTop } from '@/components/shared/scroll-to-top';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Rooms', href: '/rooms' },
  { label: 'Amenities', href: '/amenities' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const pageTitles = {
  '/': 'Home',
  '/about': 'About',
  '/rooms': 'Rooms',
  '/amenities': 'Amenities',
  '/gallery': 'Gallery',
  '/booking': 'Booking',
  '/contact': 'Contact',
  '/faq': 'FAQ',
  '/login': 'Sign In',
  '/register': 'Sign Up',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
};

const socialLinkConfig = {
  facebook: { label: 'Facebook', icon: Facebook },
  instagram: { label: 'Instagram', icon: Instagram },
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  x: { label: 'X', icon: Globe2 },
  youtube: { label: 'YouTube', icon: Youtube },
};

const desktopNavClassName = ({ isActive }) =>
  [
    'group relative inline-flex items-center px-1 py-2 text-[11px] md:text-[11.5px] font-semibold tracking-[0.2em] uppercase transition-all duration-500',
    isActive ? '!text-[#ecd3a8] drop-shadow-sm' : '!text-white/60 hover:!text-white',
  ].join(' ');

export const PublicLayout = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const settingsQuery = useHotelSettings();
  const branding = getPublicBranding(settingsQuery.data);
  const dashboardPath = user ? getRoleLandingPath(user.role) : '/login';
  const isHomePage = location.pathname === '/';

  const socialEntries = Object.entries(branding.socialLinks || {})
    .filter(([, value]) => Boolean(String(value || '').trim()))
    .map(([key, value]) => ({
      key,
      url: value,
      ...(socialLinkConfig[key] || { label: key, icon: Globe2 }),
    }));

  useEffect(() => {
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 24);

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const activeTitle = pageTitles[location.pathname] || branding.hotelName;
    const metaTitle = branding.seoSettings?.metaTitle || branding.brandName;
    document.title = location.pathname === '/' ? metaTitle : `${activeTitle} | ${branding.brandName}`;

    if (branding.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    }
  }, [branding, location.pathname]);

  const headerSolid = !isHomePage || hasScrolled;

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#f8f4ed_0%,#f5efe7_44%,#f8f4ee_100%)]"
      style={{
        '--primary': branding.themeSettings.primaryColor || '#10243f',
        '--accent': branding.themeSettings.accentColor || '#b88c4a',
      }}
    >
      <header className={`fixed inset-x-0 top-0 z-50 px-4 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] md:px-6 ${headerSolid ? 'pt-2 md:pt-3' : 'pt-4 md:pt-6'}`}>
        <div
          className={[
            'mx-auto flex max-w-[1380px] items-center justify-between rounded-full border transition-all duration-500',
            headerSolid
              ? 'border-white/10 bg-[rgba(10,18,28,0.85)] px-4 py-2.5 md:px-6 shadow-[0_18px_48px_rgba(0,0,0,0.3)] backdrop-blur-xl scale-[0.98]'
              : 'border-white/5 bg-[rgba(10,18,28,0.4)] px-5 py-4 md:px-8 shadow-[0_14px_34px_rgba(0,0,0,0.12)] backdrop-blur-md scale-100',
          ].join(' ')}
        >
          <Link to="/" className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.brandName} className="h-16 w-16 rounded-full object-cover text-transparent" />
            ) : (
              <div className="h-16 w-16 rounded-full border border-white/14 bg-white/8" />
            )}

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#ecd3a8]">{branding.brandName}</p>
              <p className="mt-1 text-xl leading-none text-white">{branding.hotelName}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:gap-8 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.href} to={item.href} className={desktopNavClassName}>
                {({ isActive }) => (
                  <span className="relative">
                    {item.label}
                    <span
                      className={`absolute -bottom-1.5 left-1/2 h-[1.5px] bg-[#ecd3a8] transition-all duration-500 ease-out -translate-x-1/2 ${
                        isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50'
                      }`}
                    />
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link
              to={dashboardPath}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] !text-white/80 visited:!text-white/80 transition-all duration-300 hover:!text-white hover:opacity-100 focus:outline-none"
            >
              {user ? 'My Account' : 'Sign In'}
            </Link>
            <Link
              to="/booking"
              className="relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.2em] shadow-lg transition-all duration-500 hover:scale-105 border border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
            >
              Book Now
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/16 bg-white/8 text-white transition hover:bg-white/12 lg:hidden"
            aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>

        {isMenuOpen ? (
          <div className="mx-auto mt-3 max-w-[1320px] rounded-[24px] border border-white/14 bg-[rgba(10,18,28,0.94)] p-4 shadow-[0_20px_52px_rgba(10,18,28,0.18)] backdrop-blur-xl lg:hidden">
            <nav className="grid gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      'rounded-[16px] px-4 py-3 text-sm transition',
                      isActive ? 'bg-white/10 text-white' : 'text-white/76 hover:bg-white/8 hover:text-white',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to={dashboardPath}
                className="inline-flex items-center justify-center rounded-full border border-white/16 bg-white/8 px-4 py-2.5 text-sm font-medium !text-white visited:!text-white transition hover:bg-white/12 hover:!text-white"
              >
                {user ? 'My Account' : 'Sign In'}
              </Link>
              <Link
                to="/booking"
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#a97c3d]"
              >
                Book Now
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main className="pt-[92px] md:pt-[104px]">
        <Outlet />
      </main>

      <footer id="contact" className="mt-16 bg-[#081019] text-white">
        <div className="mx-auto max-w-[1320px] px-4 py-8 md:px-6 md:py-10">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,#09121d,#0f1b2a_48%,#122236)] px-5 py-6 shadow-[0_24px_70px_rgba(5,12,20,0.2)] md:px-7 md:py-7">
            <div className="grid gap-5 lg:grid-cols-[1fr,0.8fr,0.9fr] lg:items-start">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#ecd3a8]">{branding.brandName}</p>
                  <h2 className="text-[1.7rem] leading-none text-white">{branding.hotelName}</h2>
                  <p className="max-w-sm text-sm leading-6 text-white/64">{branding.footerDescription}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-white/74">
                    {branding.checkInTime} check-in
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-white/74">
                    {branding.checkOutTime} check-out
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <Link
                    to="/booking"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#a97c3d]"
                  >
                    Reserve stay
                  </Link>
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
                  >
                    {user ? 'My Account' : 'Guest Access'}
                  </Link>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ecd3a8]">Quick Links</p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  {navItems.map((item) => (
                    <Link key={item.href} to={item.href} className="text-white/68 transition hover:text-white">
                      {item.label}
                    </Link>
                  ))}
                  <Link to="/booking" className="text-white/68 transition hover:text-white">
                    Booking
                  </Link>
                  <Link to="/faq" className="text-white/68 transition hover:text-white">
                    FAQ
                  </Link>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ecd3a8]">Contact</p>
                <div className="mt-3 space-y-3.5 text-sm text-white/68">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ecd3a8]" />
                    <span>{branding.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-[#ecd3a8]" />
                    <a href={`mailto:${branding.contactEmail}`} className="transition hover:text-white">
                      {branding.contactEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-[#ecd3a8]" />
                    <a href={`tel:${branding.contactPhone}`} className="transition hover:text-white">
                      {branding.contactPhone}
                    </a>
                  </div>
                </div>

                {socialEntries.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {socialEntries.map((item) => {
                      const Icon = item.icon;

                      return (
                        <a
                          key={item.key}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={item.label}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/74 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 border-t border-white/10 pt-4 text-xs text-white/44 sm:flex-row sm:items-center sm:justify-between">
              <p>&copy; {new Date().getFullYear()} {branding.brandName}. All rights reserved.</p>
              <p>Luxury hospitality, calm booking, and polished guest care.</p>
            </div>
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
};
