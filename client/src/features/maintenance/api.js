import { http } from '@/services/http';
export const maintenanceApi = {
    listRequests: async (status) => {
        const response = await http.get('/maintenance/requests', {
            params: {
                status,
                limit: 60,
            },
        });
        return response.data.data;
    },
    assignRequest: async (requestId, assignedToUserId) => {
        const response = await http.post(`/maintenance/requests/${requestId}/assign`, {
            assignedToUserId,
        });
        return response.data.data;
    },
    resolveRequest: async (requestId, resolutionNotes) => {
        const response = await http.post(`/maintenance/requests/${requestId}/resolve`, {
            resolutionNotes,
        });
        return response.data.data;
    },
    closeRequest: async (requestId) => {
        const response = await http.post(`/maintenance/requests/${requestId}/close`);
        return response.data.data;
    },
};
