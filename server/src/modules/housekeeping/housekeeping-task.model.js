import { Schema, model } from 'mongoose';
import { HOUSEKEEPING_TASK_STATUSES, HOUSEKEEPING_TASK_TYPES, PRIORITIES } from '../../shared/constants/enums.js';
const housekeepingTaskSchema = new Schema({
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', default: null, index: true },
    taskType: { type: String, enum: HOUSEKEEPING_TASK_TYPES, required: true },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    priority: { type: String, enum: PRIORITIES, required: true, default: 'medium' },
    status: { type: String, enum: HOUSEKEEPING_TASK_STATUSES, required: true, default: 'pending' },
    scheduledFor: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: null },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
housekeepingTaskSchema.index({ status: 1, scheduledFor: 1 });
housekeepingTaskSchema.index({ assignedToUserId: 1, status: 1 });
export const HousekeepingTaskModel = model('HousekeepingTask', housekeepingTaskSchema);
