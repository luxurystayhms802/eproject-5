import { Schema, model } from 'mongoose';
import { NOTIFICATION_PRIORITIES, NOTIFICATION_TYPES, USER_ROLES } from '../../shared/constants/enums.js';
const notificationSchema = new Schema({
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    targetRoles: { type: [String], default: [] },
    targetUserIds: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    isReadBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    link: { type: String, default: null },
    priority: { type: String, enum: NOTIFICATION_PRIORITIES, required: true, default: 'medium' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ targetRoles: 1, createdAt: -1 });
notificationSchema.index({ targetUserIds: 1, createdAt: -1 });
export const NotificationModel = model('Notification', notificationSchema);
