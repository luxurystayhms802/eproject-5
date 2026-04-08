import { ReservationModel } from '../reservations/reservation.model.js';
import { SettingModel } from '../settings/setting.model.js';
import { auditService } from '../audit/audit.service.js';
import { notificationsService } from '../notifications/notification.service.js';
import { AppError } from '../../shared/utils/app-error.js';
import { getEffectivePaidAmount, generateInvoiceNumber, getInvoiceStatusFromAmounts } from '../../shared/utils/billing.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { billingRepository } from './billing.repository.js';
const getEntityId = (value) => {
    if (value && typeof value === 'object' && '_id' in value) {
        const nested = value._id;
        if (nested && typeof nested === 'object' && 'toString' in nested) {
            return nested.toString();
        }
    }
    if (value && typeof value === 'object' && 'toString' in value) {
        return value.toString();
    }
    return String(value ?? '');
};
const serializeFolioCharge = (charge) => ({
    id: charge._id.toString(),
    reservationId: getEntityId(charge.reservationId),
    chargeType: charge.chargeType,
    description: charge.description,
    unitPrice: charge.unitPrice,
    quantity: charge.quantity,
    amount: charge.amount,
    chargeDate: charge.chargeDate,
    createdBy: charge.createdBy,
    createdAt: charge.createdAt ?? null,
    updatedAt: charge.updatedAt ?? null,
});
const serializeInvoice = (invoice) => ({
    id: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    reservationId: getEntityId(invoice.reservationId),
    reservation: invoice.reservationId,
    guestUserId: getEntityId(invoice.guestUserId),
    guest: invoice.guestUserId,
    subtotal: invoice.subtotal,
    discountAmount: invoice.discountAmount,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    balanceAmount: invoice.balanceAmount,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt ?? null,
    notes: invoice.notes ?? null,
    createdAt: invoice.createdAt ?? null,
    updatedAt: invoice.updatedAt ?? null,
});
const serializePayment = (payment) => ({
    id: payment._id.toString(),
    invoiceId: getEntityId(payment.invoiceId),
    invoice: payment.invoiceId,
    reservationId: getEntityId(payment.reservationId),
    reservation: payment.reservationId,
    guestUserId: getEntityId(payment.guestUserId),
    guest: payment.guestUserId,
    amount: payment.amount,
    method: payment.method,
    referenceNumber: payment.referenceNumber ?? null,
    status: payment.status,
    receivedByUserId: getEntityId(payment.receivedByUserId),
    receivedBy: payment.receivedByUserId,
    paidAt: payment.paidAt,
    notes: payment.notes ?? null,
    createdAt: payment.createdAt ?? null,
    updatedAt: payment.updatedAt ?? null,
});
const ensureReservationAccess = async (reservationId, actor) => {
    const reservation = await ReservationModel.findOne({ _id: reservationId, deletedAt: null });
    if (!reservation) {
        throw new AppError('Reservation not found', 404);
    }
    if (actor.role === 'guest' && reservation.guestUserId.toString() !== actor.id) {
        throw new AppError('You can only access your own reservation billing records', 403);
    }
    return reservation;
};
const calculateInvoiceDraft = async (reservationId) => {
    const reservation = await ReservationModel.findOne({ _id: reservationId, deletedAt: null }).populate('guestUserId', 'fullName email phone role status');
    if (!reservation) {
        throw new AppError('Reservation not found', 404);
    }
    const [charges, settings, existingInvoice] = await Promise.all([
        billingRepository.listAllChargesForReservation(reservationId),
        SettingModel.findOne().sort({ createdAt: -1 }).lean(),
        billingRepository.findInvoiceByReservationId(reservationId),
    ]);
    const chargesSubtotal = charges.reduce((sum, charge) => sum + Number(charge.amount), 0);
    const subtotal = Number((Number(reservation.subtotal) + chargesSubtotal).toFixed(2));
    const taxPercentage = (settings?.taxRules ?? []).reduce((sum, taxRule) => sum + Number(taxRule.percentage ?? 0), 0);
    const taxAmount = Number(((subtotal * taxPercentage) / 100).toFixed(2));
    const discountAmount = Number(reservation.discountAmount ?? 0);
    const totalAmount = Number((subtotal - discountAmount + taxAmount).toFixed(2));
    const payments = existingInvoice ? await billingRepository.listAllPaymentsForInvoice(existingInvoice._id.toString()) : [];
    const paidAmount = Number(payments
        .reduce((sum, payment) => sum + getEffectivePaidAmount(Number(payment.amount), payment.status), 0)
        .toFixed(2));
    const balanceAmount = Number(Math.max(0, totalAmount - paidAmount).toFixed(2));
    const status = getInvoiceStatusFromAmounts(balanceAmount, paidAmount, totalAmount);
    return {
        reservation,
        charges,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paidAmount,
        balanceAmount,
        status,
        existingInvoice,
    };
};
const upsertInvoiceFromDraft = async (reservationId) => {
    const invoiceDraft = await calculateInvoiceDraft(reservationId);
    let invoice = invoiceDraft.existingInvoice;
    if (invoice) {
        invoice = await billingRepository.updateInvoiceById(invoice._id.toString(), {
            subtotal: invoiceDraft.subtotal,
            discountAmount: invoiceDraft.discountAmount,
            taxAmount: invoiceDraft.taxAmount,
            totalAmount: invoiceDraft.totalAmount,
            paidAmount: invoiceDraft.paidAmount,
            balanceAmount: invoiceDraft.balanceAmount,
            status: invoiceDraft.status,
        });
    }
    else {
        const createdInvoice = await billingRepository.createInvoice({
            invoiceNumber: generateInvoiceNumber(),
            reservationId,
            guestUserId: invoiceDraft.reservation.guestUserId,
            subtotal: invoiceDraft.subtotal,
            discountAmount: invoiceDraft.discountAmount,
            taxAmount: invoiceDraft.taxAmount,
            totalAmount: invoiceDraft.totalAmount,
            paidAmount: invoiceDraft.paidAmount,
            balanceAmount: invoiceDraft.balanceAmount,
            status: invoiceDraft.status,
            issuedAt: new Date(),
        });
        invoice = await billingRepository.findInvoiceById(createdInvoice._id.toString());
    }
    return {
        invoiceDraft,
        invoice,
    };
};
export const billingService = {
    serializeInvoice,
    serializePayment,
    async listFolioCharges(query, actor) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (query.reservationId) {
            await ensureReservationAccess(query.reservationId, actor);
            filter.reservationId = query.reservationId;
        }
        const [items, total] = await Promise.all([
            billingRepository.listCharges(filter, pagination.skip, pagination.limit),
            billingRepository.countCharges(filter),
        ]);
        return {
            items: items.map((item) => serializeFolioCharge(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async createFolioCharge(payload, context) {
        const reservation = await ReservationModel.findOne({ _id: payload.reservationId, deletedAt: null });
        if (!reservation) {
            throw new AppError('Reservation not found', 404);
        }
        if (!['confirmed', 'checked_in'].includes(reservation.status)) {
            throw new AppError('Charges can only be added to confirmed or checked-in reservations', 409);
        }
        const amount = Number((payload.unitPrice * payload.quantity).toFixed(2));
        const charge = await billingRepository.createCharge({
            reservationId: payload.reservationId,
            chargeType: payload.chargeType,
            description: payload.description,
            unitPrice: payload.unitPrice,
            quantity: payload.quantity,
            amount,
            chargeDate: payload.chargeDate ?? new Date(),
            createdBy: context.actorUserId,
        });
        const createdCharge = await billingRepository.findChargeById(charge._id.toString());
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'folioCharge.create',
            entityType: 'folio_charge',
            entityId: charge._id.toString(),
            after: serializeFolioCharge(createdCharge.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await upsertInvoiceFromDraft(payload.reservationId);
        return serializeFolioCharge(createdCharge.toObject());
    },
    async updateFolioCharge(chargeId, payload, context) {
        const existingCharge = await billingRepository.findChargeById(chargeId);
        if (!existingCharge) {
            throw new AppError('Folio charge not found', 404);
        }
        const nextUnitPrice = payload.unitPrice ?? Number(existingCharge.unitPrice);
        const nextQuantity = payload.quantity ?? Number(existingCharge.quantity);
        const updatedCharge = await billingRepository.updateChargeById(chargeId, {
            ...payload,
            amount: Number((nextUnitPrice * nextQuantity).toFixed(2)),
        });
        if (!updatedCharge) {
            throw new AppError('Folio charge update failed', 500);
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'folioCharge.update',
            entityType: 'folio_charge',
            entityId: chargeId,
            before: serializeFolioCharge(existingCharge.toObject()),
            after: serializeFolioCharge(updatedCharge.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await upsertInvoiceFromDraft(getEntityId(updatedCharge.reservationId));
        return serializeFolioCharge(updatedCharge.toObject());
    },
    async deleteFolioCharge(chargeId, context) {
        const existingCharge = await billingRepository.findChargeById(chargeId);
        if (!existingCharge) {
            throw new AppError('Folio charge not found', 404);
        }
        const deletedCharge = await billingRepository.updateChargeById(chargeId, { deletedAt: new Date() });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'folioCharge.delete',
            entityType: 'folio_charge',
            entityId: chargeId,
            before: serializeFolioCharge(existingCharge.toObject()),
            after: serializeFolioCharge(deletedCharge.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await upsertInvoiceFromDraft(getEntityId(existingCharge.reservationId));
        return { id: chargeId };
    },
    async listInvoices(query, actor) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (actor.role === 'guest') {
            filter.guestUserId = actor.id;
        }
        else if (query.guestUserId) {
            filter.guestUserId = query.guestUserId;
        }
        if (query.reservationId) {
            filter.reservationId = query.reservationId;
        }
        if (query.status) {
            filter.status = query.status;
        }
        const [items, total] = await Promise.all([
            billingRepository.listInvoices(filter, pagination.skip, pagination.limit),
            billingRepository.countInvoices(filter),
        ]);
        return {
            items: items.map((item) => serializeInvoice(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getInvoiceById(invoiceId, actor) {
        const invoice = await billingRepository.findInvoiceById(invoiceId);
        if (!invoice) {
            throw new AppError('Invoice not found', 404);
        }
        if (actor.role === 'guest' && getEntityId(invoice.guestUserId) !== actor.id) {
            throw new AppError('You can only access your own invoices', 403);
        }
        return serializeInvoice(invoice.toObject());
    },
    async generateInvoice(reservationId, context) {
        const { invoice } = await upsertInvoiceFromDraft(reservationId);
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'invoice.generate',
            entityType: 'invoice',
            entityId: invoice._id.toString(),
            after: serializeInvoice(invoice.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await notificationsService.createNotification({
            type: 'payment',
            title: 'Invoice generated',
            message: 'Billing totals were generated or refreshed for a reservation.',
            targetRoles: ['admin', 'receptionist', 'manager'],
            targetUserIds: [getEntityId(invoice.guestUserId)],
            link: '/reception/billing',
            priority: 'low',
        });
        return serializeInvoice(invoice.toObject());
    },
    async finalizeInvoice(invoiceId, payload, context) {
        const existingInvoice = await billingRepository.findInvoiceById(invoiceId);
        if (!existingInvoice) {
            throw new AppError('Invoice not found', 404);
        }
        const refreshedInvoice = await this.generateInvoice(getEntityId(existingInvoice.reservationId), context);
        const updatedInvoice = await billingRepository.updateInvoiceById(invoiceId, {
            status: Number(refreshedInvoice.balanceAmount) <= 0 ? 'paid' : Number(refreshedInvoice.paidAmount) > 0 ? 'partially_paid' : 'unpaid',
            notes: payload.notes ?? existingInvoice.notes ?? null,
            dueAt: payload.dueAt ?? existingInvoice.dueAt ?? null,
        });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'invoice.finalize',
            entityType: 'invoice',
            entityId: invoiceId,
            before: serializeInvoice(existingInvoice.toObject()),
            after: serializeInvoice(updatedInvoice.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeInvoice(updatedInvoice.toObject());
    },
    async listPayments(query, actor) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (actor.role === 'guest') {
            filter.guestUserId = actor.id;
        }
        else if (query.guestUserId) {
            filter.guestUserId = query.guestUserId;
        }
        if (query.reservationId)
            filter.reservationId = query.reservationId;
        if (query.invoiceId)
            filter.invoiceId = query.invoiceId;
        if (query.method)
            filter.method = query.method;
        if (query.status)
            filter.status = query.status;
        const [items, total] = await Promise.all([
            billingRepository.listPayments(filter, pagination.skip, pagination.limit),
            billingRepository.countPayments(filter),
        ]);
        return {
            items: items.map((item) => serializePayment(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getPaymentById(paymentId, actor) {
        const payment = await billingRepository.findPaymentById(paymentId);
        if (!payment) {
            throw new AppError('Payment not found', 404);
        }
        if (actor.role === 'guest' && getEntityId(payment.guestUserId) !== actor.id) {
            throw new AppError('You can only access your own payment records', 403);
        }
        return serializePayment(payment.toObject());
    },
    async createPayment(payload, context) {
        const invoice = await billingRepository.findInvoiceById(payload.invoiceId);
        if (!invoice) {
            throw new AppError('Invoice not found', 404);
        }
        const refreshedInvoice = await this.generateInvoice(getEntityId(invoice.reservationId), context);
        if (payload.status === 'success' && payload.amount > Number(refreshedInvoice.balanceAmount)) {
            throw new AppError('Payment amount cannot exceed the remaining balance', 409);
        }
        const payment = await billingRepository.createPayment({
            invoiceId: payload.invoiceId,
            reservationId: getEntityId(invoice.reservationId),
            guestUserId: getEntityId(invoice.guestUserId),
            amount: payload.amount,
            method: payload.method,
            referenceNumber: payload.referenceNumber ?? null,
            status: payload.status,
            receivedByUserId: context.actorUserId,
            paidAt: payload.paidAt ?? new Date(),
            notes: payload.notes ?? null,
        });
        const createdPayment = await billingRepository.findPaymentById(payment._id.toString());
        await this.generateInvoice(getEntityId(invoice.reservationId), context);
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'payment.create',
            entityType: 'payment',
            entityId: payment._id.toString(),
            after: serializePayment(createdPayment.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        if (payload.status === 'success' || payload.status === 'pending') {
            await notificationsService.createNotification({
                type: 'payment',
                title: payload.status === 'success' ? 'Payment recorded' : 'Payment submitted',
                message: payload.status === 'success'
                    ? 'A payment has been captured and invoice balances were updated.'
                    : 'A payment entry was added and awaits confirmation.',
                targetRoles: ['admin', 'receptionist', 'manager'],
                targetUserIds: [getEntityId(createdPayment.guestUserId)],
                link: '/reception/billing',
                priority: 'medium',
            });
        }
        return serializePayment(createdPayment.toObject());
    },
};
