import { z } from 'zod';
import { NOTIFICATION_PRIORITIES, NOTIFICATION_TYPES, USER_ROLES } from '../../shared/constants/enums.js';
export const notificationIdParamsSchema = z.object({
    params: z.object({
        notificationId: z.string().min(1),
    }),
});
export const listNotificationsSchema = z.object({
    query: z.object({
        type: z.enum(NOTIFICATION_TYPES).optional(),
        priority: z.enum(NOTIFICATION_PRIORITIES).optional(),
        readStatus: z.enum(['read', 'unread']).optional(),
        timeframe: z.enum(['today', 'last7days', 'last30days']).optional(),
        direction: z.enum(['inbound', 'outbound']).optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
    }),
});
export const createNotificationSchema = z.object({
    body: z.object({
        type: z.enum(NOTIFICATION_TYPES),
        title: z.string().trim().min(3).max(120),
        message: z.string().trim().min(3).max(500),
        targetRoles: z.array(z.string().trim().min(1)).default([]),
        targetUserIds: z.array(z.string().trim().min(1)).default([]),
        link: z.string().trim().nullable().optional(),
        priority: z.enum(NOTIFICATION_PRIORITIES).optional(),
    }).superRefine((body, context) => {
        if (body.targetRoles.length === 0 && body.targetUserIds.length === 0) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['targetRoles'],
                message: 'Choose at least one target role or direct recipient',
            });
        }
    }),
});
