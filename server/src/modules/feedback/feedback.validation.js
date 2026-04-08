import { z } from 'zod';
export const feedbackIdParamsSchema = z.object({
    params: z.object({
        feedbackId: z.string().min(1),
    }),
});
export const listFeedbackSchema = z.object({
    query: z.object({
        reservationId: z.string().trim().optional(),
        guestUserId: z.string().trim().optional(),
        isPublished: z.coerce.boolean().optional(),
        rating: z.coerce.number().min(1).max(5).optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
    }),
});
export const listPublishedFeedbackSchema = z.object({
    query: z.object({
        rating: z.coerce.number().min(1).max(5).optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(12).optional(),
    }),
});
export const createFeedbackSchema = z.object({
    body: z.object({
        reservationId: z.string().trim().min(1),
        rating: z.coerce.number().min(1).max(5),
        title: z.string().trim().min(3).max(120),
        comment: z.string().trim().min(5).max(1500),
        categories: z.object({
            room: z.coerce.number().min(1).max(5),
            cleanliness: z.coerce.number().min(1).max(5),
            staff: z.coerce.number().min(1).max(5),
            food: z.coerce.number().min(1).max(5),
            overall: z.coerce.number().min(1).max(5),
        }),
    }),
});
export const publishFeedbackSchema = z.object({
    body: z.object({
        isPublished: z.boolean().optional(),
    }),
});
