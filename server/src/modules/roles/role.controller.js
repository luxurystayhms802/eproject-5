import { sendSuccess } from '../../shared/utils/api-response.js';
import { roleService } from './role.service.js';
export const roleController = {
    listRoles: async (_request, response) => {
        const roles = await roleService.listRoles();
        return sendSuccess(response, {
            message: 'Roles fetched successfully',
            data: roles,
        });
    },
    createRole: async (request, response) => {
        const role = await roleService.createRole(request.body);
        return sendSuccess(response, {
            message: 'Role created successfully',
            data: role,
            statusCode: 201,
        });
    },
    updateRole: async (request, response) => {
        const role = await roleService.updateRole(String(request.params.roleId), request.body);
        return sendSuccess(response, {
            message: 'Role updated successfully',
            data: role,
        });
    },
    deleteRole: async (request, response) => {
        await roleService.deleteRole(String(request.params.roleId));
        return sendSuccess(response, {
            message: 'Role deleted successfully',
        });
    },
};
