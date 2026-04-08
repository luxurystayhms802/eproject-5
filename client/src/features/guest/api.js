import { http } from '@/services/http';
import { publicApi } from '@/features/public/api';
export const guestApi = {
    listReservations: () => publicApi.listGuestReservations(),
    getProfile: async (guestId) => {
        const response = await http.get(`/guests/${guestId}`);
        return response.data.data;
    },
    updateProfile: async (guestId, payload) => {
        const response = await http.patch(`/guests/${guestId}`, payload);
        return response.data.data;
    },
    listInvoices: async () => {
        const response = await http.get('/invoices');
        return response.data.data;
    },
    listFolioCharges: async (reservationId) => {
        const response = await http.get('/folio-charges', {
            params: { reservationId, limit: 100 },
        });
        return response.data.data;
    },
    listPayments: async () => {
        const response = await http.get('/payments');
        return response.data.data;
    },
    listServiceRequests: async () => {
        const response = await http.get('/service-requests', { params: { limit: 50 } });
        return response.data.data;
    },
    createServiceRequest: async (payload) => {
        const response = await http.post('/service-requests', payload);
        return response.data.data;
    },
    cancelServiceRequest: async (requestId) => {
        const response = await http.patch(`/service-requests/${requestId}`, { status: 'cancelled' });
        return response.data.data;
    },
    listFeedback: async () => {
        const response = await http.get('/feedback', { params: { limit: 50 } });
        return response.data.data;
    },
    createFeedback: async (payload) => {
        const response = await http.post('/feedback', payload);
        return response.data.data;
    },
    listNotifications: async () => {
        const response = await http.get('/notifications', { params: { limit: 50 } });
        return response.data.data;
    },
    markNotificationRead: async (notificationId) => {
        const response = await http.post(`/notifications/${notificationId}/read`);
        return response.data.data;
    },
    markAllNotificationsRead: async () => {
        const response = await http.post('/notifications/read-all');
        return response.data.data;
    },
    cancelReservation: async (reservationId) => {
        const response = await http.post(`/reservations/${reservationId}/cancel`, {
            cancellationReason: 'Cancelled from guest portal',
        });
        return response.data.data;
    },
};
