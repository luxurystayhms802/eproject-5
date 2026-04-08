import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { notificationsApi } from '@/features/notifications/api';

export const notificationsQueryKeys = {
    all: ['notifications'],
    list: (actorKey = 'anonymous', filters = {}) => [...notificationsQueryKeys.all, actorKey, filters],
};

export const useNotifications = (filters = {}, options = {}) => {
    const actorId = useAuthStore((state) => state.user?.id ?? 'anonymous');
    const actorRole = useAuthStore((state) => state.user?.role ?? 'guest');

    return useQuery({
        queryKey: notificationsQueryKeys.list(`${actorRole}:${actorId}`, filters),
        queryFn: () => notificationsApi.list(filters),
        enabled: Boolean(actorId) && (options.enabled !== undefined ? options.enabled : true),
        ...options,
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all });
        },
    });
};
export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all });
            toast.success('All notifications marked as read');
        },
        onError: () => {
            toast.error('Unable to update notifications');
        },
    });
};
