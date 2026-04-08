const roleMap = {
    super_admin: '/admin/dashboard',
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    receptionist: '/reception/dashboard',
    housekeeping: '/housekeeping/dashboard',
    maintenance: '/maintenance/dashboard',
    guest: '/guest/dashboard',
};
export const getRoleLandingPath = (role) => roleMap[role] || `/staff/dashboard`;
