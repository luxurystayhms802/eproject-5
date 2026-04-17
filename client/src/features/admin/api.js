 import { http } from '@/services/http';
export const adminApi = {
    getDashboard: async () => {
        const response = await http.get('/reports/dashboard');
        return response.data.data;
    },
    listStaff: async (params = {}) => {
        const response = await http.get('/staff', { params: { limit: 50, ...params } });
        return response.data.data;
    },
    getUser: async (userId) => {
        const response = await http.get(`/users/${userId}`);
        return response.data.data;
    },
    updateUser: async ({ userId, payload }) => {
        const response = await http.patch(`/users/${userId}`, payload);
        return response.data.data;
    },
    deleteUser: async (userId) => {
        const response = await http.delete(`/users/${userId}`);
        return response.data.data;
    },
    createStaff: async (payload) => {
        const response = await http.post('/staff', payload);
        return response.data.data;
    },
    updateStaff: async ({ staffId, payload }) => {
        const response = await http.patch(`/staff/${staffId}`, payload);
        return response.data.data;
    },
    listGuests: async (params = {}) => {
        const response = await http.get('/guests', { params: { limit: 100, ...params } });
        return response.data.data;
    },
    createGuest: async (payload) => {
        const response = await http.post('/guests', payload);
        return response.data.data;
    },
    updateGuest: async ({ guestId, payload }) => {
        const response = await http.patch(`/guests/${guestId}`, payload);
        return response.data.data;
    },
    listRoomTypes: async (params = {}) => {
        const response = await http.get('/room-types', { params: { limit: 60, ...params } });
        return response.data.data;
    },
    createRoomType: async (payload) => {
        const response = await http.post('/room-types', payload);
        return response.data.data;
    },
    updateRoomType: async ({ roomTypeId, payload }) => {
        const response = await http.patch(`/room-types/${roomTypeId}`, payload);
        return response.data.data;
    },
    deleteRoomType: async (roomTypeId) => {
        const response = await http.delete(`/room-types/${roomTypeId}`);
        return response.data.data;
    },
    listRooms: async (params = {}) => {
        const response = await http.get('/rooms', { params: { limit: 60, ...params } });
        return response.data.data;
    },
    createRoom: async (payload) => {
        const response = await http.post('/rooms', payload);
        return response.data.data;
    },
    updateRoom: async ({ roomId, payload }) => {
        const response = await http.patch(`/rooms/${roomId}`, payload);
        return response.data.data;
    },
    updateRoomStatus: async ({ roomId, payload }) => {
        const response = await http.patch(`/rooms/${roomId}/status`, payload);
        return response.data.data;
    },
    deleteRoom: async (roomId) => {
        const response = await http.delete(`/rooms/${roomId}`);
        return response.data.data;
    },
    searchAvailability: async (params) => {
        const response = await http.get('/rooms/availability/search', { params });
        return response.data.data;
    },
    listReservations: async (params = {}) => {
        const response = await http.get('/reservations', { params: { limit: 60, ...params } });
        return response.data.data;
    },
    getReservation: async (reservationId) => {
        const response = await http.get(`/reservations/${reservationId}`);
        return response.data.data;
    },
    createReservation: async (payload) => {
        const response = await http.post('/reservations', payload);
        return response.data.data;
    },
    updateReservation: async ({ reservationId, payload }) => {
        const response = await http.patch(`/reservations/${reservationId}`, payload);
        return response.data.data;
    },
    confirmReservation: async (reservationId) => {
        const response = await http.post(`/reservations/${reservationId}/confirm`);
        return response.data.data;
    },
    assignReservationRoom: async ({ reservationId, roomId }) => {
        const response = await http.post(`/reservations/${reservationId}/assign-room`, { roomId });
        return response.data.data;
    },
    checkInReservation: async ({ reservationId, payload }) => {
        const response = await http.post(`/reservations/${reservationId}/check-in`, payload);
        return response.data.data;
    },
    checkOutReservation: async ({ reservationId, payload }) => {
        const response = await http.post(`/reservations/${reservationId}/check-out`, payload);
        return response.data.data;
    },
    cancelReservation: async ({ reservationId, cancellationReason }) => {
        const response = await http.post(`/reservations/${reservationId}/cancel`, { cancellationReason });
        return response.data.data;
    },
    markReservationNoShow: async (reservationId) => {
        const response = await http.post(`/reservations/${reservationId}/no-show`);
        return response.data.data;
    },
    listFolioCharges: async (params = {}) => {
        const response = await http.get('/folio-charges', { params: { limit: 50, ...params } });
        return response.data.data;
    },
    createFolioCharge: async (payload) => {
        const response = await http.post('/folio-charges', payload);
        return response.data.data;
    },
    deleteFolioCharge: async (chargeId) => {
        const response = await http.delete(`/folio-charges/${chargeId}`);
        return response.data.data;
    },
    listInvoices: async (params = {}) => {
        const response = await http.get('/invoices', { params: { limit: 100, ...params } });
        return response.data.data;
    },
    getInvoice: async (invoiceId) => {
        const response = await http.get(`/invoices/${invoiceId}`);
        return response.data.data;
    },
    generateInvoice: async (reservationId) => {
        const response = await http.post(`/invoices/generate/${reservationId}`);
        return response.data.data;
    },
    finalizeInvoice: async ({ invoiceId, payload }) => {
        const response = await http.post(`/invoices/${invoiceId}/finalize`, payload);
        return response.data.data;
    },
    listPayments: async (params = {}) => {
        const response = await http.get('/payments', { params: { limit: 100, ...params } });
        return response.data.data;
    },
    createPayment: async (payload) => {
        const response = await http.post('/payments', payload);
        return response.data.data;
    },
    listHousekeepingTasks: async (params = {}) => {
        const response = await http.get('/housekeeping/tasks', { params: { limit: 100, ...params } });
        return response.data.data;
    },
    getHousekeepingBoard: async () => {
        const response = await http.get('/housekeeping/board');
        return response.data.data;
    },
    startHousekeepingTask: async (taskId) => {
        const response = await http.post(`/housekeeping/tasks/${taskId}/start`);
        return response.data.data;
    },
    completeHousekeepingTask: async (taskId) => {
        const response = await http.post(`/housekeeping/tasks/${taskId}/complete`);
        return response.data.data;
    },
    listMaintenanceRequests: async (params = {}) => {
        const response = await http.get('/maintenance/requests', { params: { limit: 100, ...params } });
        return response.data.data;
    },
    assignMaintenanceRequest: async ({ requestId, assignedToUserId }) => {
        const response = await http.post(`/maintenance/requests/${requestId}/assign`, { assignedToUserId });
        return response.data.data;
    },
    resolveMaintenanceRequest: async ({ requestId, resolutionNotes }) => {
        const response = await http.post(`/maintenance/requests/${requestId}/resolve`, { resolutionNotes });
        return response.data.data;
    },
    closeMaintenanceRequest: async (requestId) => {
        const response = await http.post(`/maintenance/requests/${requestId}/close`);
        return response.data.data;
    },
    listServiceRequests: async (params = {}) => {
        const response = await http.get('/service-requests', { params: { limit: 100, ...params } });
        return response.data.data;
    },
    updateServiceRequest: async ({ requestId, payload }) => {
        const response = await http.patch(`/service-requests/${requestId}`, payload);
        return response.data.data;
    },
    listFeedback: async (params = {}) => {
        const response = await http.get('/feedback', { params: { limit: 100, ...params } });
        return response.data.data;
    },
    publishFeedback: async ({ feedbackId, payload }) => {
        const response = await http.patch(`/feedback/${feedbackId}/publish`, payload);
        return response.data.data;
    },
    listRoles: async () => {
        const response = await http.get('/roles');
        return response.data.data;
    },
    createRole: async (payload) => {
        const response = await http.post('/roles', payload);
        return response.data.data;
    },
    updateRole: async ({ roleId, payload }) => {
        const response = await http.patch(`/roles/${roleId}`, payload);
        return response.data.data;
    },
    deleteRole: async (roleId) => {
        const response = await http.delete(`/roles/${roleId}`);
        return response.data.data;
    },
    getOccupancyReport: async () => {
        const response = await http.get('/reports/occupancy');
        return response.data.data;
    },
    getRevenueReport: async () => {
        const response = await http.get('/reports/revenue');
        return response.data.data;
    },
    getReservationsReport: async () => {
        const response = await http.get('/reports/reservations');
        return response.data.data;
    },
    getHousekeepingReport: async () => {
        const response = await http.get('/reports/housekeeping');
        return response.data.data;
    },
    getMaintenanceReport: async () => {
        const response = await http.get('/reports/maintenance');
        return response.data.data;
    },
    getFeedbackReport: async () => {
        const response = await http.get('/reports/feedback');
        return response.data.data;
    },
    exportReportCsv: async (report) => {
        const response = await http.get('/reports/export/csv', {
            params: { report },
            responseType: 'blob',
        });
        return response.data;
    },
    getSettings: async () => {
        const response = await http.get('/settings');
        return response.data.data;
    },
    updateSettings: async (payload) => {
        const response = await http.patch('/settings', payload);
        return response.data.data;
    },
    createNotification: async (payload) => {
        const response = await http.post('/notifications', payload);
        return response.data.data;
    },
    uploadImages: async (formData) => {
        const response = await http.post('/uploads/images', formData);
        return response.data.data;
    },
    listInquiries: async (params) => {
        const response = await http.get('/inquiries', { params });
        return response.data.data;
    },
    resolveInquiry: async (inquiryId) => {
        const response = await http.patch(`/inquiries/${inquiryId}/resolve`);
        return response.data.data;
    },
    listDepartments: async () => {
        const response = await http.get('/departments');
        return response.data.data;
    },
    createDepartment: async (label) => {
        const response = await http.post('/departments', { label });
        return response.data.data;
    },
    deleteDepartment: async (name) => {
        const response = await http.delete(`/departments/${name}`);
        return response.data;
    },
    listFaqs: async () => {
        const response = await http.get('/faqs');
        return response.data.data;
    },
    createFaq: async (payload) => {
        const response = await http.post('/faqs', payload);
        return response.data.data;
    },
    updateFaq: async ({ faqId, payload }) => {
        const response = await http.put(`/faqs/${faqId}`, payload);
        return response.data.data;
    },
    deleteFaq: async (faqId) => {
        const response = await http.delete(`/faqs/${faqId}`);
        return response.data.data;
    },
};
