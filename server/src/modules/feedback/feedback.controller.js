import { sendSuccess } from '../../shared/utils/api-response.js';
import { feedbackService } from './feedback.service.js';
export const feedbackController = {
    listPublished: async (request, response) => {
        const result = await feedbackService.listPublishedFeedback(request.query);
        return sendSuccess(response, {
            message: 'Published feedback fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    list: async (request, response) => {
        const result = await feedbackService.listFeedback(request.query, {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Feedback fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    create: async (request, response) => sendSuccess(response, {
        message: 'Feedback submitted successfully',
        data: await feedbackService.createFeedback(request.body, {
            actorUserId: request.authUser.id,
            actorRole: request.authUser.role,
            request,
        }),
        statusCode: 201,
    }),
    publish: async (request, response) => sendSuccess(response, {
        message: 'Feedback visibility updated successfully',
        data: await feedbackService.publishFeedback(String(request.params.feedbackId), request.body.isPublished ?? true, {
            actorUserId: request.authUser.id,
            request,
        }),
    }),
};
