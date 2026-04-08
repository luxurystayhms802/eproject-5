import { UserModel } from '../users/user.model.js';
import { RoomModel } from '../rooms/room.model.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { auditService } from '../audit/audit.service.js';
import { notificationsService } from '../notifications/notification.service.js';
import { maintenanceRequestRepository } from './maintenance-request.repository.js';
const getEntityId = (value) => {
    if (!value) {
        return null;
    }
    if (typeof value === 'object' && '_id' in value) {
        const nested = value._id;
        if (nested && typeof nested === 'object' && 'toString' in nested) {
            return nested.toString();
        }
    }
    if (typeof value === 'object' && 'toString' in value) {
        return value.toString();
    }
    return String(value);
};
const serializeRequest = (requestItem) => {
    const resolvedAssigneeId = getEntityId(requestItem.assignedToUserId);
    const resolvedAssignee = requestItem.assignedToUserId ?? null;
    // Auto-correct status: if status says 'assigned' but nobody is actually assigned, fall back to 'open'
    const correctedStatus = (requestItem.status === 'assigned' && !resolvedAssigneeId) ? 'open' : requestItem.status;
    return {
        id: requestItem._id.toString(),
        roomId: getEntityId(requestItem.roomId),
        room: requestItem.roomId ?? null,
        locationLabel: requestItem.locationLabel ?? null,
        reportedByUserId: getEntityId(requestItem.reportedByUserId) ?? '',
        reportedBy: requestItem.reportedByUserId ?? null,
        assignedToUserId: resolvedAssigneeId,
        assignedTo: resolvedAssignee,
        issueType: requestItem.issueType,
        description: requestItem.description,
        priority: requestItem.priority,
        status: correctedStatus,
        images: requestItem.images ?? [],
        reportedAt: requestItem.reportedAt,
        startedAt: requestItem.startedAt ?? null,
        resolvedAt: requestItem.resolvedAt ?? null,
        resolutionNotes: requestItem.resolutionNotes ?? null,
        createdAt: requestItem.createdAt ?? null,
        updatedAt: requestItem.updatedAt ?? null,
    };
};
const syncRoomAfterMaintenance = async (roomId, excludeRequestId) => {
    const room = await RoomModel.findById(roomId);
    if (!room) {
        return;
    }
    const blockingCount = await maintenanceRequestRepository.countBlockingByRoomId(roomId, excludeRequestId);
    if (blockingCount > 0) {
        await RoomModel.findByIdAndUpdate(roomId, { status: 'maintenance' });
        return;
    }
    await RoomModel.findByIdAndUpdate(roomId, {
        status: ['clean', 'inspected'].includes(room.housekeepingStatus) ? 'available' : 'cleaning',
    });
};
export const maintenanceRequestService = {
    async listRequests(query, actor) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (query.status) {
            filter.status = query.status.includes(',') ? { $in: query.status.split(',').map((value) => value.trim()) } : query.status;
        }
        if (query.priority)
            filter.priority = query.priority;
        if (query.roomId)
            filter.roomId = query.roomId;
        if (query.assignedToUserId)
            filter.assignedToUserId = query.assignedToUserId;
        if (actor.role === 'guest') {
            filter.reportedByUserId = actor.id;
        }
        if (actor.role === 'maintenance' && !query.assignedToUserId) {
            filter.$or = [{ assignedToUserId: actor.id }, { assignedToUserId: null }];
        }
        if (query.search) {
            const searchFilters = [
                { description: { $regex: query.search, $options: 'i' } },
                { locationLabel: { $regex: query.search, $options: 'i' } },
            ];
            filter.$and = [...(Array.isArray(filter.$and) ? filter.$and : []), { $or: searchFilters }];
        }
        const [items, total] = await Promise.all([
            maintenanceRequestRepository.list(filter, pagination.skip, pagination.limit),
            maintenanceRequestRepository.count(filter),
        ]);
        return {
            items: items.map((item) => serializeRequest(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getById(requestId) {
        const requestItem = await maintenanceRequestRepository.findById(requestId);
        if (!requestItem) {
            throw new AppError('Maintenance request not found', 404);
        }
        return serializeRequest(requestItem.toObject());
    },
    async createRequest(payload, context) {
        const requestItem = await maintenanceRequestRepository.create({
            roomId: payload.roomId ?? null,
            locationLabel: payload.locationLabel ?? null,
            reportedByUserId: context.actorUserId,
            assignedToUserId: payload.assignedToUserId ?? null,
            issueType: payload.issueType,
            description: payload.description,
            priority: payload.priority ?? 'medium',
            status: payload.assignedToUserId ? 'assigned' : 'open',
            images: payload.images ?? [],
            reportedAt: new Date(),
        });
        const created = await maintenanceRequestRepository.findById(requestItem._id.toString());
        if (payload.roomId && payload.priority === 'urgent') {
            await RoomModel.findByIdAndUpdate(payload.roomId, { status: 'maintenance' });
        }
        await notificationsService.createNotification({
            type: 'maintenance',
            title: 'Maintenance issue reported',
            message: payload.roomId ? 'A room-linked maintenance request needs attention.' : 'A new maintenance request has been reported.',
            targetRoles: ['admin', 'maintenance', 'manager'],
            link: '/maintenance/requests',
            priority: payload.priority === 'urgent' ? 'high' : 'medium',
        });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'maintenance.create',
            entityType: 'maintenance_request',
            entityId: requestItem._id.toString(),
            after: serializeRequest(created.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeRequest(created.toObject());
    },
    async updateRequest(requestId, payload, context) {
        const existing = await maintenanceRequestRepository.findById(requestId);
        if (!existing) {
            throw new AppError('Maintenance request not found', 404);
        }
        const updatePayload = { ...payload };
        if (payload.status === 'in_progress' && !existing.startedAt) {
            updatePayload.startedAt = new Date();
        }
        if (payload.status === 'resolved') {
            updatePayload.resolvedAt = new Date();
        }
        const updated = await maintenanceRequestRepository.updateById(requestId, updatePayload);
        if (!updated) {
            throw new AppError('Maintenance request update failed', 500);
        }
        const roomRef = payload.roomId ??
            getEntityId(existing.roomId);
        if (roomRef) {
            if ((payload.priority ?? existing.priority) === 'urgent' && ['open', 'assigned', 'in_progress'].includes(String(payload.status ?? existing.status))) {
                await RoomModel.findByIdAndUpdate(roomRef, { status: 'maintenance' });
            }
            else if (['resolved', 'closed'].includes(String(payload.status ?? existing.status))) {
                await syncRoomAfterMaintenance(roomRef, requestId);
            }
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'maintenance.update',
            entityType: 'maintenance_request',
            entityId: requestId,
            before: serializeRequest(existing.toObject()),
            after: serializeRequest(updated.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeRequest(updated.toObject());
    },
    async assignRequest(requestId, assignedToUserId, context) {
        if (!assignedToUserId) {
            throw new AppError('A valid staff member is required for assignment', 400);
        }
        const targetUser = await UserModel.findById(assignedToUserId);
        if (!targetUser) {
            throw new AppError('The selected staff member does not exist', 404);
        }
        return this.updateRequest(requestId, {
            assignedToUserId,
            status: 'assigned',
        }, context);
    },
    async resolveRequest(requestId, resolutionNotes, context) {
        const resolved = await this.updateRequest(requestId, {
            status: 'resolved',
            resolutionNotes,
        }, context);
        await notificationsService.createNotification({
            type: 'maintenance',
            title: 'Maintenance request resolved',
            message: 'A maintenance issue has been resolved and is ready for operational review.',
            targetRoles: ['admin', 'manager', 'housekeeping'],
            link: '/maintenance/requests',
            priority: 'medium',
        });
        return resolved;
    },
    async closeRequest(requestId, context) {
        return this.updateRequest(requestId, {
            status: 'closed',
        }, context);
    },
};
