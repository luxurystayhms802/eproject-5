import { http } from '@/services/http';

const getRequestConfig = (params = {}) => {
    const config = {};
    if (params && Object.keys(params).length) {
        config.params = params;
    }
    return config;
};

export const managerApi = {
    getDashboard: async (params = {}) => {
        const response = await http.get('/reports/dashboard', getRequestConfig(params));
        return response.data.data;
    },
    getOccupancy: async (params = {}) => {
        const response = await http.get('/reports/occupancy', getRequestConfig(params));
        return response.data.data;
    },
    getRevenue: async (params = {}) => {
        const response = await http.get('/reports/revenue', getRequestConfig(params));
        return response.data.data;
    },
    getReservations: async (params = {}) => {
        const response = await http.get('/reports/reservations', getRequestConfig(params));
        return response.data.data;
    },
    getHousekeeping: async (params = {}) => {
        const response = await http.get('/reports/housekeeping', getRequestConfig(params));
        return response.data.data;
    },
    getMaintenance: async (params = {}) => {
        const response = await http.get('/reports/maintenance', getRequestConfig(params));
        return response.data.data;
    },
    getFeedback: async (params = {}) => {
        const response = await http.get('/reports/feedback', getRequestConfig(params));
        return response.data.data;
    },
    exportReportCsv: async (report, params = {}) => {
        const response = await http.get('/reports/export/csv', {
            params: { report, ...params },
            responseType: 'blob',
        });
        return response.data;
    },
};
