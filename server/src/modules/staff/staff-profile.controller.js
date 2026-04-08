import { sendSuccess } from '../../shared/utils/api-response.js';
import { staffService } from './staff-profile.service.js';
export const staffController = {
    list: async (request, response) => {
        const result = await staffService.listStaff(request.query);
        return sendSuccess(response, {
            message: 'Staff members fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => {
        const staff = await staffService.getStaffById(String(request.params.staffId));
        return sendSuccess(response, {
            message: 'Staff member fetched successfully',
            data: staff,
        });
    },
    create: async (request, response) => {
        const staff = await staffService.createStaff(request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Staff member created successfully',
            data: staff,
            statusCode: 201,
        });
    },
    update: async (request, response) => {
        const staff = await staffService.updateStaff(String(request.params.staffId), request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Staff member updated successfully',
            data: staff,
        });
    },
};
