import { Schema, model } from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '../../shared/constants/enums.js';
const paymentSchema = new Schema({
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
    guestUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    referenceNumber: { type: String, default: null },
    status: { type: String, enum: PAYMENT_STATUSES, required: true, default: 'success' },
    receivedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paidAt: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: null },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
paymentSchema.index({ guestUserId: 1, status: 1 });
paymentSchema.index({ reservationId: 1, paidAt: -1 });
export const PaymentModel = model('Payment', paymentSchema);
