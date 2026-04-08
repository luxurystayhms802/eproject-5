import { Schema, model } from 'mongoose';
import { INVOICE_STATUSES } from '../../shared/constants/enums.js';
const invoiceSchema = new Schema({
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, unique: true, index: true },
    guestUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    balanceAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: INVOICE_STATUSES, required: true, default: 'unpaid' },
    issuedAt: { type: Date, required: true, default: Date.now },
    dueAt: { type: Date, default: null },
    notes: { type: String, default: null },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
invoiceSchema.index({ guestUserId: 1, status: 1 });
export const InvoiceModel = model('Invoice', invoiceSchema);
