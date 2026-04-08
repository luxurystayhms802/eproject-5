import { sendSuccess } from '../../shared/utils/api-response.js';
import { roomTypeService } from './room-type.service.js';
export const roomTypeController = {
    list: async (request, response) => {
        const result = await roomTypeService.listRoomTypes(request.query);
        return sendSuccess(response, {
            message: 'Room types fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => {
        const roomType = await roomTypeService.getRoomType(String(request.params.roomTypeId));
        return sendSuccess(response, {
            message: 'Room type fetched successfully',
            data: roomType,
        });
    },
    create: async (request, response) => {
        const roomType = await roomTypeService.createRoomType(request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Room type created successfully',
            data: roomType,
            statusCode: 201,
        });
    },
    update: async (request, response) => {
        const roomType = await roomTypeService.updateRoomType(String(request.params.roomTypeId), request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Room type updated successfully',
            data: roomType,
        });
    },
    remove: async (request, response) => {
        const result = await roomTypeService.deleteRoomType(String(request.params.roomTypeId), {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Room type archived successfully',
            data: result,
        });
    },
};
