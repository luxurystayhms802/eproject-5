import { z } from 'zod';
import { BED_TYPES, GENDERS, ID_TYPES, SMOKING_PREFERENCES, USER_STATUSES } from '../../shared/constants/enums.js';
const guestProfileFields = z.object({
    gender: z.enum(GENDERS).nullable().optional(),
    dateOfBirth: z.coerce.date().nullable().optional(),
    nationality: z.string().trim().optional(),
    idType: z.enum(ID_TYPES).nullable().optional(),
    idNumber: z.string().trim().optional(),
    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().nullable().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().nullable().optional(),
    country: z.string().trim().optional(),
    postalCode: z.string().trim().nullable().optional(),
    preferences: z
        .object({
        bedType: z.enum(BED_TYPES).nullable().optional(),
        smokingPreference: z.enum(SMOKING_PREFERENCES).nullable().optional(),
        floorPreference: z.string().trim().nullable().optional(),
        foodPreference: z.string().trim().nullable().optional(),
    })
        .optional(),
    emergencyContact: z
        .object({
        name: z.string().trim().optional(),
        relation: z.string().trim().optional(),
        phone: z.string().trim().optional(),
    })
        .optional(),
    notes: z.string().trim().nullable().optional(),
});
export const guestIdParamsSchema = z.object({
    params: z.object({
        guestId: z.string().min(1),
    }),
});
export const listGuestsSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
        search: z.string().trim().optional(),
        nationality: z.string().trim().optional(),
        status: z.enum(USER_STATUSES).optional(),
    }),
});
export const createGuestSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).max(50),
        lastName: z.string().min(2).max(50),
        email: z.string().email(),
        phone: z.string().min(5),
        password: z.string().min(6).default('Password123!'),
        status: z.enum(USER_STATUSES).optional(),
        avatarUrl: z.string().url().nullable().optional(),
        profile: guestProfileFields.optional(),
    }),
});
export const updateGuestSchema = z.object({
    body: z
        .object({
        firstName: z.string().min(2).max(50).optional(),
        lastName: z.string().min(2).max(50).optional(),
        email: z.string().email().optional(),
        phone: z.union([z.string().min(5), z.literal('')]).optional(),
        password: z.union([z.string().min(6), z.literal('')]).optional(),
        status: z.enum(USER_STATUSES).optional(),
        avatarUrl: z.string().url().nullable().optional(),
        profile: guestProfileFields.optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
