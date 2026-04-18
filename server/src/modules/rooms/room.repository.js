import { RoomModel } from './room.model.js';
export const roomRepository = {
    findById: (roomId) => RoomModel.findOne({ _id: roomId, deletedAt: null }).populate('roomTypeId'),
    findLeanById: (roomId) => RoomModel.findOne({ _id: roomId, deletedAt: null }).populate('roomTypeId').lean(),
    findByRoomNumber: (roomNumber) => RoomModel.findOne({ roomNumber, deletedAt: null }),
    list: (filter, skip, limit) => RoomModel.find(filter).collation({ locale: 'en_US', numericOrdering: true }).sort({ roomNumber: 1 }).skip(skip).limit(limit).populate('roomTypeId').lean(),
    count: (filter) => RoomModel.countDocuments(filter),
    create: (payload) => RoomModel.create(payload),
    updateById: (roomId, payload) => RoomModel.findOneAndUpdate({ _id: roomId, deletedAt: null }, payload, { new: true }).populate('roomTypeId'),
    deleteById: (roomId) => RoomModel.findByIdAndDelete(roomId),
};
