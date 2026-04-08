import { sendSuccess } from '../../shared/utils/api-response.js';
import { serviceRequestService } from './service-request.service.js';
export const serviceRequestController = {
    list: async (request, response) => {
        const result = await serviceRequestService.listRequests(request.query, {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Service requests fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => sendSuccess(response, {
        message: 'Service request fetched successfully',
        data: await serviceRequestService.getById(String(request.params.requestId), {
            id: request.authUser.id,
            role: request.authUser.role,
        }),
    }),
    create: async (request, response) => sendSuccess(response, {
        message: 'Service request created successfully',
        data: await serviceRequestService.createRequest(request.body, {
            actorUserId: request.authUser.id,
            actorRole: request.authUser.role,
            request,
        }),
        statusCode: 201,
    }),
    update: async (request, response) => sendSuccess(response, {
        message: 'Service request updated successfully',
        data: await serviceRequestService.updateRequest(String(request.params.requestId), request.body, {
            actorUserId: request.authUser.id,
            actorRole: request.authUser.role,
            request,
        }),
    }),
};
