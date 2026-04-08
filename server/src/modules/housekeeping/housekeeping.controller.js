import { sendSuccess } from '../../shared/utils/api-response.js';
import { housekeepingService } from './housekeeping.service.js';
export const housekeepingController = {
    listTasks: async (request, response) => {
        const result = await housekeepingService.listTasks(request.query, {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Housekeeping tasks fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getTaskById: async (request, response) => sendSuccess(response, {
        message: 'Housekeeping task fetched successfully',
        data: await housekeepingService.getTaskById(String(request.params.taskId), {
            id: request.authUser.id,
            role: request.authUser.role,
        }),
    }),
    getBoard: async (request, response) => sendSuccess(response, {
        message: 'Housekeeping board fetched successfully',
        data: await housekeepingService.getBoard({
            id: request.authUser.id,
            role: request.authUser.role,
        }),
    }),
    startTask: async (request, response) => {
        const task = await housekeepingService.startTask(String(request.params.taskId), {
            actorUserId: request.authUser.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Housekeeping task started successfully',
            data: task,
        });
    },
    completeTask: async (request, response) => {
        const task = await housekeepingService.completeTask(String(request.params.taskId), {
            actorUserId: request.authUser.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Housekeeping task completed successfully',
            data: task,
        });
    },
};
