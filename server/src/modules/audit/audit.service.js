import { getPagination } from '../../shared/utils/pagination.js';
import { auditRepository } from './audit.repository.js';
export const auditService = {
    createLog: (payload) => auditRepository.create({
        userId: payload.userId ?? null,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        before: payload.before ?? null,
        after: payload.after ?? null,
        ip: payload.ip ?? '',
        userAgent: payload.userAgent ?? '',
    }),
    listLogs: async (query) => {
        const pagination = getPagination(query);
        const filter = {};
        if (query.action) {
            filter.action = query.action;
        }
        if (query.entityType) {
            filter.entityType = query.entityType;
        }
        if (query.userId) {
            filter.userId = query.userId;
        }
        const [items, total] = await Promise.all([
            auditRepository.list(filter, pagination.skip, pagination.limit),
            auditRepository.count(filter),
        ]);
        return {
            items,
            total,
            pagination,
        };
    },
};
