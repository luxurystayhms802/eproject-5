import { sendSuccess } from '../../shared/utils/api-response.js';
import { billingService } from './billing.service.js';
export const folioChargeController = {
    list: async (request, response) => {
        const result = await billingService.listFolioCharges(request.query, {
            id: request.authUser?.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Folio charges fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    create: async (request, response) => {
        const charge = await billingService.createFolioCharge(request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Folio charge created successfully',
            data: charge,
            statusCode: 201,
        });
    },
    update: async (request, response) => {
        const charge = await billingService.updateFolioCharge(String(request.params.chargeId), request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Folio charge updated successfully',
            data: charge,
        });
    },
    remove: async (request, response) => {
        const result = await billingService.deleteFolioCharge(String(request.params.chargeId), {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Folio charge archived successfully',
            data: result,
        });
    },
};
export const invoiceController = {
    list: async (request, response) => {
        const result = await billingService.listInvoices(request.query, {
            id: request.authUser?.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Invoices fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => {
        const invoice = await billingService.getInvoiceById(String(request.params.invoiceId), {
            id: request.authUser?.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Invoice fetched successfully',
            data: invoice,
        });
    },
    generate: async (request, response) => {
        const invoice = await billingService.generateInvoice(String(request.params.reservationId), {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Invoice generated successfully',
            data: invoice,
            statusCode: 201,
        });
    },
    finalize: async (request, response) => {
        const invoice = await billingService.finalizeInvoice(String(request.params.invoiceId), request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Invoice finalized successfully',
            data: invoice,
        });
    },
};
export const paymentController = {
    list: async (request, response) => {
        const result = await billingService.listPayments(request.query, {
            id: request.authUser?.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Payments fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => {
        const payment = await billingService.getPaymentById(String(request.params.paymentId), {
            id: request.authUser?.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Payment fetched successfully',
            data: payment,
        });
    },
    create: async (request, response) => {
        const payment = await billingService.createPayment(request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Payment recorded successfully',
            data: payment,
            statusCode: 201,
        });
    },
};
