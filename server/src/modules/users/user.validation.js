import { z } from 'zod';
import { USER_ROLES, USER_STATUSES } from '../../shared/constants/enums.js';
export const userIdParamsSchema = z.object({
    params: z.object({
        userId: z.string().min(1),
    }),
});
export const listUsersSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
        search: z.string().trim().optional(),
        role: z.string().trim().min(2).optional(),
        status: z.enum(USER_STATUSES).optional(),
    }),
});
export const createUserSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).max(50),
        lastName: z.string().min(2).max(50),
        email: z.string().email(),
        phone: z.string().min(10),
        password: z.string().min(8),
        role: z.string().trim().min(2),
        status: z.enum(USER_STATUSES).default('active'),
        avatarUrl: z.string().url().nullable().optional(),
    }),
});
export const updateUserSchema = z.object({
    body: z
        .object({
        firstName: z.string().min(2).max(50).optional(),
        lastName: z.string().min(2).max(50).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(10).optional(),
        password: z.string().min(8).optional(),
        role: z.string().trim().min(2).optional(),
        status: z.enum(USER_STATUSES).optional(),
        avatarUrl: z.string().url().nullable().optional(),
        emailVerified: z.boolean().optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
