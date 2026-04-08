import { z } from 'zod';
import { MAINTENANCE_ISSUE_TYPES, MAINTENANCE_STATUSES, PRIORITIES } from '../../shared/constants/enums.js';
export const maintenanceRequestIdParamsSchema = z.object({
    params: z.object({
        requestId: z.string().min(1),
    }),
});
export const listMaintenanceRequestsSchema = z.object({
    query: z.object({
        status: z.union([z.enum(MAINTENANCE_STATUSES), z.string().trim()]).optional(),
        priority: z.enum(PRIORITIES).optional(),
        assignedToUserId: z.string().trim().optional(),
        roomId: z.string().trim().optional(),
        search: z.string().trim().optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
    }),
});
export const createMaintenanceRequestSchema = z.object({
    body: z.object({
        roomId: z.string().trim().nullable().optional(),
        locationLabel: z.string().trim().nullable().optional(),
        issueType: z.enum(MAINTENANCE_ISSUE_TYPES),
        description: z.string().trim().min(5).max(1000),
        priority: z.enum(PRIORITIES).optional(),
        images: z.array(z.string().trim()).optional(),
        assignedToUserId: z.string().trim().nullable().optional(),
    }),
});
export const updateMaintenanceRequestSchema = z.object({
    body: z
        .object({
        roomId: z.string().trim().nullable().optional(),
        locationLabel: z.string().trim().nullable().optional(),
        assignedToUserId: z.string().trim().nullable().optional(),
        issueType: z.enum(MAINTENANCE_ISSUE_TYPES).optional(),
        description: z.string().trim().min(5).max(1000).optional(),
        priority: z.enum(PRIORITIES).optional(),
        status: z.enum(MAINTENANCE_STATUSES).optional(),
        images: z.array(z.string().trim()).optional(),
        resolutionNotes: z.string().trim().nullable().optional(),
    })
        .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' }),
});
export const assignMaintenanceRequestSchema = z.object({
    body: z.object({
        assignedToUserId: z.string().trim().min(1),
    }),
});
export const resolveMaintenanceRequestSchema = z.object({
    body: z.object({
        resolutionNotes: z.string().trim().min(3).max(1000),
    }),
});
