import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '@/features/admin/api';
import { getApiErrorMessage } from '@/lib/api-error';
export const adminQueryKeys = {
    dashboard: ['admin', 'dashboard'],
    staff: (filters = {}) => ['admin', 'staff', filters],
    guests: (filters = {}) => ['admin', 'guests', filters],
    roomTypes: (filters = {}) => ['admin', 'room-types', filters],
    rooms: (filters = {}) => ['admin', 'rooms', filters],
    reservations: (filters = {}) => ['admin', 'reservations', filters],
    folioCharges: (filters = {}) => ['admin', 'folio-charges', filters],
    invoices: (filters = {}) => ['admin', 'invoices', filters],
    invoice: (invoiceId) => ['admin', 'invoice', invoiceId],
    payments: (filters = {}) => ['admin', 'payments', filters],
    housekeepingTasks: (filters = {}) => ['admin', 'housekeeping-tasks', filters],
    housekeepingBoard: ['admin', 'housekeeping-board'],
    maintenanceRequests: (filters = {}) => ['admin', 'maintenance-requests', filters],
    serviceRequests: (filters = {}) => ['admin', 'service-requests', filters],
    feedback: (filters = {}) => ['admin', 'feedback', filters],
    roles: ['admin', 'roles'],
    occupancyReport: ['admin', 'occupancy-report'],
    revenueReport: ['admin', 'revenue-report'],
    reservationsReport: ['admin', 'reservations-report'],
    housekeepingReport: ['admin', 'housekeeping-report'],
    maintenanceReport: ['admin', 'maintenance-report'],
    feedbackReport: ['admin', 'feedback-report'],
    settings: ['admin', 'settings'],
    inquiries: (filters = {}) => ['admin', 'inquiries', filters],
    departments: ['admin', 'departments'],
    faqs: ['admin', 'faqs'],
};
export const useAdminDashboard = (options = {}) => useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: adminApi.getDashboard,
    ...options,
});
export const useAdminStaff = (filters = {}, options = {}) => useQuery({
    queryKey: adminQueryKeys.staff(filters),
    queryFn: () => adminApi.listStaff(filters),
    ...options,
});
export const useAdminGuests = (filters = {}) => useQuery({
    queryKey: adminQueryKeys.guests(filters),
    queryFn: () => adminApi.listGuests(filters),
});
export const useAdminRoomTypes = (filters = {}) => useQuery({
    queryKey: adminQueryKeys.roomTypes(filters),
    queryFn: () => adminApi.listRoomTypes(filters),
});
export const useAdminRooms = (filters = {}, enabled = true) => useQuery({
    queryKey: adminQueryKeys.rooms(filters),
    queryFn: () => adminApi.listRooms(filters),
    enabled,
});
export const useAdminReservations = (filters = {}, options = {}) => useQuery({
    queryKey: adminQueryKeys.reservations(filters),
    queryFn: () => adminApi.listReservations(filters),
    ...options,
});
export const useAdminFolioCharges = (filters = {}) => useQuery({
    queryKey: adminQueryKeys.folioCharges(filters),
    queryFn: () => adminApi.listFolioCharges(filters),
    enabled: Boolean(filters?.reservationId),
});
export const useAdminInvoices = (filters = {}) => useQuery({
    queryKey: adminQueryKeys.invoices(filters),
    queryFn: () => adminApi.listInvoices(filters),
});
export const useAdminInvoice = (invoiceId) => useQuery({
    queryKey: adminQueryKeys.invoice(invoiceId),
    queryFn: () => adminApi.getInvoice(invoiceId),
    enabled: Boolean(invoiceId),
});
export const useAdminPayments = (filters = {}, enabled = true) => useQuery({
    queryKey: adminQueryKeys.payments(filters),
    queryFn: () => adminApi.listPayments(filters),
    enabled,
});
export const useAdminHousekeepingTasks = (filters = {}, options = {}) => useQuery({
    queryKey: adminQueryKeys.housekeepingTasks(filters),
    queryFn: () => adminApi.listHousekeepingTasks(filters),
    ...options,
});
export const useAdminHousekeepingBoard = () => useQuery({
    queryKey: adminQueryKeys.housekeepingBoard,
    queryFn: adminApi.getHousekeepingBoard,
});
export const useAdminMaintenanceRequests = (filters = {}, options = {}) => useQuery({
    queryKey: adminQueryKeys.maintenanceRequests(filters),
    queryFn: () => adminApi.listMaintenanceRequests(filters),
    ...options,
});
export const useAdminServiceRequests = (filters = {}, options = {}) => useQuery({
    queryKey: adminQueryKeys.serviceRequests(filters),
    queryFn: () => adminApi.listServiceRequests(filters),
    ...options,
});
export const useAdminFeedback = (filters = {}) => useQuery({
    queryKey: adminQueryKeys.feedback(filters),
    queryFn: () => adminApi.listFeedback(filters),
});
export const useAdminRoles = () => useQuery({
    queryKey: adminQueryKeys.roles,
    queryFn: adminApi.listRoles,
});
export const useAdminUser = (userId) => useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => adminApi.getUser(userId),
    enabled: Boolean(userId),
});
export const useAdminOccupancyReport = () => useQuery({
    queryKey: adminQueryKeys.occupancyReport,
    queryFn: adminApi.getOccupancyReport,
});
export const useAdminRevenueReport = () => useQuery({
    queryKey: adminQueryKeys.revenueReport,
    queryFn: adminApi.getRevenueReport,
});
export const useAdminReservationsReport = () => useQuery({
    queryKey: adminQueryKeys.reservationsReport,
    queryFn: adminApi.getReservationsReport,
});
export const useAdminHousekeepingReport = () => useQuery({
    queryKey: adminQueryKeys.housekeepingReport,
    queryFn: adminApi.getHousekeepingReport,
});
export const useAdminMaintenanceReport = () => useQuery({
    queryKey: adminQueryKeys.maintenanceReport,
    queryFn: adminApi.getMaintenanceReport,
});
export const useAdminFeedbackReport = () => useQuery({
    queryKey: adminQueryKeys.feedbackReport,
    queryFn: adminApi.getFeedbackReport,
});
export const useAdminSettings = () => useQuery({
    queryKey: adminQueryKeys.settings,
    queryFn: adminApi.getSettings,
});
export const useAdminInquiries = (filters = {}) => useQuery({
    queryKey: adminQueryKeys.inquiries(filters),
    queryFn: () => adminApi.listInquiries(filters),
});
const invalidateAdminOperations = (queryClient) => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'guests'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'user'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'room-types'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'folio-charges'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'invoice'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'housekeeping-tasks'] }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.housekeepingBoard }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'maintenance-requests'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'service-requests'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.roles }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.occupancyReport }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.revenueReport }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.reservationsReport }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.housekeepingReport }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.maintenanceReport }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.feedbackReport }),
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'inquiries'] }),
]);

