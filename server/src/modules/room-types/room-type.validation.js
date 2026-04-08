import { z } from 'zod';
import { BED_TYPES } from '../../shared/constants/enums.js';
const roomTypeBodyFields = z.object({
    name: z.string().min(2).max(120).optional(),
    slug: z.string().min(2).max(120).optional(),
    description: z.string().min(10).optional(),
    shortDescription: z.string().min(10).optional(),
    basePrice: z.number().min(0).optional(),
    maxAdults: z.number().min(1).optional(),
    maxChildren: z.number().min(0).optional(),
    bedCount: z.number().min(1).optional(),
    bedType: z.enum(BED_TYPES).optional(),
    roomSizeSqFt: z.number().min(0).nullable().optional(),
    amenities: z.array(z.string().min(1)).optional(),
    images: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    isActive: z.boolean().optional(),
});
export const roomTypeIdParamsSchema = z.object({
    params: z.object({
        roomTypeId: z.string().min(1),
    }),
});
export const listRoomTypesSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
        featured: z.coerce.boolean().optional(),
        isActive: z.coerce.boolean().optional(),
        search: z.string().trim().optional(),
    }),
});
export const createRoomTypeSchema = z.object({
    body: roomTypeBodyFields.extend({
        name: z.string().min(2).max(120),
        description: z.string().min(10),
        shortDescription: z.string().min(10),
        basePrice: z.number().min(0),
        maxAdults: z.number().min(1),
        maxChildren: z.number().min(0),
        bedCount: z.number().min(1),
        bedType: z.enum(BED_TYPES),
    }),
});
export const updateRoomTypeSchema = z.object({
    body: roomTypeBodyFields.refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
