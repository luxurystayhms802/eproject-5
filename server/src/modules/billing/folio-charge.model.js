import { Schema, model } from 'mongoose';
import { FOLIO_CHARGE_TYPES } from '../../shared/constants/enums.js';
const folioChargeSchema = new Schema({
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
    chargeType: { type: String, enum: FOLIO_CHARGE_TYPES, required: true },
    description: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    amount: { type: Number, required: true, min: 0 },
    chargeDate: { type: Date, required: true, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
folioChargeSchema.index({ reservationId: 1, chargeDate: -1 });
export const FolioChargeModel = model('FolioCharge', folioChargeSchema);
