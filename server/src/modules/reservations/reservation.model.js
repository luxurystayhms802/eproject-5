import { Schema, model } from 'mongoose';
import { BOOKING_SOURCES, RESERVATION_STATUSES } from '../../shared/constants/enums.js';
const reservationSchema = new Schema({
    reservationCode: { type: String, required: true, unique: true, index: true },
    guestUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roomTypeId: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null },
    bookingSource: { type: String, enum: BOOKING_SOURCES, required: true, default: 'online' },
    checkInDate: { type: Date, required: true, index: true },
    checkOutDate: { type: Date, required: true, index: true },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, required: true, min: 0 },
    nights: { type: Number, required: true, min: 1 },
    roomRate: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: RESERVATION_STATUSES, required: true, default: 'pending' },
    specialRequests: { type: String, default: null },
    arrivalTime: { type: String, default: null },
    guestProfileSnapshot: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        idType: { type: String, default: null },
        idNumber: { type: String, default: null },
    },
    checkInDetails: {
        idType: { type: String, default: null },
        idNumber: { type: String, default: null },
        arrivalNote: { type: String, default: null },
        keyIssueNote: { type: String, default: null },
    },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    confirmedAt: { type: Date, default: null },
    checkedInAt: { type: Date, default: null },
    checkedOutAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
    notes: { type: String, default: null },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
reservationSchema.index({ guestUserId: 1, checkInDate: 1 });
reservationSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1 });
reservationSchema.index({ status: 1, checkInDate: 1 });
reservationSchema.index({ bookingSource: 1, createdAt: 1 });
export const ReservationModel = model('Reservation', reservationSchema);
