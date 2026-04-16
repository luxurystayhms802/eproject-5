import { Types } from 'mongoose';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { AppError } from '../../shared/utils/app-error.js';
import { auditService } from '../audit/audit.service.js';
import { notificationRepository } from './notification.repository.js';

const PRIVILEGED_NOTIFICATION_ROLES = new Set(['admin']);

const normalizeTargetRoles = (roles = []) => [...new Set((Array.isArray(roles) ? roles : []).filter(Boolean))];

const normalizeTargetUserIds = (userIds = []) => [...new Set((Array.isArray(userIds) ? userIds : []).map((value) => String(value ?? '').trim()).filter(Boolean))];

const hasExplicitAudience = ({ targetRoles = [], targetUserIds = [] }) => targetRoles.length > 0 || targetUserIds.length > 0;

const isLegacyUntargetedNotification = (notification) => {
    const targetRoles = Array.isArray(notification.targetRoles) ? notification.targetRoles : [];
    const targetUserIds = Array.isArray(notification.targetUserIds) ? notification.targetUserIds : [];

    return targetRoles.length === 0 && targetUserIds.length === 0;
};

const matchesAudience = (notification, actor) => {
    const targetRoles = Array.isArray(notification.targetRoles) ? notification.targetRoles : [];
    const targetUserIds = Array.isArray(notification.targetUserIds)
        ? notification.targetUserIds.map((item) => (item && typeof item === 'object' && 'toString' in item ? item.toString() : String(item)))
        : [];

    if (PRIVILEGED_NOTIFICATION_ROLES.has(actor.role)) {
        return true;
    }

    if (targetRoles.includes(actor.role)) {
        return true;
    }

    if (targetUserIds.includes(actor.id)) {
        return true;
    }

    if (notification.createdBy && notification.createdBy.toString() === String(actor.id)) {
        return true;
    }

    return isLegacyUntargetedNotification(notification);
};

const serializeNotification = (notification, actorUserId) => {
    const targetRoles = Array.isArray(notification.targetRoles) ? notification.targetRoles : [];
    const targetUserIds = Array.isArray(notification.targetUserIds)
        ? notification.targetUserIds.map((item) => item && typeof item === 'object' && 'toString' in item ? item.toString() : String(item))
        : [];
        
    const isReadBy = Array.isArray(notification.isReadBy)
        ? notification.isReadBy.map((item) => (item && typeof item === 'object' && 'toString' in item ? item.toString() : String(item)))
        : [];
        
    const creatorId = notification.createdBy && typeof notification.createdBy === 'object' && notification.createdBy._id
        ? notification.createdBy._id.toString()
        : notification.createdBy
            ? notification.createdBy.toString()
            : null;
            
    const creatorRole = notification.createdBy && typeof notification.createdBy === 'object' && notification.createdBy.role
        ? notification.createdBy.role
        : null;

    const isCreator = creatorId && actorUserId && creatorId === String(actorUserId);
    return {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        targetRoles,
        targetUserIds,
        isReadBy,
        isRead: actorUserId ? (isReadBy.includes(actorUserId) || isCreator) : false,
        createdBy: creatorId,
        createdByRole: creatorRole,
        isCreator,
        link: notification.link ?? null,
        priority: notification.priority,
        createdAt: notification.createdAt ?? null,
        updatedAt: notification.updatedAt ?? null,
    };
};
const buildAudienceFilter = (actor) => {
    if (PRIVILEGED_NOTIFICATION_ROLES.has(actor.role)) {
        return {};
    }

    return {
        $or: [
            { targetRoles: actor.role },
            { targetUserIds: new Types.ObjectId(actor.id) },
            { createdBy: new Types.ObjectId(actor.id) },
        ],
    };
};
export const notificationsService = {
    serializeNotification,
    async createNotification(payload, context) {
        const normalizedTargetRoles = normalizeTargetRoles(payload.targetRoles);
        const normalizedTargetUserIds = normalizeTargetUserIds(payload.targetUserIds);

        if (!hasExplicitAudience({ targetRoles: normalizedTargetRoles, targetUserIds: normalizedTargetUserIds })) {
            throw new AppError('Choose at least one target role or direct recipient', 400);
        }

        const created = await notificationRepository.create({
            type: payload.type,
            title: payload.title,
            message: payload.message,
            targetRoles: normalizedTargetRoles,
            targetUserIds: normalizedTargetUserIds,
            link: payload.link ?? null,
            priority: payload.priority ?? 'medium',
            createdBy: context?.actorUserId ? new Types.ObjectId(context.actorUserId) : null,
        });
        await auditService.createLog({
            userId: context?.actorUserId,
            action: 'notification.create',
            entityType: 'notification',
            entityId: created._id.toString(),
            after: serializeNotification(created.toObject()),
            ip: context?.request?.ip,
            userAgent: context?.request?.headers['user-agent'] ?? null,
        });
        return serializeNotification(created.toObject());
    },
    async listNotifications(query, actor) {
        const pagination = getPagination(query);
        const filter = {
            deletedAt: null,
            ...buildAudienceFilter(actor),
        };
        if (query.type) {
            filter.type = query.type;
        }
        if (query.priority) {
            filter.priority = query.priority;
        }
        if (query.readStatus === 'read') {
            filter.isReadBy = new Types.ObjectId(actor.id);
        }
        if (query.readStatus === 'unread') {
            filter.isReadBy = { $ne: new Types.ObjectId(actor.id) };
        }
        if (query.timeframe) {
            const now = new Date();
            let start = new Date(now);
            if (query.timeframe === 'today') {
                start.setHours(0, 0, 0, 0);
            } else if (query.timeframe === 'last7days') {
                start.setDate(now.getDate() - 7);
                start.setHours(0, 0, 0, 0);
            } else if (query.timeframe === 'last30days') {
                start.setDate(now.getDate() - 30);
                start.setHours(0, 0, 0, 0);
            }
            filter.createdAt = { $gte: start };
        }
        if (query.direction === 'outbound') {
            filter.createdBy = new Types.ObjectId(actor.id);
        } else if (query.direction === 'inbound') {
            filter.createdBy = { $ne: new Types.ObjectId(actor.id) };
        }
        const [items, total] = await Promise.all([
            notificationRepository.list(filter, pagination.skip, pagination.limit),
            notificationRepository.count(filter),
        ]);
        return {
            items: items.map((item) => serializeNotification(item, actor.id)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async markRead(notificationId, actor) {
        const existing = await notificationRepository.findById(notificationId);
        if (!existing) {
            throw new AppError('Notification not found', 404);
        }
        const audienceMatch = matchesAudience(existing, actor);
        if (!audienceMatch) {
            throw new AppError('You are not allowed to access this notification', 403);
        }
        const updated = await notificationRepository.markRead(notificationId, actor.id);
        return serializeNotification(updated.toObject(), actor.id);
    },
    async markAllRead(actor) {
        const filter = {
            deletedAt: null,
            ...buildAudienceFilter(actor),
            isReadBy: { $ne: new Types.ObjectId(actor.id) },
        };
        await notificationRepository.markAllRead(filter, actor.id);
        return { success: true };
    },
};
