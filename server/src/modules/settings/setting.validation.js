import { z } from 'zod';

const optionalUrl = z.union([z.string().url(), z.literal('')]).optional().nullable();
const optionalEmail = z.union([z.string().email(), z.literal('')]).optional();

export const updateSettingsSchema = z.object({
    body: z.object({
        hotelName: z.string().min(2).optional(),
        brandName: z.string().min(2).optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.union([z.string().min(7), z.literal('')]).optional(),
        address: z.string().min(5).optional(),
        contactChannels: z.object({
            supportEmail: optionalEmail,
            reservationsEmail: optionalEmail,
            reservationsPhone: z.union([z.string().min(7), z.literal('')]).optional(),
            whatsappPhone: z.union([z.string().min(7), z.literal('')]).optional(),
        }).optional(),
        currency: z.string().min(2).optional(),
        timezone: z.string().min(2).optional(),
        checkInTime: z.string().min(1).optional(),
        checkOutTime: z.string().min(1).optional(),
        cancellationPolicy: z.string().min(10).optional(),
        invoiceTerms: z.string().min(10).optional(),
        logoUrl: optionalUrl,
        faviconUrl: optionalUrl,
        scrollToTopUrl: optionalUrl,
        websiteSettings: z.object({
            heroTitle: z.string().min(3).optional(),
            heroSubtitle: z.string().min(10).optional(),
            footerDescription: z.string().min(10).optional(),
            mapEmbedUrl: optionalUrl,
            heroGalleryUrls: z.array(z.string().url()).optional(),
            aboutHeroImageUrl: optionalUrl,
            storyImageUrl: optionalUrl,
            diningImageUrl: optionalUrl,
            wellnessImageUrl: optionalUrl,
            eventsImageUrl: optionalUrl,
            destinationImageUrl: optionalUrl,
            contactImageUrl: optionalUrl,
            galleryHighlightUrl: optionalUrl,
            faqHeroImageUrl: optionalUrl,
            loginHeroImageUrl: optionalUrl,
            registerHeroImageUrl: optionalUrl,
        }).optional(),
        seoSettings: z.object({
            metaTitle: z.string().min(10).optional(),
            metaDescription: z.string().min(20).optional(),
            metaKeywords: z.string().min(3).optional(),
        }).optional(),
        socialLinks: z.object({
            facebook: optionalUrl,
            instagram: optionalUrl,
            linkedin: optionalUrl,
            x: optionalUrl,
            youtube: optionalUrl,
        }).optional(),
        bookingSettings: z.object({
            onlineBookingEnabled: z.boolean().optional(),
            allowGuestRegistration: z.boolean().optional(),
            showPublicPricing: z.boolean().optional(),
            requireApprovalForOnlineBookings: z.boolean().optional(),
        }).optional(),
        notificationSettings: z.object({
            guestBookingAlertsEnabled: z.boolean().optional(),
            adminBroadcastsEnabled: z.boolean().optional(),
            housekeepingCheckoutAlertsEnabled: z.boolean().optional(),
            maintenanceEscalationAlertsEnabled: z.boolean().optional(),
        }).optional(),
        taxRules: z
            .array(z.object({
            name: z.string().min(2),
            percentage: z.number().min(0),
            appliesTo: z.string().min(2),
        }))
            .optional(),
        themeSettings: z
            .object({
            primaryColor: z.string().min(3).optional(),
            accentColor: z.string().min(3).optional(),
            darkModeEnabled: z.boolean().optional(),
        })
            .optional(),
        aboutPageSettings: z
            .object({
            diningExperience: z.object({
                title: z.string().optional(),
                description: z.string().optional(),
                imageUrl: optionalUrl,
            }).optional(),
            wellnessExperience: z.object({
                title: z.string().optional(),
                description: z.string().optional(),
                imageUrl: optionalUrl,
            }).optional(),
            eventsExperience: z.object({
                title: z.string().optional(),
                description: z.string().optional(),
                imageUrl: optionalUrl,
            }).optional(),
        }).optional(),
        homePageSettings: z
            .object({
            aboutPrimaryImageUrl: optionalUrl,
            aboutSecondaryImageUrl: optionalUrl,
        })
            .optional(),
        amenitiesPageSettings: z
            .object({
            primaryImageUrl: optionalUrl,
            secondaryImageUrl: optionalUrl,
            highlight1: z.object({
                title: z.string().optional(),
                description: z.string().optional(),
            }).optional(),
            highlight2: z.object({
                title: z.string().optional(),
                description: z.string().optional(),
            }).optional(),
            highlight3: z.object({
                title: z.string().optional(),
                description: z.string().optional(),
            }).optional(),
        })
            .optional(),
    }),
});
