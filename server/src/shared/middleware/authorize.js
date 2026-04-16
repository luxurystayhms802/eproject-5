export const requireRoles = (...roles) => (request, response, next) => {
    if (!request.authUser || !roles.includes(request.authUser.role)) {
        return response.status(403).json({
            success: false,
            message: 'You are not allowed to perform this action',
        });
    }
    return next();
};
export const requirePermissions = (...permissions) => (request, response, next) => {
    if (request.authUser?.role === 'admin') {
        return next();
    }
    const userPermissions = request.authUser?.permissions ?? [];
    const isAllowed = permissions.every((permission) => userPermissions.includes(permission));
    if (!isAllowed) {
        return response.status(403).json({
            success: false,
            message: 'Missing required permissions',
        });
    }
    return next();
};
