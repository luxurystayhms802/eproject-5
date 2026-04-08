import { Schema, model } from 'mongoose';
import { MAINTENANCE_ISSUE_TYPES, MAINTENANCE_STATUSES, PRIORITIES } from '../../shared/constants/enums.js';
const maintenanceRequestSchema = new Schema({
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null, index: true },
    locationLabel: { type: String, default: null, trim: true },
    reportedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    issueType: { type: String, enum: MAINTENANCE_ISSUE_TYPES, required: true },
    description: { type: String, required: true, trim: true },
    priority: { type: String, enum: PRIORITIES, required: true, default: 'medium' },
    status: { type: String, enum: MAINTENANCE_STATUSES, required: true, default: 'open' },
    images: { type: [String], default: [] },
    reportedAt: { type: Date, required: true, default: Date.now },
    startedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNotes: { type: String, default: null },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
maintenanceRequestSchema.index({ status: 1, priority: 1, reportedAt: -1 });
export const MaintenanceRequestModel = model('MaintenanceRequest', maintenanceRequestSchema);
