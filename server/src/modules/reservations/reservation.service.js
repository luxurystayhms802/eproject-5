import { GuestProfileModel } from '../guests/guest-profile.model.js';
import { RoomTypeModel } from '../room-types/room-type.model.js';
import { RoomModel } from '../rooms/room.model.js';
import { SettingModel } from '../settings/setting.model.js';
import { UserModel } from '../users/user.model.js';
import { logger } from '../../config/logger.js';
import { ReservationModel } from './reservation.model.js';
import { auditService } from '../audit/audit.service.js';
import { billingService } from '../billing/billing.service.js';
import { housekeepingService } from '../housekeeping/housekeeping.service.js';
import { notificationsService } from '../notifications/notification.service.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { calculateNights, generateReservationCode, getEndOfDay, getStartOfDay } from '../../shared/utils/reservations.js';
import { deriveDisplayName } from '../../shared/utils/names.js';
import { reservationRepository } from './reservation.repository.js';
const inactiveStatuses = ['cancelled', 'missed_arrival', 'checked_out'];
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
const serializeReservation = (reservation) => {
    const guest = reservation.guestUserId;
    const roomType = reservation.roomTypeId;
    const room = reservation.roomId;
    const createdBy = reservation.createdByUserId;
    return {
        id: reservation._id.toString(),
        reservationCode: reservation.reservationCode,
        guestUserId: getEntityId(reservation.guestUserId),
        guest: guest && typeof guest === 'object'
            ? {
                id: getEntityId(guest),
                fullName: deriveDisplayName(guest, 'Guest booking'),
                email: guest.email,
                phone: guest.phone,
                role: guest.role,
                status: guest.status,
            }
            : null,
        roomTypeId: getEntityId(reservation.roomTypeId),
        roomType: roomType && typeof roomType === 'object'
            ? {
                id: getEntityId(roomType),
                name: roomType.name,
                slug: roomType.slug,
                basePrice: roomType.basePrice,
                bedType: roomType.bedType,
                amenities: roomType.amenities ?? [],
                maxAdults: roomType.maxAdults,
                maxChildren: roomType.maxChildren,
                images: roomType.images ?? [],
            }
            : null,
        roomId: reservation.roomId ? getEntityId(reservation.roomId) : null,
        room: room && typeof room === 'object'
            ? {
                id: getEntityId(room),
                roomNumber: room.roomNumber,
                floor: room.floor,
                status: room.status,
                housekeepingStatus: room.housekeepingStatus,
                customPrice: room.customPrice ?? null,
            }
            : null,
        bookingSource: reservation.bookingSource,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        adults: reservation.adults,
        children: reservation.children,
        nights: reservation.nights,
        roomRate: reservation.roomRate,
        subtotal: reservation.subtotal,
        taxAmount: reservation.taxAmount,
        discountAmount: reservation.discountAmount,
        totalAmount: reservation.totalAmount,
        status: reservation.status,
        specialRequests: reservation.specialRequests ?? null,
        arrivalTime: reservation.arrivalTime ?? null,
        guestProfileSnapshot: reservation.guestProfileSnapshot,
        checkInDetails: reservation.checkInDetails ?? null,
        createdByUserId: getEntityId(reservation.createdByUserId),
        createdBy: createdBy && typeof createdBy === 'object'
            ? {
                id: getEntityId(createdBy),
                fullName: deriveDisplayName(createdBy, 'System'),
                email: createdBy.email,
                role: createdBy.role,
            }
            : null,
        confirmedAt: reservation.confirmedAt ?? null,
        checkedInAt: reservation.checkedInAt ?? null,
        checkedOutAt: reservation.checkedOutAt ?? null,
        cancellationReason: reservation.cancellationReason ?? null,
        notes: reservation.notes ?? null,
        createdAt: reservation.createdAt ?? null,
        updatedAt: reservation.updatedAt ?? null,
    };
};
const getTaxPercentage = async () => {
    const settings = await SettingModel.findOne().sort({ createdAt: -1 }).lean();
    return (settings?.taxRules ?? []).reduce((sum, taxRule) => sum + Number(taxRule.percentage ?? 0), 0);
};
const buildGuestSnapshot = async (guestUserId) => {
    const [guestUser, guestProfile] = await Promise.all([
        UserModel.findOne({ _id: guestUserId, role: 'guest', deletedAt: null }),
        GuestProfileModel.findOne({ userId: guestUserId, deletedAt: null }),
    ]);
    if (!guestUser) {
        throw new AppError('Guest account not found', 404);
    }
    return {
        guestUser,
        guestProfileSnapshot: {
            fullName: deriveDisplayName(guestUser, 'Guest booking'),
            email: guestUser.email,
            phone: guestUser.phone,
            idType: guestProfile?.idType ?? null,
            idNumber: guestProfile?.idNumber ?? null,
        },
    };
};
const calculateReservationAmounts = async (roomRate, nights, discountAmount) => {
    const subtotal = Number((roomRate * nights).toFixed(2));
    const safeDiscount = Number(discountAmount ?? 0);
    const taxableAmount = Math.max(0, subtotal - safeDiscount);
    const taxPercentage = await getTaxPercentage();
    const taxAmount = Number(((taxableAmount * taxPercentage) / 100).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));
    return {
        subtotal,
        taxAmount,
        totalAmount,
    };
};
const ensureRoomAvailability = async (params) => {
    const conflictingReservation = await reservationRepository.findConflictingByRoomId(params);
    if (conflictingReservation) {
        throw new AppError('The selected room is not available for the chosen dates', 409);
    }
};
const countAvailableRoomsForRoomType = async (params) => {
    const candidateRooms = await RoomModel.find({
        roomTypeId: params.roomTypeId,
        deletedAt: null,
        isActive: true,
        capacityAdults: { $gte: params.adults },
        capacityChildren: { $gte: params.children },
        status: { $nin: ['maintenance', 'out_of_service'] },
    })
        .select('_id')
        .lean();
    if (candidateRooms.length === 0) {
        return 0;
    }
    const overlappingReservations = await ReservationModel.find({
        deletedAt: null,
        roomId: { $in: candidateRooms.map((room) => room._id) },
        status: { $nin: inactiveStatuses },
        ...(params.excludeReservationId ? { _id: { $ne: params.excludeReservationId } } : {}),
        checkInDate: { $lt: getEndOfDay(params.checkOutDate) },
        checkOutDate: { $gt: getStartOfDay(params.checkInDate) },
    })
        .select('roomId')
        .lean();
    const blockedRoomIds = new Set(overlappingReservations
        .map((reservation) => (reservation.roomId ? String(reservation.roomId) : null))
        .filter((roomId) => Boolean(roomId)));
    return candidateRooms.filter((room) => !blockedRoomIds.has(String(room._id))).length;
};
const syncRoomStatusForReservedReservation = async (roomId) => {
    if (!roomId) {
        return;
    }
    await RoomModel.findByIdAndUpdate(roomId, { status: 'reserved' });
};
const releaseReservedRoomIfPossible = async (roomId, excludeReservationId) => {
    if (!roomId) {
        return;
    }
    const activeReservationCount = await reservationRepository.countActiveByRoomId(roomId, excludeReservationId);
    if (activeReservationCount === 0) {
        const room = await RoomModel.findOne({ _id: roomId, deletedAt: null });
        if (room && !['maintenance', 'out_of_service', 'occupied', 'cleaning'].includes(room.status)) {
            room.status = 'available';
            await room.save();
        }
    }
};
const ensureReservationAccessible = (reservation, actor) => {
    if (actor.role === 'guest' && getEntityId(reservation.guestUserId) !== actor.id) {
        throw new AppError('You can only access your own reservations', 403);
    }
};
const runReservationSideEffect = (promise, label, reservationId) => {
    void promise.catch((error) => {
        logger.warn({
            err: error,
            reservationId,
            label,
        }, 'Reservation side effect failed after core state update');
    });
};
export const reservationService = {
    async listReservations(query, actor) {
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
        if (query.bookingSource)
            filter.bookingSource = query.bookingSource;
        if (query.roomTypeId)
            filter.roomTypeId = query.roomTypeId;
        if (query.roomId)
            filter.roomId = query.roomId;
        if (query.checkInFrom || query.checkInTo) {
            filter.checkInDate = {
                ...(query.checkInFrom ? { $gte: getStartOfDay(query.checkInFrom) } : {}),
                ...(query.checkInTo ? { $lte: getEndOfDay(query.checkInTo) } : {}),
            };
        }
        if (query.search) {
            const expression = new RegExp(query.search, 'i');
            filter.$or = [
                { reservationCode: expression },
                { 'guestProfileSnapshot.fullName': expression },
                { 'guestProfileSnapshot.email': expression },
                { 'guestProfileSnapshot.phone': expression },
            ];
        }
        const [items, total] = await Promise.all([
            reservationRepository.list(filter, pagination.skip, pagination.limit),
            reservationRepository.count(filter),
        ]);
        return {
            items: items.map((item) => serializeReservation(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getReservationById(reservationId, actor) {
        const reservation = await reservationRepository.findLeanById(reservationId);
        if (!reservation) {
            throw new AppError('Reservation not found', 404);
        }
        ensureReservationAccessible(reservation, actor);
        return serializeReservation(reservation);
    },
    async createReservation(payload, context) {
        const guestUserId = context.actorRole === 'guest' ? context.actorUserId : payload.guestUserId;
        if (!guestUserId) {
            throw new AppError('Guest is required to create a reservation', 400);
        }
        const nights = calculateNights(payload.checkInDate, payload.checkOutDate);
        if (nights < 1) {
            throw new AppError('Check-out date must be after check-in date', 400);
        }
        const roomType = await RoomTypeModel.findOne({
            _id: payload.roomTypeId,
            deletedAt: null,
            isActive: true,
            maxAdults: { $gte: payload.adults },
            maxChildren: { $gte: payload.children },
        });
        if (!roomType) {
            throw new AppError('Selected room type is not available for the requested occupancy', 404);
        }
        let roomRate = Number(roomType.basePrice);
        let selectedRoomId = payload.roomId ?? null;
        if (selectedRoomId) {
            const room = await RoomModel.findOne({
                _id: selectedRoomId,
                roomTypeId: roomType._id,
                deletedAt: null,
                isActive: true,
                status: { $nin: ['maintenance', 'out_of_service'] },
                capacityAdults: { $gte: payload.adults },
                capacityChildren: { $gte: payload.children },
            });
            if (!room) {
                throw new AppError('Selected room is invalid for this reservation', 400);
            }
            await ensureRoomAvailability({
                roomId: selectedRoomId,
                checkInDate: payload.checkInDate,
                checkOutDate: payload.checkOutDate,
            });
            roomRate = Number(room.customPrice ?? roomType.basePrice);
        }
        else {
            const availableRoomCount = await countAvailableRoomsForRoomType({
                roomTypeId: payload.roomTypeId,
                adults: payload.adults,
                children: payload.children,
                checkInDate: payload.checkInDate,
                checkOutDate: payload.checkOutDate,
            });
            if (availableRoomCount === 0) {
                throw new AppError('No rooms are available for this room type and date range', 409);
            }
        }
        const { guestProfileSnapshot } = await buildGuestSnapshot(guestUserId);
        const discountAmount = Number(payload.discountAmount ?? 0);
        const financials = await calculateReservationAmounts(roomRate, nights, discountAmount);
        const status = context.actorRole === 'guest' ? 'pending' : payload.status ?? (payload.bookingSource === 'online' ? 'pending' : 'confirmed');
        const bookingSource = context.actorRole === 'guest' ? 'online' : payload.bookingSource ?? 'desk';
        const reservation = await reservationRepository.create({
            reservationCode: generateReservationCode(),
            guestUserId,
            roomTypeId: payload.roomTypeId,
            roomId: selectedRoomId,
            bookingSource,
            checkInDate: getStartOfDay(payload.checkInDate),
            checkOutDate: getStartOfDay(payload.checkOutDate),
            adults: payload.adults,
            children: payload.children,
            nights,
            roomRate,
            subtotal: financials.subtotal,
            taxAmount: financials.taxAmount,
            discountAmount,
            totalAmount: financials.totalAmount,
            status,
            specialRequests: payload.specialRequests ?? null,
            arrivalTime: payload.arrivalTime ?? null,
            guestProfileSnapshot,
            createdByUserId: context.actorUserId,
            confirmedAt: status === 'confirmed' ? new Date() : null,
            notes: payload.notes ?? null,
        });
        if (status === 'confirmed') {
            await syncRoomStatusForReservedReservation(selectedRoomId);
        }
        const createdReservation = await reservationRepository.findById(reservation._id.toString());
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'reservation.create',
            entityType: 'reservation',
            entityId: reservation._id.toString(),
            after: serializeReservation(createdReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await notificationsService.createNotification({
            type: 'reservation',
            title: 'Reservation created',
            message: status === 'pending'
                ? 'A new reservation was created and is waiting for operational confirmation.'
                : 'A new reservation was created and confirmed by staff.',
            targetRoles: status === 'pending' ? ['admin', 'receptionist', 'manager'] : ['admin', 'manager'],
            targetUserIds: [guestUserId],
            link: '/reception/dashboard',
            priority: status === 'pending' ? 'medium' : 'low',
        });
        runReservationSideEffect(billingService.generateInvoice(createdReservation._id.toString(), context), 'Initial invoice generation', createdReservation._id.toString());
        return serializeReservation(createdReservation.toObject());
    },
    async updateReservation(reservationId, payload, context) {
        const existingReservation = await reservationRepository.findById(reservationId);
        if (!existingReservation) {
            throw new AppError('Reservation not found', 404);
        }
        if (['checked_in', 'checked_out', 'cancelled', 'missed_arrival'].includes(String(existingReservation.status))) {
            throw new AppError('This reservation can no longer be modified', 409);
        }
        const nextGuestUserId = context.actorRole === 'guest' ? context.actorUserId : payload.guestUserId ?? getEntityId(existingReservation.guestUserId);
        const nextRoomTypeId = payload.roomTypeId ?? getEntityId(existingReservation.roomTypeId);
        const nextCheckInDate = payload.checkInDate ? getStartOfDay(payload.checkInDate) : new Date(existingReservation.checkInDate);
        const nextCheckOutDate = payload.checkOutDate ? getStartOfDay(payload.checkOutDate) : new Date(existingReservation.checkOutDate);
        const nextAdults = payload.adults ?? Number(existingReservation.adults);
        const nextChildren = payload.children ?? Number(existingReservation.children);
        const nextRoomId = payload.roomId === undefined ? (existingReservation.roomId ? getEntityId(existingReservation.roomId) : null) : payload.roomId;
        const nextStatus = payload.status ?? String(existingReservation.status);
        const nights = calculateNights(nextCheckInDate, nextCheckOutDate);
        if (nights < 1) {
            throw new AppError('Check-out date must be after check-in date', 400);
        }
        const isSameRoomType = nextRoomTypeId === getEntityId(existingReservation.roomTypeId);
        const roomTypeQuery = {
            _id: nextRoomTypeId,
            deletedAt: null,
            maxAdults: { $gte: nextAdults },
            maxChildren: { $gte: nextChildren },
        };
        if (!isSameRoomType) {
            roomTypeQuery.isActive = true;
        }
        const roomType = await RoomTypeModel.findOne(roomTypeQuery);
        if (!roomType) {
            throw new AppError('Selected room type is invalid for this reservation', 404);
        }
        let roomRate = Number(existingReservation.roomRate);
        if (nextRoomId) {
            const isSameRoom = nextRoomId === getEntityId(existingReservation.roomId);
            const roomQuery = {
                _id: nextRoomId,
                roomTypeId: roomType._id,
                deletedAt: null,
                capacityAdults: { $gte: nextAdults },
                capacityChildren: { $gte: nextChildren },
            };
            if (!isSameRoom) {
                roomQuery.isActive = true;
                roomQuery.status = { $nin: ['maintenance', 'out_of_service'] };
            }
            const room = await RoomModel.findOne(roomQuery);
            if (!room) {
                throw new AppError('Selected room is invalid for this reservation', 400);
            }
            await ensureRoomAvailability({
                roomId: nextRoomId,
                checkInDate: nextCheckInDate,
                checkOutDate: nextCheckOutDate,
                excludeReservationId: reservationId,
            });
            roomRate = Number(room.customPrice ?? roomType.basePrice);
        }
        else {
            const availableRoomCount = await countAvailableRoomsForRoomType({
                roomTypeId: nextRoomTypeId,
                adults: nextAdults,
                children: nextChildren,
                checkInDate: nextCheckInDate,
                checkOutDate: nextCheckOutDate,
                excludeReservationId: reservationId,
            });
            if (availableRoomCount === 0) {
                throw new AppError('No rooms are available for this room type and date range', 409);
            }
            roomRate = Number(roomType.basePrice);
        }
        const { guestProfileSnapshot } = await buildGuestSnapshot(nextGuestUserId);
        const discountAmount = Number(payload.discountAmount ?? existingReservation.discountAmount ?? 0);
        const financials = await calculateReservationAmounts(roomRate, nights, discountAmount);
        const updatedReservation = await reservationRepository.updateById(reservationId, {
            guestUserId: nextGuestUserId,
            roomTypeId: nextRoomTypeId,
            roomId: nextRoomId,
            bookingSource: payload.bookingSource ?? existingReservation.bookingSource,
            checkInDate: nextCheckInDate,
            checkOutDate: nextCheckOutDate,
            adults: nextAdults,
            children: nextChildren,
            nights,
            roomRate,
            subtotal: financials.subtotal,
            taxAmount: financials.taxAmount,
            discountAmount,
            totalAmount: financials.totalAmount,
            status: nextStatus,
            specialRequests: payload.specialRequests ?? existingReservation.specialRequests ?? null,
            arrivalTime: payload.arrivalTime ?? existingReservation.arrivalTime ?? null,
            notes: payload.notes ?? existingReservation.notes ?? null,
            guestProfileSnapshot,
            confirmedAt: nextStatus === 'confirmed' ? (existingReservation.confirmedAt ?? new Date()) : existingReservation.confirmedAt,
        });
        if (!updatedReservation) {
            throw new AppError('Reservation update failed', 500);
        }
        if (getEntityId(existingReservation.roomId) !== nextRoomId) {
            await releaseReservedRoomIfPossible(getEntityId(existingReservation.roomId), reservationId);
        }
        if (nextStatus === 'confirmed') {
            await syncRoomStatusForReservedReservation(nextRoomId);
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'reservation.update',
            entityType: 'reservation',
            entityId: reservationId,
            before: serializeReservation(existingReservation.toObject()),
            after: serializeReservation(updatedReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        const statusChangedToConfirmed = String(existingReservation.status) !== 'confirmed' && nextStatus === 'confirmed';
        await notificationsService.createNotification({
            type: 'reservation',
            title: statusChangedToConfirmed ? 'Reservation confirmed' : 'Reservation updated',
            message: statusChangedToConfirmed
                ? 'A reservation has been confirmed and is now ready for arrival planning.'
                : 'Reservation details were updated and operational teams can review the latest stay plan.',
            targetRoles: ['admin', 'receptionist', 'manager'],
            targetUserIds: [getEntityId(updatedReservation.guestUserId)],
            link: statusChangedToConfirmed ? '/reception/check-in' : '/admin/reservations',
            priority: statusChangedToConfirmed ? 'medium' : 'low',
        });
        runReservationSideEffect(billingService.generateInvoice(reservationId, context), 'Invoice generation on update', reservationId);
        return serializeReservation(updatedReservation.toObject());
    },
    async amendStayDates(reservationId, payload, context) {
        const existingReservation = await reservationRepository.findById(reservationId);
        if (!existingReservation) {
            throw new AppError('Reservation not found', 404);
        }
        
        if (String(existingReservation.status) !== 'checked_in') {
            throw new AppError('Only active checked-in reservations can be amended', 409);
        }
        
        const nextCheckOutDate = getStartOfDay(payload.checkOutDate);
        const checkInDate = new Date(existingReservation.checkInDate);
        
        const nights = calculateNights(checkInDate, nextCheckOutDate);
        if (nights < 1) {
            throw new AppError('Amended check-out date must be after check-in date', 400);
        }

        if (nextCheckOutDate > existingReservation.checkOutDate) {
             await ensureRoomAvailability({
                roomId: getEntityId(existingReservation.roomId),
                checkInDate: new Date(existingReservation.checkOutDate),
                checkOutDate: nextCheckOutDate,
                excludeReservationId: reservationId,
            });
        }
        
        const roomRate = Number(existingReservation.roomRate);
        const discountAmount = Number(existingReservation.discountAmount ?? 0);
        const financials = await calculateReservationAmounts(roomRate, nights, discountAmount);

        const updatedReservation = await reservationRepository.updateById(reservationId, {
            checkOutDate: nextCheckOutDate,
            nights,
            subtotal: financials.subtotal,
            taxAmount: financials.taxAmount,
            totalAmount: financials.totalAmount,
            notes: payload.notes ? `${existingReservation.notes || ''}\nAmended Stay: ${payload.notes}` : existingReservation.notes,
        });

        if (!updatedReservation) {
            throw new AppError('Stay amendment failed', 500);
        }

        await auditService.createLog({
            userId: context.actorUserId,
            action: 'reservation.amend',
            entityType: 'reservation',
            entityId: reservationId,
            before: serializeReservation(existingReservation.toObject()),
            after: serializeReservation(updatedReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });

        await notificationsService.createNotification({
            type: 'reservation',
            title: 'Stay dates amended',
            message: `A stay was amended. The new check-out date is now ${nextCheckOutDate.toDateString()}.`,
            targetRoles: ['admin', 'manager', 'housekeeping'],
            targetUserIds: [],
            link: '/reception/reservations',
            priority: 'medium',
        });

        runReservationSideEffect(billingService.generateInvoice(reservationId, context), 'Invoice generation on amend', reservationId);
        return serializeReservation(updatedReservation.toObject());
    },
    async confirmReservation(reservationId, context) {
        const existingReservation = await reservationRepository.findById(reservationId);
        if (!existingReservation) {
            throw new AppError('Reservation not found', 404);
        }
        if (!['draft', 'pending'].includes(String(existingReservation.status))) {
            throw new AppError('Only draft or pending reservations can be confirmed', 409);
        }
        const updatedReservation = await reservationRepository.updateById(reservationId, {
            status: 'confirmed',
            confirmedAt: new Date(),
        });
        if (!updatedReservation) {
            throw new AppError('Reservation confirmation failed', 500);
        }
        await syncRoomStatusForReservedReservation(getEntityId(updatedReservation.roomId));
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'reservation.confirm',
            entityType: 'reservation',
            entityId: reservationId,
            before: serializeReservation(existingReservation.toObject()),
            after: serializeReservation(updatedReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await notificationsService.createNotification({
            type: 'reservation',
            title: 'Reservation confirmed',
            message: 'A pending reservation has been confirmed and is ready for front-desk arrival handling.',
            targetRoles: ['admin', 'receptionist', 'manager'],
            targetUserIds: [getEntityId(updatedReservation.guestUserId)],
            link: '/reception/check-in',
            priority: 'medium',
        });
        runReservationSideEffect(billingService.generateInvoice(reservationId, context), 'Invoice generation on confirm', reservationId);
        return serializeReservation(updatedReservation.toObject());
    },
    async assignRoom(reservationId, roomId, context) {
        const existingReservation = await reservationRepository.findById(reservationId);
        if (!existingReservation) {
            throw new AppError('Reservation not found', 404);
        }
        if (!['confirmed', 'checked_in'].includes(String(existingReservation.status))) {
            throw new AppError('Only confirmed or checked-in reservations can receive a room assignment', 409);
        }
        const room = await RoomModel.findOne({
            _id: roomId,
            roomTypeId: getEntityId(existingReservation.roomTypeId),
            deletedAt: null,
            isActive: true,
            status: { $nin: ['maintenance', 'out_of_service'] },
            capacityAdults: { $gte: Number(existingReservation.adults) },
            capacityChildren: { $gte: Number(existingReservation.children) },
        });
        if (!room) {
            throw new AppError('Selected room is invalid for this reservation', 400);
        }
        await ensureRoomAvailability({
            roomId,
            checkInDate: new Date(existingReservation.checkInDate),
            checkOutDate: new Date(existingReservation.checkOutDate),
            excludeReservationId: reservationId,
        });
        const roomRate = Number(room.customPrice ?? existingReservation.roomRate);
        const financials = await calculateReservationAmounts(roomRate, Number(existingReservation.nights), Number(existingReservation.discountAmount ?? 0));
        const updatedReservation = await reservationRepository.updateById(reservationId, {
            roomId,
            roomRate,
            subtotal: financials.subtotal,
            taxAmount: financials.taxAmount,
            totalAmount: financials.totalAmount,
        });
        if (!updatedReservation) {
            throw new AppError('Room assignment failed', 500);
        }
        if (String(existingReservation.status) === 'confirmed') {
            await syncRoomStatusForReservedReservation(roomId);
        }
        runReservationSideEffect(auditService.createLog({
            userId: context.actorUserId,
            action: 'reservation.assignRoom',
            entityType: 'reservation',
            entityId: reservationId,
            before: serializeReservation(existingReservation.toObject()),
            after: serializeReservation(updatedReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        }), 'audit.assignRoom', reservationId);
        runReservationSideEffect(notificationsService.createNotification({
            type: 'reservation',
            title: 'Room assigned to reservation',
            message: 'A room assignment was completed and arrival planning can proceed with the selected room.',
            targetRoles: ['admin', 'receptionist', 'manager'],
            targetUserIds: [getEntityId(updatedReservation.guestUserId)],
            link: '/reception/check-in',
            priority: 'medium',
        }), 'notification.assignRoom', reservationId);
        return serializeReservation(updatedReservation.toObject());
    },
    async cancelReservation(reservationId, cancellationReason, context) {
        const existingReservation = await reservationRepository.findById(reservationId);
        if (!existingReservation) {
            throw new AppError('Reservation not found', 404);
        }
        ensureReservationAccessible(existingReservation.toObject(), {
            id: context.actorUserId,
            role: context.actorRole,
        });
        if (['checked_in', 'checked_out', 'cancelled', 'missed_arrival'].includes(String(existingReservation.status))) {
            throw new AppError('This reservation cannot be cancelled', 409);
        }
        const updatedReservation = await reservationRepository.updateById(reservationId, {
            status: 'cancelled',
            cancellationReason: cancellationReason ?? 'Cancelled by user',
        });
        if (!updatedReservation) {
            throw new AppError('Reservation cancellation failed', 500);
        }
        await releaseReservedRoomIfPossible(getEntityId(existingReservation.roomId), reservationId);
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'reservation.cancel',
            entityType: 'reservation',
            entityId: reservationId,
            before: serializeReservation(existingReservation.toObject()),
            after: serializeReservation(updatedReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await notificationsService.createNotification({
            type: 'reservation',
            title: 'Reservation cancelled',
            message: 'A reservation was cancelled and room inventory has been released where applicable.',
            targetRoles: ['admin', 'receptionist', 'manager'],
            targetUserIds: [getEntityId(updatedReservation.guestUserId)],
            link: '/admin/reservations',
            priority: 'low',
        });
        runReservationSideEffect(billingService.generateInvoice(reservationId, context), 'Invoice generation on cancel', reservationId);
        return serializeReservation(updatedReservation.toObject());
    },
    async markAsMissedArrival(reservationId, context) {
        const existingReservation = await reservationRepository.findById(reservationId);
        if (!existingReservation) {
            throw new AppError('Reservation not found', 404);
        }

        if (!['pending', 'confirmed'].includes(String(existingReservation.status))) {
            throw new AppError('Only pending or confirmed reservations can be marked as Missed Arrival', 409);
        }

        const updatedReservation = await reservationRepository.updateById(reservationId, {
            status: 'missed_arrival',
            notes: existingReservation.notes ? `${existingReservation.notes}\nMarked as Missed Arrival.` : 'Marked as Missed Arrival.'
        });

        if (!updatedReservation) {
            throw new AppError('Failed to mark reservation as Missed Arrival', 500);
        }

        if (existingReservation.roomId) {
            await releaseReservedRoomIfPossible(getEntityId(existingReservation.roomId), reservationId);
        }

        const actionUserId = context.actorRole === 'system' ? undefined : context.actorUserId;

        await auditService.createLog({
            userId: actionUserId,
            action: 'reservation.missed_arrival',
            entityType: 'reservation',
            entityId: reservationId,
            before: serializeReservation(existingReservation.toObject()),
            after: serializeReservation(updatedReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });

        if (context.actorRole !== 'system') {
            await notificationsService.createNotification({
                type: 'reservation',
                title: 'Reservation marked as Missed Arrival',
                message: 'A guest failed to arrive and their reservation was manually marked as a Missed Arrival. The assigned room was released.',
                targetRoles: ['admin', 'manager'],
                targetUserIds: [],
                link: '/admin/reservations',
                priority: 'low',
            });
        }

        runReservationSideEffect(billingService.generateInvoice(reservationId, context), 'Invoice voiding on missed arrival', reservationId);
        return serializeReservation(updatedReservation.toObject());
    },
    async checkInReservation(reservationId, payload, context) {
        let reservation = await reservationRepository.findById(reservationId);
        if (!reservation) {
            throw new AppError('Reservation not found', 404);
        }
        if (String(reservation.status) !== 'confirmed') {
            throw new AppError('Only confirmed reservations can be checked in', 409);
        }

        const today = getStartOfDay(new Date());
        const reservationStart = getStartOfDay(new Date(reservation.checkInDate));
        if (today < reservationStart) {
            throw new AppError('Cannot check in a guest before their scheduled arrival date. Please update the reservation dates first.', 400);
        }

        const roomId = payload.roomId ?? (reservation.roomId ? getEntityId(reservation.roomId) : null);
        if (!roomId) {
            throw new AppError('A room must be assigned before check-in', 409);
        }
        if (!reservation.roomId || getEntityId(reservation.roomId) !== roomId) {
            await this.assignRoom(reservationId, roomId, context);
            reservation = await reservationRepository.findById(reservationId);
        }
        if (!reservation || !reservation.roomId) {
            throw new AppError('Room assignment could not be completed for check-in', 500);
        }
        
        const roomState = await RoomModel.findById(roomId).lean();
        if (roomState && ['maintenance', 'out_of_service'].includes(roomState.status)) {
             throw new AppError(`Cannot check-in. The assigned room is currently marked as ${roomState.status}.`, 409);
        }
        await RoomModel.findByIdAndUpdate(roomId, {
            status: 'occupied',
            housekeepingStatus: 'clean',
        });
        const updatedReservation = await reservationRepository.updateById(reservationId, {
            status: 'checked_in',
            checkedInAt: new Date(),
            guestProfileSnapshot: {
                ...reservation.guestProfileSnapshot,
                idType: payload.idType,
                idNumber: payload.idNumber,
            },
            checkInDetails: {
                idType: payload.idType,
                idNumber: payload.idNumber,
                arrivalNote: payload.arrivalNote ?? null,
                keyIssueNote: payload.keyIssueNote ?? null,
            },
        });
        
        if (payload.idType || payload.idNumber) {
            const updateFields = {};
            if (payload.idType) updateFields.idType = payload.idType;
            if (payload.idNumber) updateFields.idNumber = payload.idNumber;
            
            await GuestProfileModel.findOneAndUpdate(
                { userId: reservation.guestUserId },
                { $set: updateFields },
                { upsert: true, setDefaultsOnInsert: true }
            );
        }
        if (!updatedReservation) {
            throw new AppError('Check-in failed', 500);
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'reservation.checkin',
            entityType: 'reservation',
            entityId: reservationId,
            before: serializeReservation(reservation.toObject()),
            after: serializeReservation(updatedReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await notificationsService.createNotification({
            type: 'reservation',
            title: 'Guest checked in',
            message: 'A reservation has been checked in successfully and the room is now occupied.',
            targetRoles: ['admin', 'receptionist', 'manager', 'housekeeping'],
            targetUserIds: [getEntityId(updatedReservation.guestUserId)],
            link: '/reception/check-out',
            priority: 'medium',
        });
        return serializeReservation(updatedReservation.toObject());
    },
    async checkOutReservation(reservationId, payload, context) {
        const reservation = await reservationRepository.findById(reservationId);
        if (!reservation) {
            throw new AppError('Reservation not found', 404);
        }
        if (String(reservation.status) !== 'checked_in') {
            throw new AppError('Only checked-in reservations can be checked out', 409);
        }
        const roomId = reservation.roomId ? getEntityId(reservation.roomId) : null;
        if (!roomId) {
            throw new AppError('Checked-in reservation is missing a room assignment', 409);
        }
        const invoice = await billingService.generateInvoice(reservationId, {
            actorUserId: context.actorUserId,
            request: context.request,
        });
        let payment = null;
        if (payload.payment && payload.payment.amount > 0) {
            payment = await billingService.createPayment({
                invoiceId: invoice.id,
                amount: payload.payment.amount,
                method: payload.payment.method,
                referenceNumber: payload.payment.referenceNumber ?? null,
                status: payload.payment.status ?? 'success',
                notes: payload.payment.notes ?? null,
            }, {
                actorUserId: context.actorUserId,
                request: context.request,
            });
        }
        const finalizedInvoice = await billingService.finalizeInvoice(invoice.id, {
            notes: payload.notes ?? null,
        }, {
            actorUserId: context.actorUserId,
            request: context.request,
        });
        await RoomModel.findByIdAndUpdate(roomId, {
            status: 'cleaning',
            housekeepingStatus: 'dirty',
        });
        const updatedReservation = await reservationRepository.updateById(reservationId, {
            status: 'checked_out',
            checkedOutAt: new Date(),
            notes: payload.notes ?? reservation.notes ?? null,
        });
        if (!updatedReservation) {
            throw new AppError('Check-out failed', 500);
        }
        const housekeepingTask = await housekeepingService.createCheckoutCleaningTask({
            roomId,
            reservationId,
        }, {
            actorUserId: context.actorUserId,
            request: context.request,
        });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'reservation.checkout',
            entityType: 'reservation',
            entityId: reservationId,
            before: serializeReservation(reservation.toObject()),
            after: serializeReservation(updatedReservation.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await notificationsService.createNotification({
            type: 'reservation',
            title: 'Guest checked out',
            message: 'Checkout is complete, billing was finalized, and housekeeping has been triggered.',
            targetRoles: ['admin', 'receptionist', 'manager', 'housekeeping'],
            targetUserIds: [getEntityId(updatedReservation.guestUserId)],
            link: '/housekeeping/tasks',
            priority: 'high',
        });
        return {
            reservation: serializeReservation(updatedReservation.toObject()),
            invoice: finalizedInvoice,
            payment,
            housekeepingTask,
        };
    },
};
