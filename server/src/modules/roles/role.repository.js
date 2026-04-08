import { defaultRolePermissions } from '../../shared/constants/permissions.js';
import { RoleModel } from './role.model.js';
export const roleRepository = {
    list: () => RoleModel.find({ name: { $ne: 'guest' } }).sort({ name: 1 }).lean(),
    findById: (roleId) => RoleModel.findById(roleId).lean(),
    findByName: (name) => RoleModel.findOne({ name }).lean(),
    create: (payload) => RoleModel.create(payload),
    updateById: (roleId, payload) => RoleModel.findByIdAndUpdate(roleId, payload, { new: true }),
    deleteById: (roleId) => RoleModel.findByIdAndDelete(roleId),
    ensureSystemRoles: async () => {
        const roleNames = Object.keys(defaultRolePermissions);
        for (const roleName of roleNames) {
            await RoleModel.updateOne({ name: roleName }, {
                $setOnInsert: {
                    name: roleName,
                    description: `${roleName.replace('_', ' ')} system role`,
                    isSystemRole: true,
                    permissions: defaultRolePermissions[roleName],
                },
            }, { upsert: true });
        }
    },
};
