import { z } from 'zod';
import { SERVICE_REQUEST_STATUSES, SERVICE_REQUEST_TYPES } from '../../shared/constants/enums.js';
export const serviceRequestIdParamsSchema = z.object({
    params: z.object({
        requestId: z.string().min(1),
    }),
});
export const listServiceRequestsSchema = z.object({
    query: z.object({
        status: z.enum(SERVICE_REQUEST_STATUSES).optional(),
        requestType: z.enum(SERVICE_REQUEST_TYPES).optional(),
        reservationId: z.string().trim().optional(),
        guestUserId: z.string().trim().optional(),
        assignedToUserId: z.string().trim().optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
    }),
});
export const createServiceRequestSchema = z.object({
    body: z.object({
        reservationId: z.string().trim().min(1),
        requestType: z.enum(SERVICE_REQUEST_TYPES),
        description: z.string().trim().min(3).max(1000),
        preferredTime: z.coerce.date().nullable().optional(),
    }),
});
export const updateServiceRequestSchema = z.object({
    body: z
        .object({
        status: z.enum(SERVICE_REQUEST_STATUSES).optional(),
        description: z.string().trim().min(3).max(1000).optional(),
        preferredTime: z.coerce.date().nullable().optional(),
        assignedToUserId: z.string().trim().nullable().optional(),
    })
        .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' }),
});
