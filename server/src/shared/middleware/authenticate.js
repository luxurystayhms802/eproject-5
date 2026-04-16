import { verifyAccessToken } from '../utils/tokens.js';
export const authenticate = (request, response, next) => {
    const authHeader = request.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    if (!bearerToken) {
        return response.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }
    try {
        const payload = verifyAccessToken(bearerToken);
        request.authUser = {
            id: payload.sub,
            role: payload.role,
            permissions: payload.permissions,
        };
        


        // Enforce employment suspension constraint
        if (payload.employmentStatus === 'suspended' && request.method !== 'GET') {
            const path = request.originalUrl || request.path || '';
            const isLogoutEndpoint = path.includes('/auth/logout');

            if (!isLogoutEndpoint) {
                return response.status(403).json({
                    success: false,
                    message: 'Your account is currently suspended. You cannot perform any actions. Please contact an administrator.',
                });
            }
        }
        
        return next();
    }
    catch {
        return response.status(401).json({
            success: false,
            message: 'Invalid or expired access token',
        });
    }
};
