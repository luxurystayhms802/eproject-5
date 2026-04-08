import { galleryFallbackMoments } from '@/features/public/content';

export const formatCurrency = (value) => {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
};

export const getPrimaryImage = (roomType) => {
  if (!roomType?.images?.length) {
    return null;
  }

  return roomType.images.find(Boolean) ?? null;
};

export const buildImageBackdrop = (imageUrl, fallbackIndex = 0) => {
  const fallbacks = [
    'linear-gradient(135deg, rgba(10, 24, 44, 0.94), rgba(24, 52, 88, 0.74), rgba(184, 140, 74, 0.42))',
    'linear-gradient(135deg, rgba(28, 36, 48, 0.94), rgba(74, 56, 40, 0.7), rgba(184, 140, 74, 0.5))',
    'linear-gradient(135deg, rgba(16, 36, 63, 0.95), rgba(64, 52, 69, 0.74), rgba(206, 176, 126, 0.46))',
  ];

  if (!imageUrl) {
    return {
      backgroundImage: fallbacks[fallbackIndex % fallbacks.length],
    };
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(10, 24, 44, 0.1), rgba(10, 24, 44, 0.68)), url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
};

export const getUniqueAmenities = (roomTypes) => {
  const uniqueAmenities = new Map();

  roomTypes.forEach((roomType) => {
    (roomType?.amenities ?? []).forEach((amenity) => {
      if (!uniqueAmenities.has(amenity)) {
        uniqueAmenities.set(amenity, amenity);
      }
    });
  });

  return Array.from(uniqueAmenities.values());
};

export const getRoomGalleryForType = (roomType, rooms = []) => {
  const roomTypeId = roomType?.id ?? roomType?._id ?? roomType?.roomTypeId ?? null;
  const roomImages = rooms
    .filter((room) => {
      const linkedRoomTypeId = room?.roomTypeId?.id ?? room?.roomTypeId ?? null;
      return linkedRoomTypeId === roomTypeId;
    })
    .flatMap((room) => room?.images ?? [])
    .filter(Boolean);

  const roomTypeImages = (roomType?.images ?? []).filter(Boolean);
  return Array.from(new Set([...roomImages, ...roomTypeImages]));
};

export const attachRoomImagesToRoomTypes = (roomTypes = [], rooms = []) =>
  roomTypes.map((roomType) => ({
    ...roomType,
    images: getRoomGalleryForType(roomType, rooms),
  }));

export const buildGalleryItems = (roomTypes, rooms = []) => {
  const roomImageItems = rooms.flatMap((room, roomIndex) =>
    (room?.images ?? []).map((image, imageIndex) => ({
      id: `${room.id}-${imageIndex}`,
      image,
      title: room.roomType?.name ? `${room.roomType.name} | Room ${room.roomNumber}` : `Room ${room.roomNumber}`,
      category: 'Rooms',
      description: room.notes || 'A curated room image from the hotel collection.',
      backdropStyle: buildImageBackdrop(image, roomIndex),
    })),
  );

  if (roomImageItems.length > 0) {
    return roomImageItems;
  }

  const imageItems = roomTypes.flatMap((roomType, roomTypeIndex) =>
    (roomType?.images ?? []).map((image, imageIndex) => ({
      id: `${roomType.id}-${imageIndex}`,
      image,
      title: roomType.name,
      category: 'Rooms',
      description: roomType.shortDescription,
      backdropStyle: buildImageBackdrop(image, roomTypeIndex),
    })),
  );

  if (imageItems.length > 0) {
    return imageItems;
  }

  return galleryFallbackMoments.map((item, index) => ({
    id: `fallback-${index}`,
    image: null,
    title: item.title,
    category: item.category,
    description: item.description,
    backdropStyle: buildImageBackdrop(null, index),
  }));
};

export const getBookingDatesSummary = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const difference = end.getTime() - start.getTime();

  if (Number.isNaN(difference) || difference <= 0) {
    return 0;
  }

  return Math.ceil(difference / (24 * 60 * 60 * 1000));
};

export const getPublicBranding = (settings) => ({
  brandName: settings?.brandName || 'LuxuryStay Hospitality',
  hotelName: settings?.hotelName || 'LuxuryStay Downtown',
  contactEmail: settings?.contactEmail || 'hello@luxurystay.com',
  contactPhone: settings?.contactPhone || '+92-300-0000000',
  address: settings?.address || 'Luxury Avenue, Clifton, Karachi',
  logoUrl: settings?.logoUrl || null,
  faviconUrl: settings?.faviconUrl || null,
  scrollToTopUrl: settings?.scrollToTopUrl || null,
  heroTitle:
    settings?.websiteSettings?.heroTitle || 'A warmer kind of five-star city stay.',
  heroSubtitle:
    settings?.websiteSettings?.heroSubtitle ||
    'Discover suites, dining, wellness, and a reservation journey shaped to feel calm, refined, and beautifully paced from the very first click.',
  footerDescription:
    settings?.websiteSettings?.footerDescription ||
    'LuxuryStay Hospitality blends boutique warmth, five-star ease, and polished guest care across every arrival, suite, and signature stay.',
  mapEmbedUrl: settings?.websiteSettings?.mapEmbedUrl || '',
  websiteMedia: {
    heroGalleryUrls: settings?.websiteSettings?.heroGalleryUrls || [],
    aboutHeroImageUrl: settings?.websiteSettings?.aboutHeroImageUrl || '',
    storyImageUrl: settings?.websiteSettings?.storyImageUrl || '',
    diningImageUrl: settings?.websiteSettings?.diningImageUrl || '',
    wellnessImageUrl: settings?.websiteSettings?.wellnessImageUrl || '',
    eventsImageUrl: settings?.websiteSettings?.eventsImageUrl || '',
    destinationImageUrl: settings?.websiteSettings?.destinationImageUrl || '',
    contactImageUrl: settings?.websiteSettings?.contactImageUrl || '',
    galleryHighlightUrl: settings?.websiteSettings?.galleryHighlightUrl || '',
    faqHeroImageUrl: settings?.websiteSettings?.faqHeroImageUrl || '',
    loginHeroImageUrl: settings?.websiteSettings?.loginHeroImageUrl || '',
    registerHeroImageUrl: settings?.websiteSettings?.registerHeroImageUrl || '',
  },
  checkInTime: settings?.checkInTime || '14:00',
  checkOutTime: settings?.checkOutTime || '12:00',
  currency: 'PKR',
  cancellationPolicy:
    settings?.cancellationPolicy || 'Free cancellation up to 24 hours before arrival.',
  socialLinks: settings?.socialLinks || {},
  bookingSettings: settings?.bookingSettings || {},
  themeSettings: settings?.themeSettings || {},
  seoSettings: settings?.seoSettings || {},
});

export const formatAmenityLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
