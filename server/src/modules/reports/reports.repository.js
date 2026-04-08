import { FeedbackModel } from '../feedback/feedback.model.js';
import { HousekeepingTaskModel } from '../housekeeping/housekeeping-task.model.js';
import { MaintenanceRequestModel } from '../maintenance/maintenance-request.model.js';
import { PaymentModel } from '../billing/payment.model.js';
import { ReservationModel } from '../reservations/reservation.model.js';
import { RoomTypeModel } from '../room-types/room-type.model.js';
import { RoomModel } from '../rooms/room.model.js';
export const reportsRepository = {
    countRooms: (filter = {}) => RoomModel.countDocuments({ deletedAt: null, ...filter }),
    countReservations: (filter = {}) => ReservationModel.countDocuments({ deletedAt: null, ...filter }),
    countPayments: (filter = {}) => PaymentModel.countDocuments({ deletedAt: null, ...filter }),
    countHousekeepingTasks: (filter = {}) => HousekeepingTaskModel.countDocuments({ deletedAt: null, ...filter }),
    countMaintenanceRequests: (filter = {}) => MaintenanceRequestModel.countDocuments({ deletedAt: null, ...filter }),
    countFeedback: (filter = {}) => FeedbackModel.countDocuments({ deletedAt: null, ...filter }),
    countRoomTypes: (filter = {}) => RoomTypeModel.countDocuments({ deletedAt: null, ...filter }),
    roomStatusAggregation: () => RoomModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$status', value: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]),
    reservationStatusAggregation: (filter) => ReservationModel.aggregate([
        { $match: { deletedAt: null, ...filter } },
        { $group: { _id: '$status', value: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]),
    reservationSourceAggregation: (filter) => ReservationModel.aggregate([
        { $match: { deletedAt: null, ...filter } },
        { $group: { _id: '$bookingSource', value: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]),
    reservationDailyTrend: (filter = {}) => ReservationModel.aggregate([
        { $match: { deletedAt: null, ...filter } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                value: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]),
    paymentMonthlyTrend: (filter = {}) => PaymentModel.aggregate([
        { $match: { deletedAt: null, status: 'success', ...filter } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
                value: { $sum: '$amount' },
            },
        },
        { $sort: { _id: 1 } },
    ]),
    feedbackAverageTrend: (filter = {}) => FeedbackModel.aggregate([
        { $match: { deletedAt: null, ...filter } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                value: { $avg: '$rating' },
            },
        },
        { $sort: { _id: 1 } },
    ]),
    feedbackRatingDistribution: (filter = {}) => FeedbackModel.aggregate([
        { $match: { deletedAt: null, ...filter } },
        { $group: { _id: '$rating', value: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]),
    averageFeedbackRating: (filter = {}) => FeedbackModel.aggregate([
        { $match: { deletedAt: null, ...filter } },
        { $group: { _id: null, value: { $avg: '$rating' } } },
    ]),
    averageMaintenanceResolutionHours: (filter = {}) => MaintenanceRequestModel.aggregate([
        { $match: { deletedAt: null, resolvedAt: { $ne: null }, reportedAt: { $ne: null }, ...filter } },
        {
            $project: {
                resolutionHours: { $divide: [{ $subtract: ['$resolvedAt', '$reportedAt'] }, 1000 * 60 * 60] },
            },
        },
        { $group: { _id: null, value: { $avg: '$resolutionHours' } } },
    ]),
    averageHousekeepingCompletionHours: (filter = {}) => HousekeepingTaskModel.aggregate([
        { $match: { deletedAt: null, completedAt: { $ne: null }, startedAt: { $ne: null }, ...filter } },
        {
            $project: {
                completionHours: { $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60] },
            },
        },
        { $group: { _id: null, value: { $avg: '$completionHours' } } },
    ]),
    listRoomsForExport: () => RoomModel.find({ deletedAt: null })
        .populate('roomTypeId', 'name basePrice maxAdults maxChildren bedType')
        .sort({ floor: 1, roomNumber: 1 })
        .lean(),
    listReservationsForExport: (filter = {}) => ReservationModel.find({
        deletedAt: null,
        ...filter,
    })
        .populate('guestUserId', 'fullName email phone')
        .populate('roomTypeId', 'name basePrice')
        .populate('roomId', 'roomNumber floor status')
        .sort({ createdAt: -1 })
        .lean(),
    listPaymentsForExport: (filter = {}) => PaymentModel.find({
        deletedAt: null,
        ...filter,
    })
        .populate('invoiceId', 'invoiceNumber status totalAmount balanceAmount')
        .populate('reservationId', 'reservationCode bookingSource checkInDate checkOutDate status')
        .populate('guestUserId', 'fullName email')
        .populate('receivedByUserId', 'fullName email')
        .sort({ paidAt: -1 })
        .lean(),
    listHousekeepingTasksForExport: (filter = {}) => HousekeepingTaskModel.find({ deletedAt: null, ...filter })
        .populate('roomId', 'roomNumber floor status housekeepingStatus')
        .populate('reservationId', 'reservationCode checkInDate checkOutDate status')
        .populate('assignedToUserId', 'fullName email')
        .sort({ createdAt: -1 })
        .lean(),
    listMaintenanceRequestsForExport: (filter = {}) => MaintenanceRequestModel.find({ deletedAt: null, ...filter })
        .populate('roomId', 'roomNumber floor status')
        .populate('reportedByUserId', 'fullName email role')
        .populate('assignedToUserId', 'fullName email role')
        .sort({ reportedAt: -1 })
        .lean(),
    listFeedbackForExport: (filter = {}) => FeedbackModel.find({ deletedAt: null, ...filter })
        .populate('reservationId', 'reservationCode checkInDate checkOutDate status')
        .populate('guestUserId', 'fullName email')
        .sort({ createdAt: -1 })
        .lean(),
};
