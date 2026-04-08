import { sendSuccess } from '../../shared/utils/api-response.js';
import { notificationsService } from './notification.service.js';
export const notificationController = {
    list: async (request, response) => {
        const result = await notificationsService.listNotifications(request.query, {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Notifications fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    create: async (request, response) => {
        const notification = await notificationsService.createNotification(request.body, {
            actorUserId: request.authUser.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Notification created successfully',
            data: notification,
            statusCode: 201,
        });
    },
    markRead: async (request, response) => {
        const notification = await notificationsService.markRead(String(request.params.notificationId), {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Notification marked as read',
            data: notification,
        });
    },
    markAllRead: async (request, response) => sendSuccess(response, {
        message: 'All notifications marked as read',
        data: await notificationsService.markAllRead({
            id: request.authUser.id,
            role: request.authUser.role,
        }),
    }),
};
