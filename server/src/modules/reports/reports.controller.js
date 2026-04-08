import { sendSuccess } from '../../shared/utils/api-response.js';
import { reportsService } from './reports.service.js';
const formatDateStamp = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};
export const reportsController = {
    publicSummary: async (_request, response) => sendSuccess(response, {
        message: 'Public summary fetched successfully',
        data: await reportsService.getPublicSummary(),
    }),
    dashboard: async (request, response) => sendSuccess(response, {
        message: 'Dashboard report fetched successfully',
        data: await reportsService.getDashboardSummary(request.query),
    }),
    occupancy: async (_request, response) => sendSuccess(response, {
        message: 'Occupancy report fetched successfully',
        data: await reportsService.getOccupancyReport(),
    }),
    revenue: async (request, response) => sendSuccess(response, {
        message: 'Revenue report fetched successfully',
        data: await reportsService.getRevenueReport(request.query),
    }),
    reservations: async (request, response) => sendSuccess(response, {
        message: 'Reservations report fetched successfully',
        data: await reportsService.getReservationsReport(request.query),
    }),
    housekeeping: async (request, response) => sendSuccess(response, {
        message: 'Housekeeping report fetched successfully',
        data: await reportsService.getHousekeepingReport(request.query),
    }),
    maintenance: async (request, response) => sendSuccess(response, {
        message: 'Maintenance report fetched successfully',
        data: await reportsService.getMaintenanceReport(request.query),
    }),
    feedback: async (request, response) => sendSuccess(response, {
        message: 'Feedback report fetched successfully',
        data: await reportsService.getFeedbackReport(request.query),
    }),
    exportCsv: async (request, response) => {
        const csv = await reportsService.exportCsv(String(request.query.report ?? 'revenue'), request.query);
        response.setHeader('Content-Type', 'text/csv');
        response.setHeader('Content-Disposition', `attachment; filename="luxurystay-${String(request.query.report ?? 'revenue')}-${formatDateStamp(new Date())}.csv"`);
        response.status(200).send(csv);
    },
};
