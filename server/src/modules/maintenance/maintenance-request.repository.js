import { MaintenanceRequestModel } from './maintenance-request.model.js';
export const maintenanceRequestRepository = {
    findById: (requestId) => MaintenanceRequestModel.findOne({ _id: requestId, deletedAt: null })
        .populate('roomId', 'roomNumber status housekeepingStatus floor')
        .populate('reportedByUserId', 'fullName email role')
        .populate('assignedToUserId', 'fullName email role'),
    list: (filter, skip, limit) => MaintenanceRequestModel.find(filter)
        .sort({ reportedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('roomId', 'roomNumber status housekeepingStatus floor')
        .populate('reportedByUserId', 'fullName email role')
        .populate('assignedToUserId', 'fullName email role')
        .lean(),
    count: (filter) => MaintenanceRequestModel.countDocuments(filter),
    create: (payload) => MaintenanceRequestModel.create(payload),
    updateById: (requestId, payload) => MaintenanceRequestModel.findOneAndUpdate({ _id: requestId, deletedAt: null }, payload, { new: true })
        .populate('roomId', 'roomNumber status housekeepingStatus floor')
        .populate('reportedByUserId', 'fullName email role')
        .populate('assignedToUserId', 'fullName email role'),
    countBlockingByRoomId: (roomId, excludeRequestId) => MaintenanceRequestModel.countDocuments({
        roomId,
        deletedAt: null,
        status: { $in: ['open', 'assigned', 'in_progress'] },
        ...(excludeRequestId ? { _id: { $ne: excludeRequestId } } : {}),
    }),
};