const mergeReservationIntoList = (current, nextReservation) => {
    if (!Array.isArray(current)) {
        return current;
    }

    return current.map((reservation) => (reservation.id === nextReservation.id ? { ...reservation, ...nextReservation } : reservation));
};

const buildMutation = (queryClient, mutationFn, successMessage, failureMessage) => useMutation({
    mutationFn,
    onSuccess: () => {
        toast.success(successMessage);
        void invalidateAdminOperations(queryClient);
    },
    onError: (error) => {
        toast.error(getApiErrorMessage(error, failureMessage));
    },
});

export const useCreateStaff = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.createStaff, 'Staff account created successfully', 'Unable to create staff account');
};

export const useUpdateStaff = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.updateStaff, 'Staff member updated successfully', 'Unable to update staff member');
};

export const useCreateGuest = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.createGuest, 'Guest profile created successfully', 'Unable to create guest profile');
};

export const useUpdateGuest = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.updateGuest, 'Guest profile updated successfully', 'Unable to update guest profile');
};

export const useAdminUpdateUser = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.updateUser, 'Account updated successfully', 'Unable to update account');
};

export const useDeleteAdminUser = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.deleteUser, 'Account deleted successfully', 'Unable to delete account');
};

export const useCreateRoomType = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.createRoomType, 'Room type created successfully', 'Unable to create room type');
};

export const useUpdateRoomType = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.updateRoomType, 'Room type updated successfully', 'Unable to update room type');
};

export const useDeleteRoomType = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.deleteRoomType, 'Room type archived successfully', 'Unable to archive room type');
};

export const useCreateRoom = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.createRoom, 'Room created successfully', 'Unable to create room');
};

export const useUpdateRoom = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.updateRoom, 'Room updated successfully', 'Unable to update room');
};

export const useUpdateRoomStatus = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.updateRoomStatus, 'Room status updated successfully', 'Unable to update room status');
};

export const useDeleteRoom = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.deleteRoom, 'Room archived successfully', 'Unable to archive room');
};

export const useCreateReservation = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.createReservation, 'Reservation created successfully', 'Unable to create reservation');
};

export const useUpdateReservation = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.updateReservation, 'Reservation updated successfully', 'Unable to update reservation');
};

export const useConfirmReservation = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.confirmReservation, 'Reservation confirmed successfully', 'Unable to confirm reservation');
};

export const useAssignReservationRoom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.assignReservationRoom,
        onSuccess: (reservation) => {
            queryClient.setQueriesData({ queryKey: ['admin', 'reservations'] }, (current) => mergeReservationIntoList(current, reservation));
            toast.success('Room assigned successfully');
            void invalidateAdminOperations(queryClient);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to assign room'));
        },
    });
};

