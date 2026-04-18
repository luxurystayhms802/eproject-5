import { ReservationModel } from '../reservations/reservation.model.js';
import { SettingModel } from '../settings/setting.model.js';
import { RoomTypeModel } from '../room-types/room-type.model.js';
import { HousekeepingTaskModel } from '../housekeeping/housekeeping-task.model.js';
import { MaintenanceRequestModel } from '../maintenance/maintenance-request.model.js';
import { auditService } from '../audit/audit.service.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { calculateNights, getEndOfDay, getStartOfDay } from '../../shared/utils/reservations.js';
import { HOUSEKEEPING_ROOM_STATUSES, ROOM_STATUSES } from '../../shared/constants/enums.js';
import { roomRepository } from './room.repository.js';
const inactiveReservationStatuses = ['cancelled', 'missed_arrival', 'checked_out'];
const normalizeEnumValue = (value) => {
    if (typeof value !== 'string') {
        return value;
    }
    return value.trim().toLowerCase().replaceAll(' ', '_').replaceAll('-', '_');
};
const normalizeRoomStatus = (value) => {
    const normalized = normalizeEnumValue(value);
    return ROOM_STATUSES.includes(normalized) ? normalized : value;
};
const normalizeHousekeepingStatus = (value) => {
    const normalized = normalizeEnumValue(value);
    return HOUSEKEEPING_ROOM_STATUSES.includes(normalized) ? normalized : value;
};
const normalizeRoomPayload = (payload = {}) => ({
    ...payload,
    ...(payload.status !== undefined ? { status: normalizeRoomStatus(payload.status) } : {}),
    ...(payload.housekeepingStatus !== undefined ? { housekeepingStatus: normalizeHousekeepingStatus(payload.housekeepingStatus) } : {}),
});
const enforceConsistency = (currentPayload, existingRoom = {}) => {
    const finalStatus = currentPayload.status ?? existingRoom.status ?? 'available';
    const finalHkStatus = currentPayload.housekeepingStatus ?? existingRoom.housekeepingStatus ?? 'clean';
    
    if (['dirty', 'in_progress'].includes(finalHkStatus) && finalStatus === 'available') {
         currentPayload.status = 'cleaning';
    }
    return currentPayload;
};
const resolveRoomEffectivePrice = (room, roomTypeOverride = null) => {
    const roomType = roomTypeOverride ?? room.roomTypeId;
    const customPrice = Number(room.customPrice);
    const basePrice = Number(roomType?.basePrice ?? 0);
    const hasValidCustomPrice = room.customPrice !== null &&
        room.customPrice !== undefined &&
        room.customPrice !== '' &&
        !Number.isNaN(customPrice) &&
        customPrice > 0;
    return hasValidCustomPrice ? customPrice : basePrice;
};
const serializeRoom = (room) => {
    const roomType = room.roomTypeId;
    const roomTypeId = roomType && typeof roomType === 'object' && roomType._id && typeof roomType._id === 'object' && 'toString' in roomType._id
        ? roomType._id.toString()
        : room.roomTypeId;
    return {
        id: room._id.toString(),
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomTypeId,
        roomType: roomType
            ? {
                id: roomTypeId,
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
        customPrice: room.customPrice ?? null,
        effectivePrice: resolveRoomEffectivePrice(room, roomType),
        status: normalizeRoomStatus(room.status),
        housekeepingStatus: normalizeHousekeepingStatus(room.housekeepingStatus),
        capacityAdults: room.capacityAdults,
        capacityChildren: room.capacityChildren,
        notes: room.notes ?? null,
        images: room.images ?? [],
        lastCleanedAt: room.lastCleanedAt ?? null,
        isActive: Boolean(room.isActive),
        createdAt: room.createdAt ?? null,
        updatedAt: room.updatedAt ?? null,
    };
};
const ensureRoomNumberAvailable = async (roomNumber, currentRoomId) => {
    if (!roomNumber) {
        return;
    }
    const existingRoom = await roomRepository.findByRoomNumber(roomNumber);
    if (existingRoom && existingRoom._id.toString() !== currentRoomId) {
        throw new AppError('Room number already exists', 409);
    }
};
const ensureRoomTypeExists = async (roomTypeId) => {
    if (!roomTypeId) {
        return null;
    }
    const roomType = await RoomTypeModel.findOne({ _id: roomTypeId, deletedAt: null, isActive: true });
    if (!roomType) {
        throw new AppError('Room type not found', 404);
    }
    return roomType;
};
export const roomService = {
    async listRooms(query) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (query.roomTypeId)
            filter.roomTypeId = query.roomTypeId;
        if (query.status)
            filter.status = query.status;
        if (query.housekeepingStatus)
            filter.housekeepingStatus = query.housekeepingStatus;
        if (query.floor !== undefined)
            filter.floor = query.floor;
        if (query.isActive !== undefined)
            filter.isActive = query.isActive;
        if (query.search) {
            const expression = new RegExp(query.search, 'i');
            filter.$or = [{ roomNumber: expression }, { notes: expression }];
        }
        const [items, total] = await Promise.all([
            roomRepository.list(filter, pagination.skip, pagination.limit),
            roomRepository.count(filter),
        ]);
        return {
            items: items.map((room) => serializeRoom(room)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getRoomById(roomId) {
        const room = await roomRepository.findLeanById(roomId);
        if (!room) {
            throw new AppError('Room not found', 404);
        }
        return serializeRoom(room);
    },
    async createRoom(payload, context) {
        let normalizedPayload = normalizeRoomPayload(payload);
        normalizedPayload = enforceConsistency(normalizedPayload);
        await ensureRoomNumberAvailable(String(payload.roomNumber));
        await ensureRoomTypeExists(String(payload.roomTypeId));
        const room = await roomRepository.create({
            ...normalizedPayload,
            images: normalizedPayload.images ?? [],
            notes: normalizedPayload.notes ?? null,
            customPrice: normalizedPayload.customPrice ?? null,
            isActive: normalizedPayload.isActive ?? true,
        });
        const createdRoom = await roomRepository.findById(room._id.toString());
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'room.create',
            entityType: 'room',
            entityId: room._id.toString(),
            after: serializeRoom(createdRoom.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeRoom(createdRoom.toObject());
    },
    async updateRoom(roomId, payload, context) {
        const existingRoom = await roomRepository.findById(roomId);
        if (!existingRoom) {
            throw new AppError('Room not found', 404);
        }
        let normalizedPayload = normalizeRoomPayload(payload);
        normalizedPayload = enforceConsistency(normalizedPayload, existingRoom);
        await ensureRoomNumberAvailable(normalizedPayload.roomNumber, roomId);
        await ensureRoomTypeExists(normalizedPayload.roomTypeId);
        const updatedRoom = await roomRepository.updateById(roomId, normalizedPayload);
        if (!updatedRoom) {
            throw new AppError('Room update failed', 500);
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'room.update',
            entityType: 'room',
            entityId: roomId,
            before: serializeRoom(existingRoom.toObject()),
            after: serializeRoom(updatedRoom.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeRoom(updatedRoom.toObject());
    },
    async updateRoomStatus(roomId, payload, context) {
        return this.updateRoom(roomId, payload, context);
    },
    async deleteRoom(roomId, context) {
        const existingRoom = await roomRepository.findById(roomId);
        if (!existingRoom) {
            throw new AppError('Room not found', 404);
        }
        const activeReservationCount = await ReservationModel.countDocuments({
            roomId,
            deletedAt: null,
            status: { $nin: inactiveReservationStatuses },
        });
        if (activeReservationCount > 0) {
            throw new AppError('Cannot delete a room with active reservations', 409);
        }

        const activeHousekeepingCount = await HousekeepingTaskModel.countDocuments({
            roomId,
            deletedAt: null,
            status: { $nin: ['completed', 'cancelled'] },
        });
        if (activeHousekeepingCount > 0) {
            throw new AppError('Cannot delete a room that has active housekeeping tasks', 409);
        }

        const activeMaintenanceCount = await MaintenanceRequestModel.countDocuments({
            roomId,
            deletedAt: null,
            status: { $nin: ['resolved', 'closed'] },
        });
        if (activeMaintenanceCount > 0) {
            throw new AppError('Cannot delete a room that has open maintenance requests', 409);
        }

        const deletedRoom = await roomRepository.deleteById(roomId);
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'room.delete',
            entityType: 'room',
            entityId: roomId,
            before: serializeRoom(existingRoom.toObject()),
            after: serializeRoom(deletedRoom.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return { id: roomId };
    },
    async searchAvailability(query) {
        const nights = calculateNights(query.checkInDate, query.checkOutDate);
        if (nights < 1) {
            throw new AppError('Check-out date must be after check-in date', 400);
        }
        const roomTypeFilter = { deletedAt: null, isActive: true };
        if (query.roomTypeId) {
            roomTypeFilter._id = query.roomTypeId;
        }
        const roomTypes = await RoomTypeModel.find({
            ...roomTypeFilter,
            maxAdults: { $gte: query.adults },
            maxChildren: { $gte: query.children },
        }).lean();
        const roomTypeIds = roomTypes.map((roomType) => roomType._id);
        const candidateRooms = await roomRepository.list({
            deletedAt: null,
            isActive: true,
            roomTypeId: { $in: roomTypeIds },
            capacityAdults: { $gte: query.adults },
            capacityChildren: { $gte: query.children },
            status: { $nin: ['maintenance', 'out_of_service'] },
        }, 0, 200);
        const overlappingReservations = await ReservationModel.find({
            deletedAt: null,
            roomId: { $in: candidateRooms.map((room) => room._id) },
            status: { $nin: inactiveReservationStatuses },
            ...(query.excludeReservationId ? { _id: { $ne: query.excludeReservationId } } : {}),
            checkInDate: { $lt: getEndOfDay(query.checkOutDate) },
            checkOutDate: { $gt: getStartOfDay(query.checkInDate) },
        })
            .select('roomId')
            .lean();
        const blockedRoomIds = new Set(overlappingReservations.map((reservation) => String(reservation.roomId)));
        const availableRooms = candidateRooms.filter((room) => !blockedRoomIds.has(String(room._id)));
        const serializedAvailableRooms = availableRooms.map((room) => serializeRoom(room));
        const settings = await SettingModel.findOne().sort({ createdAt: -1 }).lean();
        const taxPercentage = (settings?.taxRules ?? []).reduce((sum, taxRule) => sum + Number(taxRule.percentage ?? 0), 0);
        const availableRoomTypeMap = new Map();
        for (const room of serializedAvailableRooms) {
            const key = String(room.roomTypeId);
            const current = availableRoomTypeMap.get(key) ?? [];
            current.push(room);
            availableRoomTypeMap.set(key, current);
        }
        const availableRoomTypes = roomTypes
            .map((roomType) => {
            const rooms = availableRoomTypeMap.get(String(roomType._id)) ?? [];
            const startingRate = rooms.length > 0
                ? Math.min(...rooms.map((room) => resolveRoomEffectivePrice(room, roomType)))
                : Number(roomType.basePrice);
            const subtotal = startingRate * nights;
            const taxAmount = Number(((subtotal * taxPercentage) / 100).toFixed(2));
            return {
                id: String(roomType._id),
                name: roomType.name,
                slug: roomType.slug,
                description: roomType.description,
                shortDescription: roomType.shortDescription,
                basePrice: roomType.basePrice,
                maxAdults: roomType.maxAdults,
                maxChildren: roomType.maxChildren,
                bedCount: roomType.bedCount,
                bedType: roomType.bedType,
                roomSizeSqFt: roomType.roomSizeSqFt ?? null,
                amenities: roomType.amenities ?? [],
                images: roomType.images ?? [],
                featured: Boolean(roomType.featured),
                availableRoomCount: rooms.length,
                pricing: {
                    nights,
                    baseAmount: subtotal,
                    taxAmount,
                    totalAmount: Number((subtotal + taxAmount).toFixed(2)),
                },
            };
        })
            .filter((roomType) => roomType.availableRoomCount > 0);
        const startingFrom = availableRoomTypes.length > 0 ? Math.min(...availableRoomTypes.map((roomType) => roomType.pricing.totalAmount)) : 0;
        return {
            availableRoomTypes,
            availableRooms: serializedAvailableRooms,
            pricingSummary: {
                nights,
                taxPercentage,
                startingFrom,
            },
        };
    },
};
