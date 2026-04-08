import { z } from 'zod';
import { FOLIO_CHARGE_TYPES, INVOICE_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../../shared/constants/enums.js';
export const folioChargeIdParamsSchema = z.object({
    params: z.object({
        chargeId: z.string().min(1),
    }),
});
export const invoiceIdParamsSchema = z.object({
    params: z.object({
        invoiceId: z.string().min(1),
    }),
});
export const paymentIdParamsSchema = z.object({
    params: z.object({
        paymentId: z.string().min(1),
    }),
});
export const reservationIdParamsSchema = z.object({
    params: z.object({
        reservationId: z.string().min(1),
    }),
});
export const listFolioChargesSchema = z.object({
    query: z.object({
        reservationId: z.string().trim().optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
    }),
});
export const createFolioChargeSchema = z.object({
    body: z.object({
        reservationId: z.string().min(1),
        chargeType: z.enum(FOLIO_CHARGE_TYPES),
        description: z.string().min(3).max(200),
        unitPrice: z.number().min(0),
        quantity: z.number().min(1),
        chargeDate: z.coerce.date().optional(),
    }),
});
export const updateFolioChargeSchema = z.object({
    body: z
        .object({
        chargeType: z.enum(FOLIO_CHARGE_TYPES).optional(),
        description: z.string().min(3).max(200).optional(),
        unitPrice: z.number().min(0).optional(),
        quantity: z.number().min(1).optional(),
        chargeDate: z.coerce.date().optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
export const listInvoicesSchema = z.object({
    query: z.object({
        guestUserId: z.string().trim().optional(),
        reservationId: z.string().trim().optional(),
        status: z.enum(INVOICE_STATUSES).optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
    }),
});
export const finalizeInvoiceSchema = z.object({
    body: z.object({
        notes: z.string().trim().nullable().optional(),
        dueAt: z.coerce.date().nullable().optional(),
    }),
});
export const listPaymentsSchema = z.object({
    query: z.object({
        guestUserId: z.string().trim().optional(),
        reservationId: z.string().trim().optional(),
        invoiceId: z.string().trim().optional(),
        method: z.enum(PAYMENT_METHODS).optional(),
        status: z.enum(PAYMENT_STATUSES).optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
    }),
});
export const createPaymentSchema = z.object({
    body: z.object({
        invoiceId: z.string().min(1),
        amount: z.number().min(0.01),
        method: z.enum(PAYMENT_METHODS),
        referenceNumber: z.string().trim().nullable().optional(),
        status: z.enum(PAYMENT_STATUSES).default('success'),
        paidAt: z.coerce.date().optional(),
        notes: z.string().trim().nullable().optional(),
    }),
});
