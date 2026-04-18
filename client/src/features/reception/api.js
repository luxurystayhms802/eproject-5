import { http } from '@/services/http';
const today = new Date();
const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, -1).toISOString();

const withParams = (params = {}) => {
  const normalizedEntries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  return normalizedEntries.length ? { params: Object.fromEntries(normalizedEntries) } : {};
};

export const receptionApi = {
  listArrivalsToday: async () => {
    const response = await http.get('/reservations', {
            params: {
                status: 'confirmed',
                checkInFrom: startOfToday,
                checkInTo: endOfToday,
                limit: 20,
            },
        });
        return response.data.data;
    },
    listDeparturesToday: async () => {
        const response = await http.get('/reservations', {
            params: {
                status: 'checked_in',
                limit: 20,
            },
        });
        return response.data.data.filter((reservation) => {
            const checkOutDate = new Date(reservation.checkOutDate);
            return checkOutDate >= new Date(startOfToday) && checkOutDate <= new Date(endOfToday);
        });
    },
    listConfirmedReservations: async () => {
        const response = await http.get('/reservations', {
            params: {
                status: 'confirmed',
                limit: 50,
            },
        });
        return response.data.data;
    },
  listCheckedInReservations: async () => {
    const response = await http.get('/reservations', {
      params: {
        status: 'checked_in',
        limit: 50,
            },
    });
    return response.data.data;
  },
  listReservations: async (params = {}) => {
    const response = await http.get('/reservations', withParams({ limit: 100, ...params }));
    return response.data.data;
  },
  createReservation: async (payload) => {
    const response = await http.post('/reservations', payload);
    return response.data.data;
  },
  updateReservation: async (reservationId, payload) => {
    const response = await http.patch(`/reservations/${reservationId}`, payload);
    return response.data.data;
  },
  amendStay: async (reservationId, payload) => {
    const response = await http.patch(`/reservations/${reservationId}/amend-stay`, payload);
    return response.data.data;
  },
  assignReservationRoom: async (reservationId, roomId) => {
    const response = await http.post(`/reservations/${reservationId}/assign-room`, { roomId });
    return response.data.data;
  },
  confirmReservation: async (reservationId) => {
    const response = await http.post(`/reservations/${reservationId}/confirm`);
    return response.data.data;
  },
  cancelReservation: async (reservationId, payload = {}) => {
    const response = await http.post(`/reservations/${reservationId}/cancel`, payload);
    return response.data.data;
  },
  markReservationMissedArrival: async (reservationId) => {
    const response = await http.post(`/reservations/${reservationId}/missed-arrival`);
    return response.data.data;
  },
  listGuests: async (params = {}) => {
    const response = await http.get('/guests', withParams({ limit: 100, ...params }));
    return response.data.data;
  },
  createGuest: async (payload) => {
    const response = await http.post('/guests', payload);
    return response.data.data;
  },
  updateGuest: async (guestId, payload) => {
    const response = await http.patch(`/guests/${guestId}`, payload);
    return response.data.data;
  },
  listRoomTypes: async (params = {}) => {
    const response = await http.get('/room-types', withParams({ isActive: true, limit: 100, ...params }));
    return response.data.data;
  },
  searchAvailableRooms: async (params) => {
    const response = await http.get('/rooms/availability/search', {
      params,
    });
    return response.data.data.availableRooms;
    },
    assignRoom: async (reservationId, roomId) => {
        const response = await http.post(`/reservations/${reservationId}/assign-room`, { roomId });
        return response.data.data;
    },
    checkInReservation: async (reservationId, payload) => {
        const response = await http.post(`/reservations/${reservationId}/check-in`, payload);
        return response.data.data;
    },
    checkOutReservation: async (reservationId, payload) => {
        const response = await http.post(`/reservations/${reservationId}/check-out`, payload);
        return response.data.data;
    },
    listFolioCharges: async (reservationId) => {
        const response = await http.get('/folio-charges', {
            params: { reservationId, limit: 50 },
        });
        return response.data.data;
    },
    addFolioCharge: async (payload) => {
        const response = await http.post('/folio-charges', payload);
        return response.data.data;
    },
    deleteFolioCharge: async (chargeId) => {
        const response = await http.delete(`/folio-charges/${chargeId}`);
        return response.data.data;
    },
    generateInvoice: async (reservationId) => {
        const response = await http.post(`/invoices/generate/${reservationId}`);
        return response.data.data;
    },
    listInvoices: async () => {
        const response = await http.get('/invoices', {
            params: { limit: 50 },
        });
        return response.data.data;
    },
  listPayments: async () => {
    const response = await http.get('/payments', {
      params: { limit: 50 },
    });
    return response.data.data;
  },
  createPayment: async (payload) => {
    const response = await http.post('/payments', payload);
    return response.data.data;
  },
  listServiceRequests: async (params = {}) => {
    const response = await http.get('/service-requests', withParams({ limit: 100, ...params }));
    return response.data.data;
  },
  createServiceRequest: async (payload) => {
    const response = await http.post('/service-requests', payload);
    return response.data.data;
  },
  updateServiceRequest: async (requestId, payload) => {
    const response = await http.patch(`/service-requests/${requestId}`, payload);
    return response.data.data;
  },
  listMaintenanceRequests: async (params = {}) => {
    const response = await http.get('/maintenance/requests', withParams({ limit: 100, ...params }));
    return response.data.data;
  },
  createMaintenanceRequest: async (payload) => {
    const response = await http.post('/maintenance/requests', payload);
    return response.data.data;
  },
};
