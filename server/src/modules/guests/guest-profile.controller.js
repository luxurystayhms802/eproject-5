import { sendSuccess } from '../../shared/utils/api-response.js';
import { guestService } from './guest-profile.service.js';
export const guestController = {
    list: async (request, response) => {
        const result = await guestService.listGuests(request.query, {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Guests fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => {
        const guest = await guestService.getGuestById(String(request.params.guestId), {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Guest fetched successfully',
            data: guest,
        });
    },
    create: async (request, response) => {
        const guest = await guestService.createGuest(request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Guest created successfully',
            data: guest,
            statusCode: 201,
        });
    },
    update: async (request, response) => {
        const guest = await guestService.updateGuest(String(request.params.guestId), request.body, {
            actorUserId: request.authUser?.id,
            actorRole: request.authUser.role,
            request,
        });
        return sendSuccess(response, {
            message: 'Guest updated successfully',
            data: guest,
        });
    },
};
