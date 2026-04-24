import { publicQueryKeys, useGuestReservations } from '@/features/public/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { guestApi } from '@/features/guest/api';
import { useAuthStore } from '@/app/store/auth-store';
import { getApiErrorMessage } from '@/lib/api-error';
export const guestQueryKeys = {
    profile: (guestId) => ['guest', 'profile', guestId],
    invoices: ['guest', 'invoices'],
    payments: ['guest', 'payments'],
    serviceRequests: ['guest', 'service-requests'],
    feedback: ['guest', 'feedback'],
    notifications: ['guest', 'notifications'],
};

const getInvoiceTotalsByReservation = (invoices) => {
    const totals = new Map();
    invoices.forEach((invoice) => {
        if (!invoice?.reservationId) {
            return;
        }
        const existing = totals.get(invoice.reservationId);
        if (!existing || new Date(invoice.issuedAt ?? 0).getTime() >= new Date(existing.issuedAt ?? 0).getTime()) {
            totals.set(invoice.reservationId, invoice);
        }
    });
    return totals;
};

export const useGuestDashboard = () => {
    const reservationsQuery = useGuestReservations();
    const invoicesQuery = useGuestInvoices();
    const reservations = reservationsQuery.data ?? [];
    const invoices = invoicesQuery.data ?? [];
    const invoiceTotalsByReservation = getInvoiceTotalsByReservation(invoices);
    const now = new Date();
    const upcoming = reservations.filter((reservation) => new Date(reservation.checkInDate) > now && ['pending', 'confirmed'].includes(reservation.status));
    const current = reservations.filter((reservation) => reservation.status === 'checked_in');
    const completed = reservations.filter((reservation) => reservation.status === 'checked_out');
    const recentReservations = reservations.slice(0, 4).map((reservation) => {
        const linkedInvoice = invoiceTotalsByReservation.get(reservation.id);
        return {
            ...reservation,
            invoiceTotalAmount: linkedInvoice?.totalAmount ?? reservation.totalAmount,
            invoiceBalanceAmount: linkedInvoice?.balanceAmount ?? 0,
            hasInvoiceCharges: linkedInvoice ? Number(linkedInvoice.totalAmount) > Number(reservation.totalAmount) : false,
        };
    });
    const totalSpend = reservations.reduce((sum, reservation) => {
        // Only include stays that are currently happening or completed in the total spend calculation
        if (!['checked_in', 'checked_out'].includes(reservation.status)) {
            return sum;
        }
        const linkedInvoice = invoiceTotalsByReservation.get(reservation.id);
        if (linkedInvoice && linkedInvoice.status === 'void') {
            return sum;
        }
        return sum + Number(linkedInvoice?.totalAmount ?? reservation.totalAmount ?? 0);
    }, 0);
    const summary = {
        upcomingCount: upcoming.length,
        currentCount: current.length,
        completedCount: completed.length,
        totalSpend,
        nextUpcoming: upcoming[0] ?? null,
        recentReservations,
    };
    return {
        ...reservationsQuery,
        isLoading: reservationsQuery.isLoading || invoicesQuery.isLoading,
        summary,
    };
};
export const useGuestInvoices = () => useQuery({
    queryKey: guestQueryKeys.invoices,
    queryFn: guestApi.listInvoices,
});
export const useGuestPayments = () => useQuery({
    queryKey: guestQueryKeys.payments,
    queryFn: guestApi.listPayments,
});
export const useGuestProfile = () => {
    const guestId = useAuthStore((state) => state.user?.id ?? '');
    return useQuery({
        queryKey: guestQueryKeys.profile(guestId),
        queryFn: () => guestApi.getProfile(guestId),
        enabled: Boolean(guestId),
    });
};
export const useUpdateGuestProfile = () => {
    const queryClient = useQueryClient();
    const guestId = useAuthStore((state) => state.user?.id ?? '');
    const setUser = useAuthStore((state) => state.setUser);
    const authUser = useAuthStore((state) => state.user);
    
    return useMutation({
        mutationFn: (payload) => guestApi.updateProfile(guestId, payload),
        onSuccess: (updatedData) => {
            if (updatedData) {
                setUser({ ...(authUser ?? {}), ...updatedData });
            }
            toast.success('Guest profile updated successfully');
            queryClient.invalidateQueries({ queryKey: guestQueryKeys.profile(guestId) });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to update guest profile.')),
    });
};
export const useGuestServiceRequests = () => useQuery({
    queryKey: guestQueryKeys.serviceRequests,
    queryFn: guestApi.listServiceRequests,
});
export const useCreateGuestServiceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: guestApi.createServiceRequest,
        onSuccess: () => {
            toast.success('Service request submitted');
            queryClient.invalidateQueries({ queryKey: guestQueryKeys.serviceRequests });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to submit service request.')),
    });
};
export const useCancelGuestServiceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: guestApi.cancelServiceRequest,
        onSuccess: () => {
            toast.success('Service request cancelled');
            queryClient.invalidateQueries({ queryKey: guestQueryKeys.serviceRequests });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to cancel service request.')),
    });
};
export const useGuestFeedback = () => useQuery({
    queryKey: guestQueryKeys.feedback,
    queryFn: guestApi.listFeedback,
});
export const useCreateGuestFeedback = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: guestApi.createFeedback,
        onSuccess: () => {
            toast.success('Feedback submitted successfully');
            queryClient.invalidateQueries({ queryKey: guestQueryKeys.feedback });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to submit feedback.')),
    });
};
export const useGuestNotifications = () => useQuery({
    queryKey: guestQueryKeys.notifications,
    queryFn: guestApi.listNotifications,
});
export const useMarkGuestNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: guestApi.markNotificationRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: guestQueryKeys.notifications });
        },
    });
};
export const useMarkAllGuestNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: guestApi.markAllNotificationsRead,
        onSuccess: () => {
            toast.success('All notifications marked as read');
            queryClient.invalidateQueries({ queryKey: guestQueryKeys.notifications });
        },
    });
};
export const useCancelGuestReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: guestApi.cancelReservation,
        onSuccess: () => {
            toast.success('Reservation cancelled');
            queryClient.invalidateQueries({ queryKey: publicQueryKeys.guestReservations });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to cancel reservation.')),
    });
};
