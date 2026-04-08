import { z } from 'zod';
import { HOUSEKEEPING_ROOM_STATUSES, ROOM_STATUSES } from '../../shared/constants/enums.js';
const roomBodyFields = z.object({
    roomNumber: z.string().min(1).max(30).optional(),
    floor: z.number().min(0).optional(),
    roomTypeId: z.string().min(1).optional(),
    customPrice: z.number().min(0).nullable().optional(),
    status: z.enum(ROOM_STATUSES).optional(),
    housekeepingStatus: z.enum(HOUSEKEEPING_ROOM_STATUSES).optional(),
    capacityAdults: z.number().min(1).optional(),
    capacityChildren: z.number().min(0).optional(),
    notes: z.string().trim().nullable().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});
export const roomIdParamsSchema = z.object({
    params: z.object({
        roomId: z.string().min(1),
    }),
});
export const listRoomsSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
        roomTypeId: z.string().trim().optional(),
        status: z.enum(ROOM_STATUSES).optional(),
        housekeepingStatus: z.enum(HOUSEKEEPING_ROOM_STATUSES).optional(),
        floor: z.coerce.number().min(0).optional(),
        isActive: z.coerce.boolean().optional(),
        search: z.string().trim().optional(),
    }),
});
export const createRoomSchema = z.object({
    body: roomBodyFields.extend({
        roomNumber: z.string().min(1).max(30),
        floor: z.number().min(0),
        roomTypeId: z.string().min(1),
        capacityAdults: z.number().min(1),
        capacityChildren: z.number().min(0),
    }),
});
export const updateRoomSchema = z.object({
    body: roomBodyFields.refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
export const updateRoomStatusSchema = z.object({
    body: z.object({
        status: z.enum(ROOM_STATUSES),
        housekeepingStatus: z.enum(HOUSEKEEPING_ROOM_STATUSES).optional(),
    }),
});
export const availabilitySearchSchema = z.object({
    query: z.object({
        checkInDate: z.coerce.date(),
        checkOutDate: z.coerce.date(),
        adults: z.coerce.number().min(1),
        children: z.coerce.number().min(0),
        roomTypeId: z.string().trim().optional(),
        excludeReservationId: z.string().trim().optional(),
    }),
});
