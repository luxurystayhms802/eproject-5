import { RoomModel } from '../rooms/room.model.js';
import { auditService } from '../audit/audit.service.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { slugify } from '../../shared/utils/slugify.js';
import { roomTypeRepository } from './room-type.repository.js';
const serializeRoomType = (roomType) => ({
    id: roomType._id.toString(),
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
    isActive: Boolean(roomType.isActive),
    createdAt: roomType.createdAt ?? null,
    updatedAt: roomType.updatedAt ?? null,
});
export const roomTypeService = {
    async listRoomTypes(query) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (query.featured !== undefined) {
            filter.featured = query.featured;
        }
        if (query.isActive !== undefined) {
            filter.isActive = query.isActive;
        }
        if (query.search) {
            const expression = new RegExp(query.search, 'i');
            filter.$or = [{ name: expression }, { shortDescription: expression }, { description: expression }, { amenities: expression }];
        }
        const [items, total] = await Promise.all([
            roomTypeRepository.list(filter, pagination.skip, pagination.limit),
            roomTypeRepository.count(filter),
        ]);
        return {
            items: items.map((item) => serializeRoomType(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getRoomType(roomTypeIdOrSlug) {
        const roomType = await roomTypeRepository.findByIdOrSlug(roomTypeIdOrSlug);
        if (!roomType) {
            throw new AppError('Room type not found', 404);
        }
        return serializeRoomType(roomType);
    },
    async createRoomType(payload, context) {
        const slug = String(payload.slug ?? payload.name ?? '');
        if (!slug) {
            throw new AppError('Slug or name is required', 400);
        }
        const normalizedSlug = slugify(slug);
        const existingSlug = await roomTypeRepository.findBySlug(normalizedSlug);
        if (existingSlug) {
            throw new AppError('Room type slug already exists', 409);
        }
        const roomType = await roomTypeRepository.create({
            ...payload,
            slug: normalizedSlug,
            images: payload.images ?? [],
            amenities: payload.amenities ?? [],
        });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'roomType.create',
            entityType: 'room_type',
            entityId: roomType._id.toString(),
            after: serializeRoomType(roomType),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeRoomType(roomType);
    },
    async updateRoomType(roomTypeId, payload, context) {
        const existingRoomType = await roomTypeRepository.findById(roomTypeId);
        if (!existingRoomType) {
            throw new AppError('Room type not found', 404);
        }
        const updatePayload = { ...payload };
        if (payload.slug || payload.name) {
            const normalizedSlug = slugify(String(payload.slug ?? payload.name));
            const existingSlug = await roomTypeRepository.findBySlug(normalizedSlug);
            if (existingSlug && existingSlug._id.toString() !== roomTypeId) {
                throw new AppError('Room type slug already exists', 409);
            }
            updatePayload.slug = normalizedSlug;
        }
        const updatedRoomType = await roomTypeRepository.updateById(roomTypeId, updatePayload);
        if (!updatedRoomType) {
            throw new AppError('Room type update failed', 500);
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'roomType.update',
            entityType: 'room_type',
            entityId: roomTypeId,
            before: serializeRoomType(existingRoomType),
            after: serializeRoomType(updatedRoomType),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeRoomType(updatedRoomType);
    },
    async deleteRoomType(roomTypeId, context) {
        const existingRoomType = await roomTypeRepository.findById(roomTypeId);
        if (!existingRoomType) {
            throw new AppError('Room type not found', 404);
        }
        const activeRoomsRef = await RoomModel.countDocuments({ roomTypeId: existingRoomType._id, deletedAt: null });
        if (activeRoomsRef > 0) {
            throw new AppError('Cannot delete room category because it has active rooms assigned to it', 409);
        }
        const deletedRoomType = await roomTypeRepository.deleteById(roomTypeId);
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'roomType.delete',
            entityType: 'room_type',
            entityId: roomTypeId,
            before: serializeRoomType(existingRoomType),
            after: serializeRoomType(deletedRoomType),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return { id: roomTypeId };
    },
};
