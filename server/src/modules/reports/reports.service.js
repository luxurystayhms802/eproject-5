import { reportsRepository } from './reports.repository.js';
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const shiftDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};
const shiftMonths = (date, months) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};
const normalizeBuckets = (entries) => entries.map((entry) => ({
    label: String(entry._id),
    value: Number(Number(entry.value).toFixed(2)),
}));

const toDate = (value) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDateRangeFilter = (field, options = {}, fallbackStart = null, normalizeEnd = false) => {
    const from = toDate(options.from);
    const to = toDate(options.to);
    const range = {};

    if (from) {
        range.$gte = startOfDay(from);
    } else if (fallbackStart) {
        range.$gte = startOfDay(fallbackStart);
    }

    if (to) {
        range.$lte = normalizeEnd ? endOfDay(to) : to;
    }

    return Object.keys(range).length ? { [field]: range } : {};
};

const formatDateValue = (value) => {
    if (!value) {
        return '';
    }
    return new Date(value).toISOString();
};

const formatMoneyValue = (value) => Number(Number(value ?? 0).toFixed(2));

const toCsv = (rows, explicitHeaders = []) => {
    const headers = explicitHeaders.length > 0 ? explicitHeaders : Object.keys(rows[0] ?? { label: '', value: '' });
    const lines = rows.map((row) => headers.map((header) => JSON.stringify(String(row[header] ?? ''))).join(','));
    return [headers.join(','), ...lines].join('\n');
};
export const reportsService = {
    async getPublicSummary() {
        const [totalRooms, totalRoomTypes, activeReservations] = await Promise.all([
            reportsRepository.countRooms({ isActive: true }),
            reportsRepository.countRoomTypes({ isActive: true }),
            reportsRepository.countReservations({ status: { $in: ['pending', 'confirmed', 'checked_in'] } }),
        ]);
        return {
            totalRooms,
            totalRoomTypes,
            activeReservations,
        };
    },
    async getDashboardSummary() {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        const monthStart = startOfDay(shiftDays(new Date(), -30));
        const [totalRooms, availableRooms, occupiedRooms, cleaningRooms, maintenanceRooms, todayArrivals, todayDepartures, inHouseGuests, reservationsThisMonth, revenueThisMonth, pendingPayments, openMaintenanceRequests, pendingHousekeepingTasks, dailyReservationsTrend, monthlyRevenueTrend, roomStatusDistribution, bookingSourceBreakdown, feedbackAverageTrend, averageFeedbackRating,] = await Promise.all([
            reportsRepository.countRooms(),
            reportsRepository.countRooms({ status: 'available' }),
            reportsRepository.countRooms({ status: 'occupied' }),
            reportsRepository.countRooms({ status: 'cleaning' }),
            reportsRepository.countRooms({ status: 'maintenance' }),
            reportsRepository.countReservations({ checkInDate: { $gte: todayStart, $lte: todayEnd }, status: { $in: ['confirmed', 'checked_in'] } }),
            reportsRepository.countReservations({ checkOutDate: { $gte: todayStart, $lte: todayEnd }, status: { $in: ['checked_in', 'checked_out'] } }),
            reportsRepository.countReservations({ status: 'checked_in' }),
            reportsRepository.countReservations({ createdAt: { $gte: monthStart } }),
            reportsRepository.paymentMonthlyTrend(monthStart),
            reportsRepository.countPayments({ status: 'pending' }),
            reportsRepository.countMaintenanceRequests({ status: { $in: ['open', 'assigned', 'in_progress'] } }),
            reportsRepository.countHousekeepingTasks({ status: { $in: ['pending', 'assigned', 'in_progress'] } }),
            reportsRepository.reservationDailyTrend(shiftDays(new Date(), -6)),
            reportsRepository.paymentMonthlyTrend(shiftMonths(new Date(), -5)),
            reportsRepository.roomStatusAggregation(),
            reportsRepository.reservationSourceAggregation({ createdAt: { $gte: monthStart } }),
            reportsRepository.feedbackAverageTrend(shiftMonths(new Date(), -5)),
            reportsRepository.averageFeedbackRating(),
        ]);
        return {
            cards: {
                totalRooms,
                availableRooms,
                occupiedRooms,
                cleaningRooms,
                maintenanceRooms,
                todayArrivals,
                todayDepartures,
                inHouseGuests,
                reservationsThisMonth,
                revenueThisMonth: monthlyRevenueTrend.reduce((sum, item) => sum + Number(item.value), 0),
                pendingPayments,
                openMaintenanceRequests,
                pendingHousekeepingTasks,
                occupancyPercentage: totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0,
                averageFeedbackRating: Number(Number(averageFeedbackRating[0]?.value ?? 0).toFixed(2)),
            },
            charts: {
                dailyReservationsTrend: normalizeBuckets(dailyReservationsTrend),
                monthlyRevenueTrend: normalizeBuckets(monthlyRevenueTrend),
                roomStatusDistribution: normalizeBuckets(roomStatusDistribution),
                bookingSourceBreakdown: normalizeBuckets(bookingSourceBreakdown),
                feedbackAverageTrend: normalizeBuckets(feedbackAverageTrend),
            },
        };
    },
    async getOccupancyReport() {
        const roomStatusDistribution = await reportsRepository.roomStatusAggregation();
        const totalRooms = await reportsRepository.countRooms();
        const occupiedRooms = roomStatusDistribution.find((item) => item._id === 'occupied')?.value ?? 0;
        return {
            summary: {
                totalRooms,
                occupiedRooms,
                occupancyPercentage: totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0,
            },
            distribution: normalizeBuckets(roomStatusDistribution),
        };
    },
    async getRevenueReport(options = {}) {
        const paidAtFilter = buildDateRangeFilter('paidAt', options, shiftMonths(new Date(), -5), true);
        const monthlyRevenueTrend = await reportsRepository.paymentMonthlyTrend(paidAtFilter);
        return {
            summary: {
                totalRevenue: monthlyRevenueTrend.reduce((sum, item) => sum + Number(item.value), 0),
                periods: monthlyRevenueTrend.length,
            },
            trend: normalizeBuckets(monthlyRevenueTrend),
        };
    },
    async getReservationsReport(options = {}) {
        const createdAtFilter = buildDateRangeFilter('createdAt', options, shiftDays(new Date(), -30), true);
        const [statusBreakdown, sourceBreakdown, trend] = await Promise.all([
            reportsRepository.reservationStatusAggregation(createdAtFilter),
            reportsRepository.reservationSourceAggregation(createdAtFilter),
            reportsRepository.reservationDailyTrend(createdAtFilter),
        ]);
        return {
            statusBreakdown: normalizeBuckets(statusBreakdown),
            sourceBreakdown: normalizeBuckets(sourceBreakdown),
            trend: normalizeBuckets(trend),
        };
    },
    async getHousekeepingReport(options = {}) {
        const createdAtFilter = buildDateRangeFilter('createdAt', options, shiftDays(new Date(), -30), true);
        const [pendingTasks, completedTasks, averageCompletionHours] = await Promise.all([
            reportsRepository.countHousekeepingTasks({ status: { $in: ['pending', 'assigned', 'in_progress'] }, ...createdAtFilter }),
            reportsRepository.countHousekeepingTasks({ status: 'completed', ...createdAtFilter }),
            reportsRepository.averageHousekeepingCompletionHours(createdAtFilter),
        ]);
        return {
            summary: {
                pendingTasks,
                completedTasks,
                averageCompletionHours: Number(Number(averageCompletionHours[0]?.value ?? 0).toFixed(2)),
            },
        };
    },
    async getMaintenanceReport(options = {}) {
        const reportedAtFilter = buildDateRangeFilter('reportedAt', options, shiftDays(new Date(), -30), true);
        const [openIssues, urgentIssues, resolvedIssues, averageResolutionHours] = await Promise.all([
            reportsRepository.countMaintenanceRequests({ status: { $in: ['open', 'assigned', 'in_progress'] }, ...reportedAtFilter }),
            reportsRepository.countMaintenanceRequests({ priority: 'urgent', status: { $in: ['open', 'assigned', 'in_progress'] }, ...reportedAtFilter }),
            reportsRepository.countMaintenanceRequests({ status: { $in: ['resolved', 'closed'] }, ...reportedAtFilter }),
            reportsRepository.averageMaintenanceResolutionHours(reportedAtFilter),
        ]);
        return {
            summary: {
                openIssues,
                urgentIssues,
                resolvedIssues,
                averageResolutionHours: Number(Number(averageResolutionHours[0]?.value ?? 0).toFixed(2)),
            },
        };
    },
    async getFeedbackReport(options = {}) {
        const createdAtFilter = buildDateRangeFilter('createdAt', options, shiftMonths(new Date(), -6), true);
        const [distribution, averageRating, totalFeedback] = await Promise.all([
            reportsRepository.feedbackRatingDistribution(createdAtFilter),
            reportsRepository.averageFeedbackRating(createdAtFilter),
            reportsRepository.countFeedback(createdAtFilter),
        ]);
        return {
            summary: {
                totalFeedback,
                averageRating: Number(Number(averageRating[0]?.value ?? 0).toFixed(2)),
            },
            distribution: normalizeBuckets(distribution),
        };
    },
    async exportCsv(report, options = {}) {
        const type = report || 'revenue';
        if (type === 'occupancy') {
            const rooms = await reportsRepository.listRoomsForExport();
            return toCsv(rooms.map((room) => ({
                roomNumber: room.roomNumber,
                floor: room.floor,
                roomType: room.roomTypeId?.name ?? 'n/a',
                roomStatus: room.status,
                housekeepingStatus: room.housekeepingStatus,
                nightlyRate: formatMoneyValue(room.customPrice ?? room.roomTypeId?.basePrice ?? 0),
                capacityAdults: room.capacityAdults,
                capacityChildren: room.capacityChildren,
                roomTypeBaseRate: formatMoneyValue(room.roomTypeId?.basePrice ?? 0),
                roomTypeMaxAdults: room.roomTypeId?.maxAdults ?? '',
                roomTypeMaxChildren: room.roomTypeId?.maxChildren ?? '',
                bedType: room.roomTypeId?.bedType ?? '',
                isActive: room.isActive ? 'yes' : 'no',
                lastCleanedAt: formatDateValue(room.lastCleanedAt),
                createdAt: formatDateValue(room.createdAt),
                updatedAt: formatDateValue(room.updatedAt),
            })), ['roomNumber', 'floor', 'roomType', 'roomStatus', 'housekeepingStatus', 'nightlyRate', 'capacityAdults', 'capacityChildren', 'roomTypeBaseRate', 'roomTypeMaxAdults', 'roomTypeMaxChildren', 'bedType', 'isActive', 'lastCleanedAt', 'createdAt', 'updatedAt']);
        }
        if (type === 'reservations') {
            const reservations = await reportsRepository.listReservationsForExport(buildDateRangeFilter('createdAt', options, shiftDays(new Date(), -90), true));
            return toCsv(reservations.map((reservation) => ({
                reservationCode: reservation.reservationCode,
                status: reservation.status,
                bookingSource: reservation.bookingSource,
                guestName: reservation.guestUserId?.fullName ?? reservation.guestProfileSnapshot?.fullName ?? 'n/a',
                guestEmail: reservation.guestUserId?.email ?? reservation.guestProfileSnapshot?.email ?? 'n/a',
                guestPhone: reservation.guestUserId?.phone ?? reservation.guestProfileSnapshot?.phone ?? 'n/a',
                roomType: reservation.roomTypeId?.name ?? 'n/a',
                assignedRoom: reservation.roomId?.roomNumber ?? 'unassigned',
                roomFloor: reservation.roomId?.floor ?? '',
                roomStatus: reservation.roomId?.status ?? '',
                checkInDate: formatDateValue(reservation.checkInDate),
                checkOutDate: formatDateValue(reservation.checkOutDate),
                nights: reservation.nights,
                adults: reservation.adults,
                children: reservation.children,
                roomRate: formatMoneyValue(reservation.roomRate),
                subtotal: formatMoneyValue(reservation.subtotal),
                taxAmount: formatMoneyValue(reservation.taxAmount),
                discountAmount: formatMoneyValue(reservation.discountAmount),
                totalAmount: formatMoneyValue(reservation.totalAmount),
                arrivalTime: reservation.arrivalTime ?? '',
                confirmedAt: formatDateValue(reservation.confirmedAt),
                checkedInAt: formatDateValue(reservation.checkedInAt),
                checkedOutAt: formatDateValue(reservation.checkedOutAt),
                cancellationReason: reservation.cancellationReason ?? '',
                createdAt: formatDateValue(reservation.createdAt),
            })), ['reservationCode', 'status', 'bookingSource', 'guestName', 'guestEmail', 'guestPhone', 'roomType', 'assignedRoom', 'roomFloor', 'roomStatus', 'checkInDate', 'checkOutDate', 'nights', 'adults', 'children', 'roomRate', 'subtotal', 'taxAmount', 'discountAmount', 'totalAmount', 'arrivalTime', 'confirmedAt', 'checkedInAt', 'checkedOutAt', 'cancellationReason', 'createdAt']);
        }
        if (type === 'feedback') {
            const feedbackItems = await reportsRepository.listFeedbackForExport(buildDateRangeFilter('createdAt', options, shiftMonths(new Date(), -6), true));
            return toCsv(feedbackItems.map((item) => ({
                submittedAt: formatDateValue(item.createdAt),
                reservationCode: item.reservationId?.reservationCode ?? 'n/a',
                reservationStatus: item.reservationId?.status ?? '',
                guestName: item.guestUserId?.fullName ?? 'n/a',
                guestEmail: item.guestUserId?.email ?? 'n/a',
                rating: item.rating,
                title: item.title,
                comment: item.comment,
                roomScore: item.categories?.room ?? '',
                cleanlinessScore: item.categories?.cleanliness ?? '',
                staffScore: item.categories?.staff ?? '',
                foodScore: item.categories?.food ?? '',
                overallScore: item.categories?.overall ?? '',
                published: item.isPublished ? 'yes' : 'no',
                stayCheckInDate: formatDateValue(item.reservationId?.checkInDate),
                stayCheckOutDate: formatDateValue(item.reservationId?.checkOutDate),
            })), ['submittedAt', 'reservationCode', 'reservationStatus', 'guestName', 'guestEmail', 'rating', 'title', 'comment', 'roomScore', 'cleanlinessScore', 'staffScore', 'foodScore', 'overallScore', 'published', 'stayCheckInDate', 'stayCheckOutDate']);
        }
        if (type === 'maintenance') {
            const requests = await reportsRepository.listMaintenanceRequestsForExport(buildDateRangeFilter('reportedAt', options, shiftDays(new Date(), -90), true));
            return toCsv(requests.map((request) => ({
                reportedAt: formatDateValue(request.reportedAt),
                status: request.status,
                priority: request.priority,
                issueType: request.issueType,
                roomNumber: request.roomId?.roomNumber ?? '',
                roomFloor: request.roomId?.floor ?? '',
                roomStatus: request.roomId?.status ?? '',
                locationLabel: request.locationLabel ?? '',
                description: request.description,
                reportedByName: request.reportedByUserId?.fullName ?? 'n/a',
                reportedByEmail: request.reportedByUserId?.email ?? 'n/a',
                reportedByRole: request.reportedByUserId?.role ?? '',
                assignedToName: request.assignedToUserId?.fullName ?? '',
                assignedToEmail: request.assignedToUserId?.email ?? '',
                assignedToRole: request.assignedToUserId?.role ?? '',
                startedAt: formatDateValue(request.startedAt),
                resolvedAt: formatDateValue(request.resolvedAt),
                resolutionNotes: request.resolutionNotes ?? '',
                createdAt: formatDateValue(request.createdAt),
            })), ['reportedAt', 'status', 'priority', 'issueType', 'roomNumber', 'roomFloor', 'roomStatus', 'locationLabel', 'description', 'reportedByName', 'reportedByEmail', 'reportedByRole', 'assignedToName', 'assignedToEmail', 'assignedToRole', 'startedAt', 'resolvedAt', 'resolutionNotes', 'createdAt']);
        }
        if (type === 'housekeeping') {
            const tasks = await reportsRepository.listHousekeepingTasksForExport(buildDateRangeFilter('createdAt', options, shiftDays(new Date(), -90), true));
            return toCsv(tasks.map((task) => ({
                taskType: task.taskType,
                status: task.status,
                priority: task.priority,
                roomNumber: task.roomId?.roomNumber ?? 'n/a',
                roomFloor: task.roomId?.floor ?? '',
                roomStatus: task.roomId?.status ?? '',
                housekeepingStatus: task.roomId?.housekeepingStatus ?? '',
                reservationCode: task.reservationId?.reservationCode ?? '',
                reservationStatus: task.reservationId?.status ?? '',
                stayCheckInDate: formatDateValue(task.reservationId?.checkInDate),
                stayCheckOutDate: formatDateValue(task.reservationId?.checkOutDate),
                assignedTo: task.assignedToUserId?.fullName ?? '',
                assignedToEmail: task.assignedToUserId?.email ?? '',
                scheduledFor: formatDateValue(task.scheduledFor),
                startedAt: formatDateValue(task.startedAt),
                completedAt: formatDateValue(task.completedAt),
                notes: task.notes ?? '',
                createdAt: formatDateValue(task.createdAt),
            })), ['taskType', 'status', 'priority', 'roomNumber', 'roomFloor', 'roomStatus', 'housekeepingStatus', 'reservationCode', 'reservationStatus', 'stayCheckInDate', 'stayCheckOutDate', 'assignedTo', 'assignedToEmail', 'scheduledFor', 'startedAt', 'completedAt', 'notes', 'createdAt']);
        }
        const payments = await reportsRepository.listPaymentsForExport(buildDateRangeFilter('paidAt', options, shiftMonths(new Date(), -12), true));
        return toCsv(payments.map((payment) => ({
            paidAt: formatDateValue(payment.paidAt),
            paymentStatus: payment.status,
            paymentMethod: payment.method,
            amount: formatMoneyValue(payment.amount),
            referenceNumber: payment.referenceNumber ?? '',
            invoiceNumber: payment.invoiceId?.invoiceNumber ?? 'n/a',
            invoiceStatus: payment.invoiceId?.status ?? '',
            invoiceTotalAmount: formatMoneyValue(payment.invoiceId?.totalAmount ?? 0),
            invoiceBalanceAmount: formatMoneyValue(payment.invoiceId?.balanceAmount ?? 0),
            reservationCode: payment.reservationId?.reservationCode ?? 'n/a',
            reservationStatus: payment.reservationId?.status ?? '',
            bookingSource: payment.reservationId?.bookingSource ?? '',
            checkInDate: formatDateValue(payment.reservationId?.checkInDate),
            checkOutDate: formatDateValue(payment.reservationId?.checkOutDate),
            guestName: payment.guestUserId?.fullName ?? 'n/a',
            guestEmail: payment.guestUserId?.email ?? 'n/a',
            receivedBy: payment.receivedByUserId?.fullName ?? 'n/a',
            receiverEmail: payment.receivedByUserId?.email ?? 'n/a',
            notes: payment.notes ?? '',
            createdAt: formatDateValue(payment.createdAt),
        })), ['paidAt', 'paymentStatus', 'paymentMethod', 'amount', 'referenceNumber', 'invoiceNumber', 'invoiceStatus', 'invoiceTotalAmount', 'invoiceBalanceAmount', 'reservationCode', 'reservationStatus', 'bookingSource', 'checkInDate', 'checkOutDate', 'guestName', 'guestEmail', 'receivedBy', 'receiverEmail', 'notes', 'createdAt']);
    },
};