export const useAdminCheckInReservation = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.checkInReservation, 'Guest checked in successfully', 'Unable to check in reservation');
};

export const useAdminCheckOutReservation = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.checkOutReservation, 'Guest checked out successfully', 'Unable to check out reservation');
};

export const useCancelReservation = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.cancelReservation, 'Reservation cancelled successfully', 'Unable to cancel reservation');
};

export const useCreateFolioCharge = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.createFolioCharge, 'Charge added successfully', 'Unable to add folio charge');
};

export const useDeleteFolioCharge = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.deleteFolioCharge, 'Charge removed successfully', 'Unable to remove folio charge');
};

export const useGenerateInvoice = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.generateInvoice, 'Invoice generated successfully', 'Unable to generate invoice');
};

export const useFinalizeInvoice = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.finalizeInvoice, 'Invoice finalized successfully', 'Unable to finalize invoice');
};

export const useCreatePayment = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.createPayment, 'Payment recorded successfully', 'Unable to record payment');
};

export const useCreateRole = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.createRole, 'Role created successfully', 'Unable to create role');
};

export const useUpdateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.updateRole,
        onSuccess: async () => {
            toast.success('Role updated successfully');
            void invalidateAdminOperations(queryClient);
            
            try {
                const { authApi } = await import('@/features/auth/api');
                const { useAuthStore } = await import('@/app/store/auth-store');
                const nextUser = await authApi.me();
                useAuthStore.getState().setUser(nextUser);
            } catch (e) {
                console.error('Failed to sync session after role update', e);
            }
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to update role'));
        },
    });
};

export const useDeleteRole = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.deleteRole, 'Role deleted successfully', 'Unable to delete role');
};

export const useAdminStartHousekeepingTask = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.startHousekeepingTask, 'Housekeeping task started successfully', 'Unable to start housekeeping task');
};

export const useAdminCompleteHousekeepingTask = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.completeHousekeepingTask, 'Housekeeping task completed successfully', 'Unable to complete housekeeping task');
};

export const useAdminAssignMaintenanceRequest = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.assignMaintenanceRequest, 'Maintenance request assigned successfully', 'Unable to assign maintenance request');
};

export const useAdminResolveMaintenanceRequest = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.resolveMaintenanceRequest, 'Maintenance request resolved successfully', 'Unable to resolve maintenance request');
};

export const useAdminCloseMaintenanceRequest = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.closeMaintenanceRequest, 'Maintenance request closed successfully', 'Unable to close maintenance request');
};

export const useAdminUpdateServiceRequest = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.updateServiceRequest, 'Service request updated successfully', 'Unable to update service request');
};

export const useAdminPublishFeedback = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.publishFeedback, 'Feedback visibility updated successfully', 'Unable to update feedback visibility');
};

export const useCreateAdminNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.createNotification,
        onSuccess: () => {
            toast.success('Notification created successfully');
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to create notification'));
        },
    });
};

export const useUpdateAdminSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.updateSettings,
        onSuccess: () => {
            toast.success('Hotel settings updated successfully');
            void queryClient.invalidateQueries({ queryKey: adminQueryKeys.settings });
            void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to update hotel settings'));
        },
    });
};

export const useResolveInquiry = () => {
    const queryClient = useQueryClient();
    return buildMutation(queryClient, adminApi.resolveInquiry, 'Inquiry resolved successfully', 'Unable to resolve inquiry');
};

export const useAdminDepartments = () => useQuery({
    queryKey: adminQueryKeys.departments,
    queryFn: adminApi.listDepartments,
});

export const useCreateDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.createDepartment,
        onSuccess: () => {
            toast.success('Department created successfully');
            void queryClient.invalidateQueries({ queryKey: adminQueryKeys.departments });
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to create department'));
        },
    });
};

export const useDeleteDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.deleteDepartment,
        onSuccess: () => {
            toast.success('Department deleted successfully');
            void queryClient.invalidateQueries({ queryKey: adminQueryKeys.departments });
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to delete department'));
        },
    });
};

export const useAdminFaqs = (options = {}) => useQuery({
    queryKey: adminQueryKeys.faqs,
    queryFn: adminApi.listFaqs,
    ...options,
});

export const useAdminCreateFaq = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.createFaq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.faqs });
            toast.success('FAQ created successfully.');
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to create FAQ')),
    });
};

export const useAdminUpdateFaq = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.updateFaq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.faqs });
            toast.success('FAQ updated successfully.');
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update FAQ')),
    });
};

export const useAdminDeleteFaq = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminApi.deleteFaq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.faqs });
            toast.success('FAQ deleted successfully.');
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to delete FAQ')),
    });
};
