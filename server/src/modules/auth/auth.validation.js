import { z } from 'zod';
export const registerSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).max(50),
        lastName: z.string().min(2).max(50),
        email: z.string().email(),
        phone: z.string().min(5),
        password: z.string().min(6),
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),
});
export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().optional(),
    }),
});
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8),
    }),
});
export const updateMeSchema = z.object({
    body: z
        .object({
        firstName: z.string().min(2).max(50).optional(),
        lastName: z.string().min(2).max(50).optional(),
        email: z.string().email().optional(),
        phone: z.union([z.string().min(5), z.literal('')]).optional(),
        password: z.union([z.string().min(6), z.literal('')]).optional(),
        avatarUrl: z.string().url().nullable().optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
