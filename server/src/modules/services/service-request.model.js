import { Schema, model } from 'mongoose';
import { SERVICE_REQUEST_STATUSES, SERVICE_REQUEST_TYPES } from '../../shared/constants/enums.js';
const serviceRequestSchema = new Schema({
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
    guestUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestType: { type: String, enum: SERVICE_REQUEST_TYPES, required: true },
    description: { type: String, required: true, trim: true },
    preferredTime: { type: Date, default: null },
    status: { type: String, enum: SERVICE_REQUEST_STATUSES, required: true, default: 'pending' },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
serviceRequestSchema.index({ status: 1, requestType: 1, createdAt: -1 });
export const ServiceRequestModel = model('ServiceRequest', serviceRequestSchema);
