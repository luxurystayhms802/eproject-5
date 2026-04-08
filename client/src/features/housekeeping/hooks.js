import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { housekeepingApi } from '@/features/housekeeping/api';
import { getApiErrorMessage } from '@/lib/api-error';
export const housekeepingQueryKeys = {
    tasks: ['housekeeping', 'tasks'],
    board: ['housekeeping', 'board'],
};
export const useHousekeepingTasks = () => useQuery({
    queryKey: housekeepingQueryKeys.tasks,
    queryFn: housekeepingApi.listTasks,
});
export const useHousekeepingBoard = () => useQuery({
    queryKey: housekeepingQueryKeys.board,
    queryFn: housekeepingApi.getBoard,
});
export const useStartHousekeepingTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: housekeepingApi.startTask,
        onSuccess: () => {
            toast.success('Task started');
            queryClient.invalidateQueries({ queryKey: housekeepingQueryKeys.tasks });
            queryClient.invalidateQueries({ queryKey: housekeepingQueryKeys.board });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to start task.')),
    });
};
export const useCompleteHousekeepingTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: housekeepingApi.completeTask,
        onSuccess: () => {
            toast.success('Task completed');
            queryClient.invalidateQueries({ queryKey: housekeepingQueryKeys.tasks });
            queryClient.invalidateQueries({ queryKey: housekeepingQueryKeys.board });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to complete task.')),
    });
};
export const useCreateMaintenanceIssue = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: housekeepingApi.createMaintenanceIssue,
        onSuccess: () => {
            toast.success('Maintenance issue reported');
            queryClient.invalidateQueries({ queryKey: housekeepingQueryKeys.board });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to report maintenance issue.')),
    });
};
export const useHousekeepingServiceRequests = (filters = {}) => useQuery({
    queryKey: ['housekeeping', 'service-requests', filters],
    queryFn: () => housekeepingApi.listServiceRequests(filters),
});
export const useUpdateHousekeepingServiceRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ requestId, payload }) => housekeepingApi.updateServiceRequest(requestId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['housekeeping', 'service-requests'] });
            toast.success('Service request updated successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to update service request.'));
        },
    });
};
