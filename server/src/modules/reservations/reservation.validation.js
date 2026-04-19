import { z } from 'zod';
import { BOOKING_SOURCES, RESERVATION_STATUSES } from '../../shared/constants/enums.js';
const reservationBodyFields = z.object({
    guestUserId: z.string().min(1).optional(),
    roomTypeId: z.string().min(1).optional(),
    roomId: z.string().min(1).nullable().optional(),
    bookingSource: z.enum(BOOKING_SOURCES).optional(),
    checkInDate: z.coerce.date().optional(),
    checkOutDate: z.coerce.date().optional(),
    adults: z.number().min(1).optional(),
    children: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    specialRequests: z.string().trim().nullable().optional(),
    arrivalTime: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
    status: z.enum(RESERVATION_STATUSES).optional(),
    advancePaymentAmount: z.number().min(0).optional(),
    advancePaymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'online']).optional(),
});
export const reservationIdParamsSchema = z.object({
    params: z.object({
        reservationId: z.string().min(1),
    }),
});
export const listReservationsSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
        status: z.enum(RESERVATION_STATUSES).optional(),
        bookingSource: z.enum(BOOKING_SOURCES).optional(),
        checkInFrom: z.coerce.date().optional(),
        checkInTo: z.coerce.date().optional(),
        guestUserId: z.string().trim().optional(),
        roomTypeId: z.string().trim().optional(),
        roomId: z.string().trim().optional(),
        search: z.string().trim().optional(),
    }),
});
export const createReservationSchema = z.object({
    body: reservationBodyFields.extend({
        roomTypeId: z.string().min(1),
        checkInDate: z.coerce.date(),
        checkOutDate: z.coerce.date(),
        adults: z.number().min(1),
        children: z.number().min(0),
    }),
});
export const updateReservationSchema = z.object({
    body: reservationBodyFields.refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
export const assignRoomSchema = z.object({
    body: z.object({
        roomId: z.string().min(1),
    }),
});
export const cancelReservationSchema = z.object({
    body: z.object({
        cancellationReason: z.string().trim().min(3).optional(),
    }),
});
export const checkInReservationSchema = z.object({
    body: z.object({
        roomId: z.string().min(1).optional(),
        idType: z.string().trim().min(2),
        idNumber: z.string().trim().min(3),
        arrivalNote: z.string().trim().nullable().optional(),
        keyIssueNote: z.string().trim().nullable().optional(),
    }),
});
export const checkOutReservationSchema = z.object({
    body: z.object({
        notes: z.string().trim().nullable().optional(),
        payment: z
            .object({
            amount: z.number().min(0.01),
            method: z.enum(['cash', 'card', 'bank_transfer', 'online']),
            referenceNumber: z.string().trim().nullable().optional(),
            status: z.enum(['pending', 'success', 'failed', 'refunded']).default('success'),
            notes: z.string().trim().nullable().optional(),
        })
            .optional(),
    }),
});
export const amendStaySchema = z.object({
    body: z.object({
        checkOutDate: z.coerce.date(),
        notes: z.string().trim().nullable().optional(),
    }),
});
