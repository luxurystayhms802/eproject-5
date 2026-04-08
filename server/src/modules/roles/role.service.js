import { defaultRolePermissions } from '../../shared/constants/permissions.js';
import { roleRepository } from './role.repository.js';
export const roleService = {
    listRoles: () => roleRepository.list(),
    ensureSystemRoles: () => roleRepository.ensureSystemRoles(),
    getPermissionsForRole: async (roleName) => {
        const role = await roleRepository.findByName(roleName);
        if (!role) {
            return defaultRolePermissions[roleName] ?? [];
        }
        return role.permissions ?? [];
    },
    createRole: (payload) => roleRepository.create(payload),
    updateRole: (roleId, payload) => roleRepository.updateById(roleId, payload),
    deleteRole: async (roleId) => {
        const role = await roleRepository.findById(roleId);
        if (!role) throw new Error('Role not found');
        if (role.isSystemRole) throw new Error('Cannot delete a system role');
        return roleRepository.deleteById(roleId);
    },
};
