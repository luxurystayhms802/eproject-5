import { FeedbackModel } from './feedback.model.js';
export const feedbackRepository = {
    findById: (feedbackId) => FeedbackModel.findOne({ _id: feedbackId, deletedAt: null })
        .populate('reservationId')
        .populate('guestUserId', 'fullName email role'),
    findByReservationAndGuest: (reservationId, guestUserId) => FeedbackModel.findOne({ reservationId, guestUserId, deletedAt: null }),
    list: (filter, skip, limit) => FeedbackModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reservationId')
        .populate('guestUserId', 'fullName email role')
        .lean(),
    count: (filter) => FeedbackModel.countDocuments(filter),
    create: (payload) => FeedbackModel.create(payload),
    updateById: (feedbackId, payload) => FeedbackModel.findOneAndUpdate({ _id: feedbackId, deletedAt: null }, payload, { new: true })
        .populate('reservationId')
        .populate('guestUserId', 'fullName email role'),
};
