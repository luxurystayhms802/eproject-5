import { HousekeepingTaskModel } from './housekeeping-task.model.js';
export const housekeepingRepository = {
    createTask: (payload) => HousekeepingTaskModel.create(payload),
    listTasks: (filter, skip, limit) => HousekeepingTaskModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('roomId')
        .populate('reservationId')
        .populate('assignedToUserId', 'fullName email role')
        .lean(),
    countTasks: (filter) => HousekeepingTaskModel.countDocuments(filter),
    findTaskById: (taskId) => HousekeepingTaskModel.findOne({ _id: taskId, deletedAt: null })
        .populate('roomId')
        .populate('reservationId')
        .populate('assignedToUserId', 'fullName email role'),
    updateTaskById: (taskId, payload) => HousekeepingTaskModel.findOneAndUpdate({ _id: taskId, deletedAt: null }, payload, { new: true })
        .populate('roomId')
        .populate('reservationId')
        .populate('assignedToUserId', 'fullName email role'),
    listAllTasks: (filter) => HousekeepingTaskModel.find(filter)
        .sort({ createdAt: -1 })
        .populate('roomId')
        .populate('reservationId')
        .populate('assignedToUserId', 'fullName email role')
        .lean(),
};
