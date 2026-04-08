import bcrypt from 'bcryptjs';
import { auditService } from '../audit/audit.service.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { deriveNameParts } from '../../shared/utils/names.js';
import { userRepository } from './user.repository.js';
import { authRepository } from '../auth/auth.repository.js';
const serializeUser = (user) => {
    const names = deriveNameParts(user);
    return {
        id: user._id.toString(),
        firstName: names.firstName,
        lastName: names.lastName,
        fullName: names.fullName,
        email: String(user.email),
        phone: String(user.phone),
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl ?? null,
        emailVerified: Boolean(user.emailVerified),
        forcePasswordReset: Boolean(user.forcePasswordReset),
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt ?? null,
        updatedAt: user.updatedAt ?? null,
    };
};
const ensureEmailAndPhoneAreAvailable = async (payload, currentUserId) => {
    if (payload.email) {
        const existingUser = await userRepository.findByEmail(payload.email);
        if (existingUser && existingUser._id.toString() !== currentUserId) {
            throw new AppError('Email is already registered', 409);
        }
    }
    if (payload.phone) {
        const existingUser = await userRepository.findByPhone(payload.phone);
        if (existingUser && existingUser._id.toString() !== currentUserId) {
            throw new AppError('Phone number is already registered', 409);
        }
    }
};
export const userService = {
    serializeUser,
    async listUsers(query) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (query.role) {
            filter.role = query.role;
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.search) {
            const expression = new RegExp(query.search, 'i');
            filter.$or = [
                { firstName: expression },
                { lastName: expression },
                { fullName: expression },
                { email: expression },
                { phone: expression },
            ];
        }
        const [items, total] = await Promise.all([
            userRepository.list(filter, pagination.skip, pagination.limit),
            userRepository.count(filter),
        ]);
        return {
            items: items.map((user) => serializeUser(user)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getUserById(userId) {
        const user = await userRepository.findLeanById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return serializeUser(user);
    },
    async createUser(payload, context) {
        await ensureEmailAndPhoneAreAvailable(payload);
        const passwordHash = await bcrypt.hash(payload.password, 12);
        const user = await userRepository.create({
            firstName: payload.firstName,
            lastName: payload.lastName,
            fullName: `${payload.firstName} ${payload.lastName}`.trim(),
            email: payload.email.toLowerCase(),
            phone: payload.phone,
            passwordHash,
            role: payload.role,
            status: payload.status,
            forcePasswordReset: context.actorUserId ? true : false,
            avatarUrl: payload.avatarUrl ?? null,
            createdBy: context.actorUserId ?? null,
            updatedBy: context.actorUserId ?? null,
        });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'user.create',
            entityType: 'user',
            entityId: user._id.toString(),
            after: serializeUser(user),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeUser(user);
    },
    async updateUser(userId, payload, context) {
        if (context.actorRole === 'guest' && context.actorUserId !== userId) {
            throw new AppError('You can only update your own account', 403);
        }
        const existingUser = await userRepository.findById(userId);
        if (!existingUser) {
            throw new AppError('User not found', 404);
        }
        await ensureEmailAndPhoneAreAvailable(payload, existingUser._id.toString());
        const updatePayload = {
            updatedBy: context.actorUserId ?? null,
        };
        if (payload.firstName !== undefined)
            updatePayload.firstName = payload.firstName;
        if (payload.lastName !== undefined)
            updatePayload.lastName = payload.lastName;
        if (payload.firstName !== undefined || payload.lastName !== undefined) {
            const nextNames = deriveNameParts({
                firstName: payload.firstName ?? existingUser.firstName,
                lastName: payload.lastName ?? existingUser.lastName,
                email: payload.email ?? existingUser.email,
            });
            updatePayload.fullName = nextNames.fullName;
        }
        if (payload.email !== undefined)
            updatePayload.email = payload.email.toLowerCase();
        if (payload.phone !== undefined)
            updatePayload.phone = payload.phone;
        if (payload.avatarUrl !== undefined)
            updatePayload.avatarUrl = payload.avatarUrl;
        if (payload.emailVerified !== undefined)
            updatePayload.emailVerified = payload.emailVerified;
        if (payload.status !== undefined)
            updatePayload.status = payload.status;
        if (payload.password) {
            updatePayload.passwordHash = await bcrypt.hash(payload.password, 12);
            if (context.actorUserId !== userId) {
                updatePayload.forcePasswordReset = true;
            } else if (context.actorUserId === userId) {
                updatePayload.forcePasswordReset = false;
            }
            // Invalidate all existing sessions when password is changed
            await authRepository.revokeAllSessionsForUser(userId);
        }
        if (payload.role !== undefined && context.allowRoleChange) {
            updatePayload.role = payload.role;
        }
        const updatedUser = await userRepository.updateById(userId, updatePayload);
        if (!updatedUser) {
            throw new AppError('User update failed', 500);
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'user.update',
            entityType: 'user',
            entityId: updatedUser._id.toString(),
            before: serializeUser(existingUser),
            after: serializeUser(updatedUser),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeUser(updatedUser);
    },
    async deleteUser(userId, context) {
        const existingUser = await userRepository.findById(userId);
        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        // Perform hard delete for the user
        await userRepository.deleteById(userId);

        // Also hard delete associated staff and guest profiles
        await import('../staff/staff-profile.model.js').then((m) => m.StaffProfileModel.findOneAndDelete({ userId })).catch(() => {});
        await import('../guests/guest-profile.model.js').then((m) => m.GuestProfileModel.findOneAndDelete({ userId })).catch(() => {});

        await auditService.createLog({
            userId: context.actorUserId,
            action: 'user.delete',
            entityType: 'user',
            entityId: userId,
            before: serializeUser(existingUser),
            after: null,
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return { id: userId };
    },
};
