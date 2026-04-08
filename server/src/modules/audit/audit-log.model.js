import { Schema, model } from 'mongoose';
const auditLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });
export const AuditLogModel = model('AuditLog', auditLogSchema);
