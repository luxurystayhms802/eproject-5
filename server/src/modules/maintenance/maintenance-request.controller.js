import { sendSuccess } from '../../shared/utils/api-response.js';
import { maintenanceRequestService } from './maintenance-request.service.js';
export const maintenanceRequestController = {
    list: async (request, response) => {
        const result = await maintenanceRequestService.listRequests(request.query, {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Maintenance requests fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => sendSuccess(response, {
        message: 'Maintenance request fetched successfully',
        data: await maintenanceRequestService.getById(String(request.params.requestId)),
    }),
    create: async (request, response) => sendSuccess(response, {
        message: 'Maintenance request created successfully',
        data: await maintenanceRequestService.createRequest(request.body, {
            actorUserId: request.authUser.id,
            request,
        }),
        statusCode: 201,
    }),
    update: async (request, response) => sendSuccess(response, {
        message: 'Maintenance request updated successfully',
        data: await maintenanceRequestService.updateRequest(String(request.params.requestId), request.body, {
            actorUserId: request.authUser.id,
            request,
        }),
    }),
    assign: async (request, response) => sendSuccess(response, {
        message: 'Maintenance request assigned successfully',
        data: await maintenanceRequestService.assignRequest(String(request.params.requestId), request.body.assignedToUserId, {
            actorUserId: request.authUser.id,
            request,
        }),
    }),
    resolve: async (request, response) => sendSuccess(response, {
        message: 'Maintenance request resolved successfully',
        data: await maintenanceRequestService.resolveRequest(String(request.params.requestId), request.body.resolutionNotes, {
            actorUserId: request.authUser.id,
            request,
        }),
    }),
    close: async (request, response) => sendSuccess(response, {
        message: 'Maintenance request closed successfully',
        data: await maintenanceRequestService.closeRequest(String(request.params.requestId), {
            actorUserId: request.authUser.id,
            request,
        }),
    }),
};
