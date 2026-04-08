import { sendSuccess } from '../../shared/utils/api-response.js';
import { userService } from './user.service.js';
export const userController = {
    list: async (request, response) => {
        const result = await userService.listUsers(request.query);
        return sendSuccess(response, {
            message: 'Users fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => {
        const user = await userService.getUserById(String(request.params.userId));
        return sendSuccess(response, {
            message: 'User fetched successfully',
            data: user,
        });
    },
    create: async (request, response) => {
        const user = await userService.createUser(request.body, {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'User created successfully',
            data: user,
            statusCode: 201,
        });
    },
    update: async (request, response) => {
        const user = await userService.updateUser(String(request.params.userId), request.body, {
            actorUserId: request.authUser?.id,
            actorRole: request.authUser?.role,
            request,
            allowRoleChange: request.authUser?.role === 'super_admin',
        });
        return sendSuccess(response, {
            message: 'User updated successfully',
            data: user,
        });
    },
    remove: async (request, response) => {
        const result = await userService.deleteUser(String(request.params.userId), {
            actorUserId: request.authUser?.id,
            request,
        });
        return sendSuccess(response, {
            message: 'User deleted successfully',
            data: result,
        });
    },
};
