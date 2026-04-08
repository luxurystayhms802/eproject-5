import { ServiceRequestModel } from './service-request.model.js';
export const serviceRequestRepository = {
    findById: (requestId) => ServiceRequestModel.findOne({ _id: requestId, deletedAt: null })
        .populate('reservationId')
        .populate('guestUserId', 'fullName email role')
        .populate('assignedToUserId', 'fullName email role'),
    list: (filter, skip, limit) => ServiceRequestModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reservationId')
        .populate('guestUserId', 'fullName email role')
        .populate('assignedToUserId', 'fullName email role')
        .lean(),
    count: (filter) => ServiceRequestModel.countDocuments(filter),
    create: (payload) => ServiceRequestModel.create(payload),
    updateById: (requestId, payload) => ServiceRequestModel.findOneAndUpdate({ _id: requestId, deletedAt: null }, payload, { new: true })
        .populate('reservationId')
        .populate('guestUserId', 'fullName email role')
        .populate('assignedToUserId', 'fullName email role'),
};
