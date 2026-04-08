import { settingRepository } from './setting.repository.js';

const buildDefaultSettings = () => ({
  hotelName: 'LuxuryStay Downtown',
  brandName: 'LuxuryStay Hospitality',
  contactEmail: 'hello@luxurystay.com',
  contactPhone: '+92-300-0000000',
  address: 'Luxury Avenue, Clifton, Karachi',
  contactChannels: {
    supportEmail: 'support@luxurystay.com',
    reservationsEmail: 'reservations@luxurystay.com',
    reservationsPhone: '+92-300-1111111',
    whatsappPhone: '+92-300-2222222',
  },
  currency: 'PKR',
  timezone: 'Asia/Karachi',
  taxRules: [{ name: 'Hotel Tax', percentage: 13, appliesTo: 'room_nights' }],
  checkInTime: '14:00',
  checkOutTime: '12:00',
  cancellationPolicy: 'Free cancellation up to 24 hours before arrival.',
  invoiceTerms: 'Payments are due upon checkout unless corporate billing is approved.',
  logoUrl: null,
  faviconUrl: null,
  scrollToTopUrl: null,
  websiteSettings: {
    heroTitle: 'A warmer kind of five-star city stay.',
    heroSubtitle: 'Discover suites, dining, wellness, and a reservation journey shaped to feel calm, refined, and beautifully paced from the very first click.',
    footerDescription: 'LuxuryStay Hospitality blends boutique warmth, five-star ease, and polished guest care across every arrival, suite, and signature stay.',
    mapEmbedUrl: '',
    heroGalleryUrls: [],
    aboutHeroImageUrl: '',
    storyImageUrl: '',
    diningImageUrl: '',
    wellnessImageUrl: '',
    eventsImageUrl: '',
    destinationImageUrl: '',
    contactImageUrl: '',
    galleryHighlightUrl: '',
  },
  seoSettings: {
    metaTitle: 'LuxuryStay Hospitality | Luxury Hotel, Suites, Dining, and Reservations',
    metaDescription: 'Discover a premium hotel website experience with refined suites, signature dining, seamless reservations, and five-star hospitality.',
    metaKeywords: 'luxury hotel, hotel suites, five star hotel, hotel booking, premium hospitality, boutique hotel',
  },
  socialLinks: {
    facebook: '',
    instagram: '',
    linkedin: '',
    x: '',
    youtube: '',
  },
  bookingSettings: {
    onlineBookingEnabled: true,
    allowGuestRegistration: true,
    showPublicPricing: true,
    requireApprovalForOnlineBookings: false,
  },
  notificationSettings: {
    guestBookingAlertsEnabled: true,
    adminBroadcastsEnabled: true,
    housekeepingCheckoutAlertsEnabled: true,
    maintenanceEscalationAlertsEnabled: true,
  },
  themeSettings: {
    primaryColor: '#10243f',
    accentColor: '#b88c4a',
    darkModeEnabled: true,
  },
});

export const settingService = {
    async getSettings() {
        const settings = await settingRepository.findCurrent();
        return settings ?? buildDefaultSettings();
    },
    updateSettings: (payload) => settingRepository.updateCurrent(payload),
};
