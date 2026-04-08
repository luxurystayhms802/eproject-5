import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/features/manager/api';
const normalizeRangeKey = (params = {}) => ({
    from: params?.from ?? '',
    to: params?.to ?? '',
});
export const managerQueryKeys = {
    dashboard: ['manager', 'dashboard'],
    occupancy: ['manager', 'occupancy'],
    revenue: ['manager', 'revenue'],
    reservations: ['manager', 'reservations'],
    housekeeping: ['manager', 'housekeeping'],
    maintenance: ['manager', 'maintenance'],
    feedback: ['manager', 'feedback'],
};
export const useManagerDashboard = (params = {}) => useQuery({
    queryKey: [...managerQueryKeys.dashboard, normalizeRangeKey(params)],
    queryFn: () => managerApi.getDashboard(params),
});
export const useManagerOccupancy = (params = {}) => useQuery({
    queryKey: [...managerQueryKeys.occupancy, normalizeRangeKey(params)],
    queryFn: () => managerApi.getOccupancy(params),
});
export const useManagerRevenue = (params = {}) => useQuery({
    queryKey: [...managerQueryKeys.revenue, normalizeRangeKey(params)],
    queryFn: () => managerApi.getRevenue(params),
});
export const useManagerReservations = (params = {}) => useQuery({
    queryKey: [...managerQueryKeys.reservations, normalizeRangeKey(params)],
    queryFn: () => managerApi.getReservations(params),
});
export const useManagerHousekeeping = (params = {}) => useQuery({
    queryKey: [...managerQueryKeys.housekeeping, normalizeRangeKey(params)],
    queryFn: () => managerApi.getHousekeeping(params),
});
export const useManagerMaintenance = (params = {}) => useQuery({
    queryKey: [...managerQueryKeys.maintenance, normalizeRangeKey(params)],
    queryFn: () => managerApi.getMaintenance(params),
});
export const useManagerFeedback = (params = {}) => useQuery({
    queryKey: [...managerQueryKeys.feedback, normalizeRangeKey(params)],
    queryFn: () => managerApi.getFeedback(params),
});
