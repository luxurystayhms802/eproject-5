import { ReservationModel } from '../reservations/reservation.model.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { auditService } from '../audit/audit.service.js';
import { notificationsService } from '../notifications/notification.service.js';
import { serviceRequestRepository } from './service-request.repository.js';
const getEntityId = (value) => {
    if (value && typeof value === 'object' && '_id' in value) {
        const nested = value._id;
        if (nested && typeof nested === 'object' && 'toString' in nested) {
            return nested.toString();
        }
    }
    if (value && typeof value === 'object' && 'toString' in value) {
        return value.toString();
    }
    return String(value ?? '');
};
const serializeRequest = (requestItem) => ({
    id: requestItem._id.toString(),
    reservationId: getEntityId(requestItem.reservationId),
    reservation: requestItem.reservationId
        ? {
            ...requestItem.reservationId,
            room: requestItem.reservationId?.roomId ?? null,
            roomId: getEntityId(requestItem.reservationId?.roomId),
          }
        : null,
    guestUserId: getEntityId(requestItem.guestUserId),
    guest: requestItem.guestUserId ?? null,
    requestType: requestItem.requestType,
    description: requestItem.description,
    preferredTime: requestItem.preferredTime ?? null,
    status: requestItem.status,
    assignedToUserId: requestItem.assignedToUserId ? getEntityId(requestItem.assignedToUserId) : null,
    assignedTo: requestItem.assignedToUserId ?? null,
    completedAt: requestItem.completedAt ?? null,
    createdAt: requestItem.createdAt ?? null,
    updatedAt: requestItem.updatedAt ?? null,
});
const ensureGuestReservationAccess = async (reservationId, actorUserId) => {
    const reservation = await ReservationModel.findOne({ _id: reservationId, deletedAt: null });
    if (!reservation) {
        throw new AppError('Reservation not found', 404);
    }
    if (reservation.guestUserId.toString() !== actorUserId) {
        throw new AppError('You can only manage service requests for your own reservations', 403);
    }
    return reservation;
};
export const serviceRequestService = {
    async listRequests(query, actor) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (actor.role === 'guest') {
            filter.guestUserId = actor.id;
        }
        else if (query.guestUserId) {
            filter.guestUserId = query.guestUserId;
        }
        if (query.status)
            filter.status = query.status;
        if (query.requestType)
            filter.requestType = query.requestType;
        if (query.reservationId)
            filter.reservationId = query.reservationId;
        if (query.assignedToUserId)
            filter.assignedToUserId = query.assignedToUserId;
        const [items, total] = await Promise.all([
            serviceRequestRepository.list(filter, pagination.skip, pagination.limit),
            serviceRequestRepository.count(filter),
        ]);
        return {
            items: items.map((item) => serializeRequest(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getById(requestId, actor) {
        const requestItem = await serviceRequestRepository.findById(requestId);
        if (!requestItem) {
            throw new AppError('Service request not found', 404);
        }
        if (actor.role === 'guest' && getEntityId(requestItem.guestUserId) !== actor.id) {
            throw new AppError('You can only access your own service requests', 403);
        }
        return serializeRequest(requestItem.toObject());
    },
    async createRequest(payload, context) {
        const reservation = context.actorRole === 'guest'
            ? await ensureGuestReservationAccess(payload.reservationId, context.actorUserId)
            : await ReservationModel.findOne({ _id: payload.reservationId, deletedAt: null });
        if (!reservation) {
            throw new AppError('Reservation not found', 404);
        }
        if (!['confirmed', 'checked_in'].includes(reservation.status)) {
            throw new AppError('Service requests are only available for confirmed or active stays', 409);
        }
        const created = await serviceRequestRepository.create({
            reservationId: reservation._id,
            guestUserId: reservation.guestUserId,
            requestType: payload.requestType,
            description: payload.description,
            preferredTime: payload.preferredTime ?? null,
            status: 'pending',
        });
        const createdRequest = await serviceRequestRepository.findById(created._id.toString());
        const targetRoles = ['admin', 'receptionist', 'manager'];
        if (payload.requestType === 'housekeeping') {
            targetRoles.push('housekeeping');
        }

        await notificationsService.createNotification({
            type: 'service_request',
            title: 'New guest service request',
            message: 'A guest has submitted a new service request that needs staff attention.',
            targetRoles,
            link: '/reception/dashboard',
            priority: 'medium',
        });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'serviceRequest.create',
            entityType: 'service_request',
            entityId: created._id.toString(),
            after: serializeRequest(createdRequest.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeRequest(createdRequest.toObject());
    },
    async updateRequest(requestId, payload, context) {
        const existing = await serviceRequestRepository.findById(requestId);
        if (!existing) {
            throw new AppError('Service request not found', 404);
        }
        if (context.actorRole === 'guest') {
            if (getEntityId(existing.guestUserId) !== context.actorUserId) {
                throw new AppError('You can only update your own service requests', 403);
            }
            if (payload.status && payload.status !== 'cancelled') {
                throw new AppError('Guests can only cancel their own service requests', 403);
            }
            if (existing.status !== 'pending') {
                throw new AppError('Only pending service requests can be cancelled', 409);
            }
        } else {
            if (existing.status === 'completed' || existing.status === 'cancelled') {
                throw new AppError(`Cannot update a ${existing.status} service request`, 409);
            }
        }
        const updatePayload = { ...payload };
        if (payload.status === 'completed') {
            updatePayload.completedAt = new Date();
        }
        
        if (
            ['in_progress', 'completed'].includes(payload.status) &&
            !existing.assignedToUserId &&
            context.actorRole !== 'guest'
        ) {
            // Auto-assign the staff member who started or completed the request if unassigned
            updatePayload.assignedToUserId = context.actorUserId;
        }

        const updated = await serviceRequestRepository.updateById(requestId, updatePayload);
        if (!updated) {
            throw new AppError('Service request update failed', 500);
        }
        if (payload.status === 'completed') {
            await notificationsService.createNotification({
                type: 'service_request',
                title: 'Service request completed',
                message: 'One of your in-stay service requests has been marked complete.',
                targetUserIds: [getEntityId(updated.guestUserId)],
                link: '/guest/dashboard',
                priority: 'low',
            });
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'serviceRequest.update',
            entityType: 'service_request',
            entityId: requestId,
            before: serializeRequest(existing.toObject()),
            after: serializeRequest(updated.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeRequest(updated.toObject());
    },
};
