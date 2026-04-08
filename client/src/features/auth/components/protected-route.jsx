import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { getRoleLandingPath } from './role-landing';
import { ROUTE_PERMISSIONS } from '@/components/layout/sidebar';

export const ProtectedRoute = ({ allowedRoles, allowDynamicRoles = false }) => {
    const { hydrated, user } = useAuthStore();
    const location = useLocation();
    
    if (!hydrated) {
        return <div className="p-10 text-center text-sm text-[var(--muted-foreground)]">Restoring secure session...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
    }
    
    const normalizedPath = location.pathname.replace(/^\/(?:staff|manager|reception|housekeeping|maintenance|guest)\//, '/admin/');
    const requiredPermission = ROUTE_PERMISSIONS[location.pathname] || ROUTE_PERMISSIONS[normalizedPath];
    const hasExplicitPermission = requiredPermission && user.permissions?.includes(requiredPermission);

    if (hasExplicitPermission || location.pathname === '/staff/dashboard') {
        return <Outlet />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={getRoleLandingPath(user.role)} replace/>;
    }
    
    // If the route strictly demands a permission and the user lacks it, bounce them (Native Roles Enforcement)
    if (requiredPermission && !hasExplicitPermission) {
        return <Navigate to={getRoleLandingPath(user.role)} replace/>;
    }

    return <Outlet />;
};
