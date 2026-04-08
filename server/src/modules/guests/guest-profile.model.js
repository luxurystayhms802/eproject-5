import { Schema, model } from 'mongoose';
import { BED_TYPES, GENDERS, ID_TYPES, SMOKING_PREFERENCES } from '../../shared/constants/enums.js';
const guestProfileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    gender: {
        type: String,
        enum: GENDERS,
        default: null,
    },
    dateOfBirth: {
        type: Date,
        default: null,
    },
    nationality: {
        type: String,
        default: '',
    },
    idType: {
        type: String,
        enum: ID_TYPES,
        default: null,
    },
    idNumber: {
        type: String,
        default: '',
    },
    addressLine1: {
        type: String,
        default: '',
    },
    addressLine2: {
        type: String,
        default: null,
    },
    city: {
        type: String,
        default: '',
    },
    state: {
        type: String,
        default: null,
    },
    country: {
        type: String,
        default: '',
    },
    postalCode: {
        type: String,
        default: null,
    },
    preferences: {
        bedType: {
            type: String,
            enum: BED_TYPES,
            default: null,
        },
        smokingPreference: {
            type: String,
            enum: SMOKING_PREFERENCES,
            default: null,
        },
        floorPreference: {
            type: String,
            default: null,
        },
        foodPreference: {
            type: String,
            default: null,
        },
    },
    emergencyContact: {
        name: { type: String, default: '' },
        relation: { type: String, default: '' },
        phone: { type: String, default: '' },
    },
    notes: {
        type: String,
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
export const GuestProfileModel = model('GuestProfile', guestProfileSchema);
