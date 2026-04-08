import { http } from '@/services/http';
export const notificationsApi = {
    list: async (params = {}) => {
        const response = await http.get('/notifications', {
            params: { limit: 50, ...params },
        });
        return response.data.data;
    },
    markRead: async (notificationId) => {
        const response = await http.post(`/notifications/${notificationId}/read`);
        return response.data.data;
    },
    markAllRead: async () => {
        const response = await http.post('/notifications/read-all');
        return response.data.data;
    },
};
