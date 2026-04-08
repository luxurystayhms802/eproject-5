import { Schema, model } from 'mongoose';
import { BED_TYPES } from '../../shared/constants/enums.js';
const roomTypeSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    maxAdults: { type: Number, required: true, min: 1 },
    maxChildren: { type: Number, required: true, min: 0 },
    bedCount: { type: Number, required: true, min: 1 },
    bedType: { type: String, enum: BED_TYPES, required: true },
    roomSizeSqFt: { type: Number, default: null },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
export const RoomTypeModel = model('RoomType', roomTypeSchema);
