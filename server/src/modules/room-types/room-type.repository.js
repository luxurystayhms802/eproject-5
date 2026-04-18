import { isValidObjectId } from 'mongoose';
import { RoomTypeModel } from './room-type.model.js';
export const roomTypeRepository = {
    findById: (roomTypeId) => RoomTypeModel.findOne({ _id: roomTypeId, deletedAt: null }),
    findByIdOrSlug: (value) => RoomTypeModel.findOne({
        deletedAt: null,
        $or: [...(isValidObjectId(value) ? [{ _id: value }] : []), { slug: value.toLowerCase() }],
    }),
    findBySlug: (slug) => RoomTypeModel.findOne({ slug: slug.toLowerCase(), deletedAt: null }),
    list: (filter, skip, limit) => RoomTypeModel.find(filter).sort({ featured: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    count: (filter) => RoomTypeModel.countDocuments(filter),
    create: (payload) => RoomTypeModel.create(payload),
    updateById: (roomTypeId, payload) => RoomTypeModel.findOneAndUpdate({ _id: roomTypeId, deletedAt: null }, payload, { new: true }),
    deleteById: (roomTypeId) => RoomTypeModel.findByIdAndDelete(roomTypeId),
};
