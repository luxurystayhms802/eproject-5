import { UserModel } from '../users/user.model.js';
import { userService } from '../users/user.service.js';
import { auditService } from '../audit/audit.service.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { deriveNameParts } from '../../shared/utils/names.js';
import { staffRepository } from './staff-profile.repository.js';
const generateEmployeeCode = (department) => `EMP-${department.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
const generateUniqueEmployeeCode = async (department) => {
    const safeDepartment = department || 'management';
    for (let attempt = 0; attempt < 25; attempt += 1) {
        const employeeCode = generateEmployeeCode(safeDepartment);
        const existingProfile = await staffRepository.findProfileByEmployeeCode(employeeCode);
        if (!existingProfile) {
            return employeeCode;
        }
    }
    throw new AppError('Unable to generate a unique employee code right now. Please try again.', 500);
};
const buildStaffRecord = (user, profile) => {
    const names = deriveNameParts(user);
    return {
        id: user._id.toString(),
        employeeCode: profile?.employeeCode ?? '',
        firstName: names.firstName,
        lastName: names.lastName,
        fullName: names.fullName,
        email: String(user.email),
        phone: String(user.phone),
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl ?? null,
        department: profile?.department ?? null,
        designation: profile?.designation ?? '',
        joiningDate: profile?.joiningDate ?? null,
        shift: profile?.shift ?? null,
        salary: profile?.salary ?? null,
        permissionsOverride: profile?.permissionsOverride ?? [],
        address: profile?.address ?? null,
        profile: profile ?? null,
        createdAt: user.createdAt ?? null,
        updatedAt: user.updatedAt ?? null,
    };
};
export const staffService = {
    async listStaff(query) {
        const pagination = getPagination(query);
        const userFilter = {
            role: { $ne: 'guest' },
            deletedAt: null,
        };
        if (query.role) {
            userFilter.role = query.role;
        }
        if (query.status) {
            userFilter.status = query.status;
        }
        if (query.search) {
            const expression = new RegExp(query.search, 'i');
            userFilter.$or = [
                { firstName: expression },
                { lastName: expression },
                { fullName: expression },
                { email: expression },
                { phone: expression },
            ];
        }
        const [users, total] = await Promise.all([
            UserModel.find(userFilter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
            UserModel.countDocuments(userFilter),
        ]);
        const profiles = await staffRepository.findLeanProfilesByUserIds(users.map((user) => user._id));
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        const items = users
            .map((user) => buildStaffRecord(user, profileMap.get(String(user._id))))
            .filter((item) => (!query.department || item.department === query.department) && (!query.shift || item.shift === query.shift));
        return {
            items,
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getStaffById(staffId) {
        const user = await UserModel.findOne({ _id: staffId, role: { $ne: 'guest' }, deletedAt: null }).lean();
        if (!user) {
            throw new AppError('Staff member not found', 404);
        }
        const profile = await staffRepository.findProfileByUserId(staffId);
        return buildStaffRecord(user, (profile?.toObject?.() ?? profile));
    },
    async createStaff(payload, context) {
        const user = await userService.createUser({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            password: payload.password,
            role: payload.role,
            status: payload.status,
            avatarUrl: payload.avatarUrl ?? null,
        }, context);
        const employeeCode = payload.profile.employeeCode?.trim() || (await generateUniqueEmployeeCode(payload.profile.department));
        const profile = await staffRepository.upsertProfileByUserId(user.id, {
            userId: user.id,
            ...payload.profile,
            employeeCode,
        });
        return buildStaffRecord({
            _id: { toString: () => user.id },
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            avatarUrl: user.avatarUrl,
        }, profile.toObject());
    },
    async updateStaff(staffId, payload, context) {
        const existingUser = await UserModel.findOne({ _id: staffId, role: { $ne: 'guest' }, deletedAt: null }).lean();
        if (!existingUser) {
            throw new AppError('Staff member not found', 404);
        }
        const existingProfile = await staffRepository.findProfileByUserId(staffId);
        const updatedUser = await userService.updateUser(staffId, {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            password: payload.password,
            role: payload.role,
            status: payload.status,
            avatarUrl: payload.avatarUrl,
        }, {
            actorUserId: context.actorUserId,
            actorRole: 'admin',
            request: context.request,
            allowRoleChange: true,
        });
        const nextProfile = payload.profile ?? {};
        let profile = existingProfile;
        if (existingProfile || Object.keys(nextProfile).length > 0) {
            const employeeCode = nextProfile.employeeCode?.trim()
                || existingProfile?.employeeCode
                || (await generateUniqueEmployeeCode(nextProfile.department ?? existingProfile?.department ?? 'management'));
            profile = await staffRepository.upsertProfileByUserId(staffId, {
                userId: staffId,
                ...nextProfile,
                employeeCode,
            });
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'staff.update',
            entityType: 'staff',
            entityId: staffId,
            before: buildStaffRecord(existingUser, (existingProfile?.toObject?.() ?? existingProfile)),
            after: buildStaffRecord({
                _id: { toString: () => updatedUser.id },
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                status: updatedUser.status,
                avatarUrl: updatedUser.avatarUrl,
            }, (profile?.toObject?.() ?? profile)),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return this.getStaffById(staffId);
    },
};
