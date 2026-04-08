import { FolioChargeModel } from './folio-charge.model.js';
import { InvoiceModel } from './invoice.model.js';
import { PaymentModel } from './payment.model.js';
export const billingRepository = {
    findChargeById: (chargeId) => FolioChargeModel.findOne({ _id: chargeId, deletedAt: null }).populate('reservationId').populate('createdBy', 'fullName email role'),
    listCharges: (filter, skip, limit) => FolioChargeModel.find(filter).sort({ chargeDate: -1, createdAt: -1 }).skip(skip).limit(limit).populate('reservationId').populate('createdBy', 'fullName email role').lean(),
    listAllChargesForReservation: (reservationId) => FolioChargeModel.find({ reservationId, deletedAt: null }).sort({ chargeDate: 1, createdAt: 1 }).lean(),
    countCharges: (filter) => FolioChargeModel.countDocuments(filter),
    createCharge: (payload) => FolioChargeModel.create(payload),
    updateChargeById: (chargeId, payload) => FolioChargeModel.findOneAndUpdate({ _id: chargeId, deletedAt: null }, payload, { new: true }).populate('reservationId').populate('createdBy', 'fullName email role'),
    findInvoiceById: (invoiceId) => InvoiceModel.findOne({ _id: invoiceId, deletedAt: null }).populate('reservationId').populate('guestUserId', 'fullName email phone role status'),
    findInvoiceByReservationId: (reservationId) => InvoiceModel.findOne({ reservationId, deletedAt: null }).populate('reservationId').populate('guestUserId', 'fullName email phone role status'),
    listInvoices: (filter, skip, limit) => InvoiceModel.find(filter)
        .sort({ issuedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reservationId')
        .populate('guestUserId', 'fullName email phone role status')
        .lean(),
    countInvoices: (filter) => InvoiceModel.countDocuments(filter),
    createInvoice: (payload) => InvoiceModel.create(payload),
    updateInvoiceById: (invoiceId, payload) => InvoiceModel.findOneAndUpdate({ _id: invoiceId, deletedAt: null }, payload, { new: true }).populate('reservationId').populate('guestUserId', 'fullName email phone role status'),
    findPaymentById: (paymentId) => PaymentModel.findOne({ _id: paymentId, deletedAt: null })
        .populate('invoiceId')
        .populate('reservationId')
        .populate('guestUserId', 'fullName email phone role status')
        .populate('receivedByUserId', 'fullName email role'),
    listPayments: (filter, skip, limit) => PaymentModel.find(filter)
        .sort({ paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('invoiceId')
        .populate('reservationId')
        .populate('guestUserId', 'fullName email phone role status')
        .populate('receivedByUserId', 'fullName email role')
        .lean(),
    listAllPaymentsForInvoice: (invoiceId) => PaymentModel.find({ invoiceId, deletedAt: null }).sort({ paidAt: 1, createdAt: 1 }).lean(),
    countPayments: (filter) => PaymentModel.countDocuments(filter),
    createPayment: (payload) => PaymentModel.create(payload),
};
