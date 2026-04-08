import { sendSuccess } from '../../shared/utils/api-response.js';
import { roomService } from './room.service.js';
export const roomController = {
    list: async (request, response) => {
        const result = await roomService.listRooms(request.query);
        return sendSuccess(response, {
            message: 'Rooms fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => {
        const room = await roomService.getRoomById(String(request.params.roomId));
        return sendSuccess(response, {
            message: 'Room fetched successfully',
            data: room,
        });
    },
    create: async (request, response) => {
        const room = await roomService.createRoom(request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Room created successfully',
            data: room,
            statusCode: 201,
        });
    },
    update: async (request, response) => {
        const room = await roomService.updateRoom(String(request.params.roomId), request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Room updated successfully',
            data: room,
        });
    },
    updateStatus: async (request, response) => {
        const room = await roomService.updateRoomStatus(String(request.params.roomId), request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Room status updated successfully',
            data: room,
        });
    },
    remove: async (request, response) => {
        const result = await roomService.deleteRoom(String(request.params.roomId), {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Room archived successfully',
            data: result,
        });
    },
    searchAvailability: async (request, response) => {
        const availability = await roomService.searchAvailability(request.query);
        return sendSuccess(response, {
            message: 'Room availability fetched successfully',
            data: availability,
        });
    },
};
