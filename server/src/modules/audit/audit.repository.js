import { AuditLogModel } from './audit-log.model.js';
export const auditRepository = {
    create: (payload) => AuditLogModel.create(payload),
    list: (filter, skip, limit) => AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'fullName email role').lean(),
    count: (filter) => AuditLogModel.countDocuments(filter),
};
