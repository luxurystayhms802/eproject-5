import { http } from '@/services/http';
export const publicApi = {
    getSettings: async () => {
        const response = await http.get('/settings');
        return response.data.data;
    },
    listPublishedFeedback: async (params) => {
        const response = await http.get('/feedback/published', { params });
        return response.data.data;
    },
    listRoomTypes: async (params) => {
        const response = await http.get('/room-types', { params });
        return response.data;
    },
    listRooms: async (params) => {
        const response = await http.get('/rooms', { params });
        return response.data;
    },
    getRoomType: async (roomTypeId) => {
        const response = await http.get(`/room-types/${roomTypeId}`);
        return response.data.data;
    },
    searchAvailability: async (params) => {
        const response = await http.get('/rooms/availability/search', { params });
        return response.data.data;
    },
    createReservation: async (payload) => {
        const response = await http.post('/reservations', {
            roomTypeId: payload.roomTypeId,
            checkInDate: payload.checkInDate,
            checkOutDate: payload.checkOutDate,
            adults: payload.adults,
            children: payload.children,
            specialRequests: payload.specialRequests || null,
        });
        return response.data.data;
    },
    listGuestReservations: async () => {
        const response = await http.get('/reservations');
        return response.data.data;
    },
    submitInquiry: async (payload) => {
        const response = await http.post('/inquiries/public', payload);
        return response.data.data;
    },
    listFaqs: async () => {
        const response = await http.get('/faqs');
        return response.data.data;
    },
};
