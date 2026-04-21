import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import { receptionApi } from '@/features/reception/api';
export const receptionQueryKeys = {
    arrivalsToday: ['reception', 'arrivals-today'],
    departuresToday: ['reception', 'departures-today'],
    confirmedReservations: ['reception', 'confirmed-reservations'],
    checkedInReservations: ['reception', 'checked-in-reservations'],
    reservationDesk: (filters = {}) => ['reception', 'reservations', filters],
    guests: (filters = {}) => ['reception', 'guests', filters],
    roomTypes: ['reception', 'room-types'],
    serviceRequests: (filters = {}) => ['reception', 'service-requests', filters],
    folioCharges: (reservationId) => ['reception', 'folio-charges', reservationId],
    invoices: ['reception', 'invoices'],
    payments: ['reception', 'payments'],
};
export const useArrivalsToday = (options = {}) => useQuery({
    queryKey: receptionQueryKeys.arrivalsToday,
    queryFn: receptionApi.listArrivalsToday,
    ...options,
});
export const useDeparturesToday = (options = {}) => useQuery({
    queryKey: receptionQueryKeys.departuresToday,
    queryFn: receptionApi.listDeparturesToday,
    ...options,
});
export const useConfirmedReservations = (options = {}) => useQuery({
    queryKey: receptionQueryKeys.confirmedReservations,
    queryFn: receptionApi.listConfirmedReservations,
    ...options,
});
export const useCheckedInReservations = (options = {}) => useQuery({
    queryKey: receptionQueryKeys.checkedInReservations,
    queryFn: receptionApi.listCheckedInReservations,
    ...options,
});
export const useReceptionReservations = (filters = {}) => useQuery({
    queryKey: receptionQueryKeys.reservationDesk(filters),
    queryFn: () => receptionApi.listReservations(filters),
});
export const useReceptionGuests = (filters = {}) => useQuery({
    queryKey: receptionQueryKeys.guests(filters),
    queryFn: () => receptionApi.listGuests(filters),
});
export const useReceptionUsers = (filters = {}) => useQuery({
    queryKey: ['reception', 'users', filters],
    queryFn: () => receptionApi.listUsers(filters),
});
export const useReceptionRoomTypes = () => useQuery({
    queryKey: receptionQueryKeys.roomTypes,
    queryFn: () => receptionApi.listRoomTypes(),
});
export const useReceptionServiceRequests = (filters = {}) => useQuery({
    queryKey: receptionQueryKeys.serviceRequests(filters),
    queryFn: () => receptionApi.listServiceRequests(filters),
});
export const useFolioCharges = (reservationId) => useQuery({
    queryKey: receptionQueryKeys.folioCharges(reservationId ?? 'none'),
    queryFn: () => receptionApi.listFolioCharges(reservationId),
    enabled: Boolean(reservationId),
});
export const useInvoices = (options = {}) => useQuery({
    queryKey: receptionQueryKeys.invoices,
    queryFn: receptionApi.listInvoices,
    ...options,
});
export const usePayments = (options = {}) => useQuery({
    queryKey: receptionQueryKeys.payments,
    queryFn: receptionApi.listPayments,
    ...options,
});
export const useCheckInReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => receptionApi.checkInReservation(payload.reservationId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.confirmedReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.checkedInReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.arrivalsToday });
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            toast.success('Guest checked in successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to check in reservation.'));
        },
    });
};
export const useAssignRoom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => receptionApi.assignRoom(payload.reservationId, payload.roomId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.confirmedReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.arrivalsToday });
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            toast.success('Room assigned successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to assign room.'));
        },
    });
};
export const useGenerateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (reservationId) => receptionApi.generateInvoice(reservationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.invoices });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.payments });
            toast.success('Invoice generated successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to generate invoice.'));
        },
    });
};
export const useAddFolioCharge = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => receptionApi.addFolioCharge(payload),
        onSuccess: (charge) => {
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.folioCharges(charge.reservationId) });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.invoices });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.payments });
            toast.success('Charge added successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to add folio charge.'));
        },
    });
};
export const useDeleteFolioCharge = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (chargeId) => receptionApi.deleteFolioCharge(chargeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'folio-charges'] });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.invoices });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.payments });
            toast.success('Charge removed successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to remove folio charge.'));
        },
    });
};
export const useCheckOutReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => receptionApi.checkOutReservation(payload.reservationId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.checkedInReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.departuresToday });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.invoices });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.payments });
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            toast.success('Guest checked out successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to check out reservation.'));
        },
    });
};
export const useCreateReceptionGuest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: receptionApi.createGuest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'guests'] });
            toast.success('Guest account created successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to create guest account.'));
        },
    });
};
export const useCreateReceptionReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: receptionApi.createReservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.confirmedReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.arrivalsToday });
            toast.success('Reservation created successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to create reservation.'));
        },
    });
};
export const useUpdateReceptionReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, payload }) => receptionApi.updateReservation(reservationId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.confirmedReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.arrivalsToday });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.departuresToday });
            toast.success('Reservation updated successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to update reservation.'));
        },
    });
};
export const useAmendReceptionStay = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, payload }) => receptionApi.amendStay(reservationId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.checkedInReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.departuresToday });
            toast.success('Stay dates amended successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to amend stay dates.'));
        },
    });
};
export const useConfirmReceptionReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: receptionApi.confirmReservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.confirmedReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.arrivalsToday });
            toast.success('Reservation confirmed successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to confirm reservation.'));
        },
    });
};
export const useCancelReceptionReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, cancellationReason }) => receptionApi.cancelReservation(reservationId, { cancellationReason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.confirmedReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.arrivalsToday });
            toast.success('Reservation cancelled successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to cancel reservation.'));
        },
    });
};
export const useMarkReservationMissedArrival = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: receptionApi.markReservationMissedArrival,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'reservations'] });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.confirmedReservations });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.arrivalsToday });
            toast.success('Reservation marked as missed-arrival successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to mark reservation as missed-arrival.'));
        },
    });
};
export const useCreateReceptionPayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: receptionApi.createPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.payments });
            queryClient.invalidateQueries({ queryKey: receptionQueryKeys.invoices });
            toast.success('Payment recorded successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to record payment.'));
        },
    });
};
export const useCreateReceptionServiceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: receptionApi.createServiceRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'service-requests'] });
            toast.success('Service request created successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to create service request.'));
        },
    });
};
export const useUpdateReceptionServiceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ requestId, payload }) => receptionApi.updateServiceRequest(requestId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'service-requests'] });
            toast.success('Service request updated successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to update service request.'));
        },
    });
};
export const useReceptionMaintenanceRequests = (filters = {}) => useQuery({
    queryKey: ['reception', 'maintenance-requests', filters],
    queryFn: () => receptionApi.listMaintenanceRequests(filters),
});
export const useCreateReceptionMaintenanceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: receptionApi.createMaintenanceRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reception', 'maintenance-requests'] });
            toast.success('Maintenance issue reported successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to report maintenance issue.'));
        },
    });
};
