import { Schema, model } from 'mongoose';
import { HOUSEKEEPING_ROOM_STATUSES, ROOM_STATUSES } from '../../shared/constants/enums.js';
const roomSchema = new Schema({
    roomNumber: { type: String, required: true, unique: true, trim: true },
    floor: { type: Number, required: true, min: 0 },
    roomTypeId: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true, index: true },
    customPrice: { type: Number, default: null },
    status: { type: String, enum: ROOM_STATUSES, required: true, default: 'available' },
    housekeepingStatus: { type: String, enum: HOUSEKEEPING_ROOM_STATUSES, required: true, default: 'clean' },
    capacityAdults: { type: Number, required: true, min: 1 },
    capacityChildren: { type: Number, required: true, min: 0 },
    notes: { type: String, default: null },
    images: { type: [String], default: [] },
    lastCleanedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
roomSchema.index({ status: 1, roomTypeId: 1 });
roomSchema.index({ floor: 1, status: 1 });
export const RoomModel = model('Room', roomSchema);
