import { defaultRolePermissions } from '../../shared/constants/permissions.js';
import { roleRepository } from './role.repository.js';
import { UserModel } from '../users/user.model.js';
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
    createRole: (payload) => {
        return roleRepository.create(payload);
    },
    updateRole: async (roleId, payload) => {
        const role = await roleRepository.findById(roleId);
        if (!role) throw new Error('Role not found');
        
        const isCoreRole = role.name in defaultRolePermissions;
        
        if (isCoreRole) {
            if (payload.name && payload.name !== role.name) {
                throw new Error('Cannot rename a core system role');
            }
            if (payload.isSystemRole === false) {
                throw new Error('Cannot remove the system role designation from a core role');
            }
        }
        
        // Security Lock: Immutable Admin
        if (role.name === 'admin' && payload.permissions) {
            payload.permissions = defaultRolePermissions['admin'];
        }
        
        return roleRepository.updateById(roleId, payload);
    },
    deleteRole: async (roleId) => {
        const role = await roleRepository.findById(roleId);
        if (!role) throw new Error('Role not found');
        if (role.isSystemRole) throw new Error('Cannot delete a system role');
        
        const assignedUsersCount = await UserModel.countDocuments({ role: role.name, deletedAt: null });
        if (assignedUsersCount > 0) {
            throw new Error(`Cannot delete role '${role.name}' because it is assigned to ${assignedUsersCount} user(s). Please reassign them first.`);
        }
        
        return roleRepository.deleteById(roleId);
    },
};
