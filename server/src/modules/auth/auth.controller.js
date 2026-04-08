import { REFRESH_COOKIE_NAME } from '../../shared/constants/auth.js';
import { sendSuccess } from '../../shared/utils/api-response.js';
import { authService } from './auth.service.js';
export const authController = {
    register: async (request, response) => {
        const user = await authService.registerGuest(request.body);
        return sendSuccess(response, {
            message: 'Guest account created successfully',
            data: user,
            statusCode: 201,
        });
    },
    login: async (request, response) => {
        const result = await authService.login(request.body, {
            ip: request.ip,
            userAgent: request.headers['user-agent'] ?? null,
        });
        authService.setRefreshCookie(response, result.refreshToken);
        return sendSuccess(response, {
            message: 'Logged in successfully',
            data: result.user,
        });
    },
    me: async (request, response) => {
        const user = await authService.getMe(request.authUser.id);
        return sendSuccess(response, {
            message: 'Current user fetched successfully',
            data: user,
        });
    },
    updateMe: async (request, response) => {
        const user = await authService.updateMe(request.authUser.id, request.body, {
            actorRole: request.authUser.role,
            request,
        });
        return sendSuccess(response, {
            message: 'Account updated successfully',
            data: user,
        });
    },
    refresh: async (request, response) => {
        const incomingToken = request.body.refreshToken ?? request.cookies[REFRESH_COOKIE_NAME];
        const result = await authService.refresh(incomingToken);
        authService.setRefreshCookie(response, result.refreshToken);
        return sendSuccess(response, {
            message: 'Session refreshed successfully',
            data: result.user,
        });
    },
    logout: async (request, response) => {
        await authService.logout(request.cookies[REFRESH_COOKIE_NAME] ?? request.body.refreshToken);
        response.clearCookie(REFRESH_COOKIE_NAME);
        return sendSuccess(response, {
            message: 'Logged out successfully',
            data: null,
        });
    },
    forgotPassword: async (request, response) => {
        const result = await authService.forgotPassword(request.body.email);
        return sendSuccess(response, {
            message: 'If the email exists, password reset instructions have been generated',
            data: result,
        });
    },
    resetPassword: async (request, response) => {
        const user = await authService.resetPassword(request.body);
        return sendSuccess(response, {
            message: 'Password reset successfully',
            data: user,
        });
    },
};
