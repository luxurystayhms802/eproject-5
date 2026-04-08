import { Types } from 'mongoose';
import { NotificationModel } from './notification.model.js';
export const notificationRepository = {
    create: (payload) => NotificationModel.create(payload),
    findById: (notificationId) => NotificationModel.findOne({ _id: notificationId, deletedAt: null }),
    list: (filter, skip, limit) => NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'role')
        .lean(),
    count: (filter) => NotificationModel.countDocuments(filter),
    markRead: (notificationId, userId) => NotificationModel.findOneAndUpdate({ _id: notificationId, deletedAt: null }, { $addToSet: { isReadBy: new Types.ObjectId(userId) } }, { new: true }),
    markAllRead: (filter, userId) => NotificationModel.updateMany(filter, { $addToSet: { isReadBy: new Types.ObjectId(userId) } }),
};
