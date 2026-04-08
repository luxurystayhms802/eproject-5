import { http } from '@/services/http';
export const housekeepingApi = {
    listTasks: async () => {
        const response = await http.get('/housekeeping/tasks', {
            params: { limit: 50 },
        });
        return response.data.data;
    },
    getBoard: async () => {
        const response = await http.get('/housekeeping/board');
        return response.data.data;
    },
    startTask: async (taskId) => {
        const response = await http.post(`/housekeeping/tasks/${taskId}/start`);
        return response.data.data;
    },
    completeTask: async (taskId) => {
        const response = await http.post(`/housekeeping/tasks/${taskId}/complete`);
        return response.data.data;
    },
    createMaintenanceIssue: async (payload) => {
        const response = await http.post('/maintenance/requests', payload);
        return response.data.data;
    },
    listServiceRequests: async (filters) => {
        const response = await http.get('/service-requests', { params: filters });
        return response.data.data;
    },
    updateServiceRequest: async (requestId, payload) => {
        const response = await http.patch(`/service-requests/${requestId}`, payload);
        return response.data.data;
    },
};
