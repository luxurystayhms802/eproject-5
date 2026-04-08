import { http } from '@/services/http';
export const auditApi = {
    list: async () => {
        const response = await http.get('/audit-logs', {
            params: { limit: 100 },
        });
        return response.data.data;
    },
};
