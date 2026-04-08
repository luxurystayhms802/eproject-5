import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
const sessionSchema = new Schema({
    _id: {
        type: String,
        default: () => randomUUID(),
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
    deviceInfo: {
        type: String,
        default: null,
    },
    ip: {
        type: String,
        default: null,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
export const SessionModel = model('Session', sessionSchema);
