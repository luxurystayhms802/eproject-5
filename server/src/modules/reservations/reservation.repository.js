import { ReservationModel } from './reservation.model.js';
export const reservationRepository = {
    findById: (reservationId) => ReservationModel.findOne({ _id: reservationId, deletedAt: null })
        .populate('guestUserId', 'firstName lastName fullName email phone role status')
        .populate('roomTypeId')
        .populate('roomId')
        .populate('createdByUserId', 'fullName email role'),
    findLeanById: (reservationId) => ReservationModel.findOne({ _id: reservationId, deletedAt: null })
        .populate('guestUserId', 'firstName lastName fullName email phone role status')
        .populate('roomTypeId')
        .populate('roomId')
        .populate('createdByUserId', 'fullName email role')
        .lean(),
    list: (filter, skip, limit) => ReservationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('guestUserId', 'firstName lastName fullName email phone role status')
        .populate('roomTypeId')
        .populate('roomId')
        .populate('createdByUserId', 'fullName email role')
        .lean(),
    count: (filter) => ReservationModel.countDocuments(filter),
    create: (payload) => ReservationModel.create(payload),
    updateById: (reservationId, payload) => ReservationModel.findOneAndUpdate({ _id: reservationId, deletedAt: null }, payload, { new: true })
        .populate('guestUserId', 'firstName lastName fullName email phone role status')
        .populate('roomTypeId')
        .populate('roomId')
        .populate('createdByUserId', 'fullName email role'),
    findConflictingByRoomId: (params) => ReservationModel.findOne({
        roomId: params.roomId,
        deletedAt: null,
        status: { $nin: ['cancelled', 'no_show', 'checked_out'] },
        ...(params.excludeReservationId ? { _id: { $ne: params.excludeReservationId } } : {}),
        checkInDate: { $lt: params.checkOutDate },
        checkOutDate: { $gt: params.checkInDate },
    }),
    countActiveByRoomId: (roomId, excludeReservationId) => ReservationModel.countDocuments({
        roomId,
        deletedAt: null,
        status: { $nin: ['cancelled', 'no_show', 'checked_out'] },
        ...(excludeReservationId ? { _id: { $ne: excludeReservationId } } : {}),
    }),
};
