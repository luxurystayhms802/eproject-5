import { ReservationModel } from '../reservations/reservation.model.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { auditService } from '../audit/audit.service.js';
import { notificationsService } from '../notifications/notification.service.js';
import { feedbackRepository } from './feedback.repository.js';
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
const serializeFeedback = (feedback) => ({
    id: feedback._id.toString(),
    reservationId: getEntityId(feedback.reservationId),
    reservation: feedback.reservationId ?? null,
    guestUserId: getEntityId(feedback.guestUserId),
    guest: feedback.guestUserId ?? null,
    rating: feedback.rating,
    title: feedback.title,
    comment: feedback.comment,
    categories: feedback.categories,
    isPublished: feedback.isPublished,
    createdAt: feedback.createdAt ?? null,
    updatedAt: feedback.updatedAt ?? null,
});
const serializePublicFeedback = (feedback) => ({
    id: feedback._id.toString(),
    rating: feedback.rating,
    title: feedback.title,
    comment: feedback.comment,
    guestName: feedback.guestUserId?.fullName?.trim() || 'Verified guest',
    roleLabel: 'Verified guest',
    publishedAt: feedback.updatedAt ?? feedback.createdAt ?? null,
});
export const feedbackService = {
    async listPublishedFeedback(query) {
        const pagination = getPagination(query);
        const filter = {
            deletedAt: null,
            isPublished: true,
        };
        if (query.rating)
            filter.rating = query.rating;
        const [items, total] = await Promise.all([
            feedbackRepository.list(filter, pagination.skip, pagination.limit),
            feedbackRepository.count(filter),
        ]);
        return {
            items: items.map((item) => serializePublicFeedback(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async listFeedback(query, actor) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (actor.role === 'guest') {
            filter.guestUserId = actor.id;
        }
        else if (query.guestUserId) {
            filter.guestUserId = query.guestUserId;
        }
        if (query.reservationId)
            filter.reservationId = query.reservationId;
        if (typeof query.isPublished === 'boolean')
            filter.isPublished = query.isPublished;
        if (query.rating)
            filter.rating = query.rating;
        const [items, total] = await Promise.all([
            feedbackRepository.list(filter, pagination.skip, pagination.limit),
            feedbackRepository.count(filter),
        ]);
        return {
            items: items.map((item) => serializeFeedback(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async createFeedback(payload, context) {
        const reservation = await ReservationModel.findOne({ _id: payload.reservationId, deletedAt: null });
        if (!reservation) {
            throw new AppError('Reservation not found', 404);
        }
        if (reservation.status !== 'checked_out') {
            throw new AppError('Feedback can only be submitted after checkout', 409);
        }
        if (context.actorRole === 'guest' && reservation.guestUserId.toString() !== context.actorUserId) {
            throw new AppError('You can only submit feedback for your own completed reservations', 403);
        }
        const existing = await feedbackRepository.findByReservationAndGuest(payload.reservationId, reservation.guestUserId.toString());
        if (existing) {
            throw new AppError('Feedback already exists for this reservation', 409);
        }
        const created = await feedbackRepository.create({
            reservationId: reservation._id,
            guestUserId: reservation.guestUserId,
            rating: payload.rating,
            title: payload.title,
            comment: payload.comment,
            categories: payload.categories,
            isPublished: false,
        });
        const createdFeedback = await feedbackRepository.findById(created._id.toString());
        await notificationsService.createNotification({
            type: 'feedback',
            title: 'New guest feedback submitted',
            message: 'A checked-out guest has submitted a new review for management insight.',
            targetRoles: ['admin', 'manager'],
            link: '/admin/dashboard',
            priority: payload.rating <= 2 ? 'high' : 'medium',
        });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'feedback.create',
            entityType: 'feedback',
            entityId: created._id.toString(),
            after: serializeFeedback(createdFeedback.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeFeedback(createdFeedback.toObject());
    },
    async publishFeedback(feedbackId, isPublished, context) {
        const existing = await feedbackRepository.findById(feedbackId);
        if (!existing) {
            throw new AppError('Feedback not found', 404);
        }
        const updated = await feedbackRepository.updateById(feedbackId, { isPublished });
        if (!updated) {
            throw new AppError('Feedback update failed', 500);
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'feedback.publish',
            entityType: 'feedback',
            entityId: feedbackId,
            before: serializeFeedback(existing.toObject()),
            after: serializeFeedback(updated.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeFeedback(updated.toObject());
    },
};
