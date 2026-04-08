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
            forcePasswordReset: payload.forcePasswordReset,
        };
        
        // Enforce password reset constraint
        if (payload.forcePasswordReset) {
            const path = request.originalUrl || request.path || '';
            const isMeEndpoint = path.includes('/auth/me');
            const isLogoutEndpoint = path.includes('/auth/logout');
            
            if (!isMeEndpoint && !isLogoutEndpoint) {
                return response.status(403).json({
                    success: false,
                    message: 'Password reset required',
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
