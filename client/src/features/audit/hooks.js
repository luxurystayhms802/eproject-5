import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/features/audit/api';
export const auditQueryKeys = {
    list: ['audit-logs'],
};
export const useAuditLogs = (options = {}) => useQuery({
    queryKey: auditQueryKeys.list,
    queryFn: auditApi.list,
    ...options,
});
