import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { maintenanceApi } from '@/features/maintenance/api';
import { getApiErrorMessage } from '@/lib/api-error';
export const maintenanceQueryKeys = {
    open: ['maintenance', 'open'],
    history: ['maintenance', 'history'],
};
export const useMaintenanceOpenRequests = () => useQuery({
    queryKey: maintenanceQueryKeys.open,
    queryFn: () => maintenanceApi.listRequests('open,assigned,in_progress'),
});
export const useMaintenanceHistory = () => useQuery({
    queryKey: maintenanceQueryKeys.history,
    queryFn: () => maintenanceApi.listRequests('resolved,closed'),
});
export const useAssignMaintenanceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ requestId, assignedToUserId }) => maintenanceApi.assignRequest(requestId, assignedToUserId),
        onSuccess: () => {
            toast.success('Request assigned');
            queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.open });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to assign request.')),
    });
};
export const useResolveMaintenanceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ requestId, resolutionNotes }) => maintenanceApi.resolveRequest(requestId, resolutionNotes),
        onSuccess: () => {
            toast.success('Request resolved');
            queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.open });
            queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.history });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to resolve request.')),
    });
};
export const useCloseMaintenanceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: maintenanceApi.closeRequest,
        onSuccess: () => {
            toast.success('Request closed');
            queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.open });
            queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.history });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to close request.')),
    });
};
