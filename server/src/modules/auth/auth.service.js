import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { GuestProfileModel } from '../guests/guest-profile.model.js';
import { StaffProfileModel } from '../staff/staff-profile.model.js';
import { REFRESH_COOKIE_NAME } from '../../shared/constants/auth.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/utils/app-error.js';
import { hashToken } from '../../shared/utils/hash.js';
import { signAccessToken, signRefreshToken, signResetToken, verifyRefreshToken, verifyResetToken } from '../../shared/utils/tokens.js';
import { authRepository } from './auth.repository.js';
import { roleService } from '../roles/role.service.js';
import { userService } from '../users/user.service.js';

const deriveNameParts = (userRecord) => {
    const fullName = userRecord.fullName ??
        userRecord.name ??
        [userRecord.firstName, userRecord.lastName].filter(Boolean).join(' ').trim() ??
        '';
    const trimmedFullName = fullName.trim() || userRecord.email?.split('@')[0] || 'LuxuryStay User';
    const [firstToken = 'Guest', ...restTokens] = trimmedFullName.split(/\s+/);
    return {
        firstName: userRecord.firstName ?? firstToken,
        lastName: userRecord.lastName ?? restTokens.join(' '),
        fullName: trimmedFullName,
    };
};

const serializeUser = (userRecord, employmentStatus = 'active') => {
    const names = deriveNameParts(userRecord);
    return {
        id: userRecord._id.toString(),
        firstName: names.firstName,
        lastName: names.lastName,
        fullName: names.fullName,
        email: userRecord.email,
        role: userRecord.role,
        avatarUrl: userRecord.avatarUrl ?? null,
        employmentStatus,
    };
};

const getStoredPasswordHash = (user, rawUser) => user?.passwordHash ?? rawUser?.passwordHash ?? rawUser?.password;

const setRefreshCookie = (response, refreshToken) => {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const getEmploymentStatus = async (userId) => {
    const profile = await StaffProfileModel.findOne({ userId }).lean();
    return profile?.employmentStatus || 'active';
};

export const authService = {
    async registerGuest(payload) {
        const existingEmail = await authRepository.findUserByEmail(payload.email);
        if (existingEmail) {
            throw new AppError('Email is already registered', 409);
        }
        const existingPhone = await authRepository.findUserByPhone(payload.phone);
        if (existingPhone) {
            throw new AppError('Phone number is already registered', 409);
        }
        const passwordHash = await bcrypt.hash(payload.password, 12);
        const user = await authRepository.createUser({
            ...payload,
            passwordHash,
            role: 'guest',
            status: 'active',
        });
        await GuestProfileModel.create({
            userId: user._id,
        });
        const permissions = await roleService.getPermissionsForRole('guest');
        const accessToken = signAccessToken({ sub: user._id.toString(), role: 'guest', permissions });
        return {
            ...serializeUser(user),
            permissions,
            accessToken,
        };
    },
    async login(payload, context) {
        const user = await authRepository.findUserByEmail(payload.email);
        const rawUser = await authRepository.findUserByEmailRaw(payload.email);
        const activeUser = user ?? rawUser;
        if (!activeUser || activeUser.deletedAt) {
            throw new AppError('Invalid email or password', 401);
        }
        const storedPasswordHash = getStoredPasswordHash(user, rawUser);
        if (!storedPasswordHash) {
            throw new AppError('This account password needs to be reset before login', 400);
        }
        const passwordMatches = await bcrypt.compare(payload.password, storedPasswordHash);
        if (!passwordMatches) {
            throw new AppError('Invalid email or password', 401);
        }
        if ((activeUser.status ?? 'active') !== 'active') {
            throw new AppError('Account is not active', 403);
        }
        const permissions = await roleService.getPermissionsForRole(activeUser.role);
        const employmentStatus = await getEmploymentStatus(activeUser._id);
        const sessionId = randomUUID();
        const accessToken = signAccessToken({ sub: activeUser._id.toString(), role: activeUser.role, permissions, employmentStatus });
        const refreshToken = signRefreshToken({ sub: activeUser._id.toString(), sessionId });
        await authRepository.createSession({
            _id: sessionId,
            userId: activeUser._id,
            tokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deviceInfo: context.userAgent ?? null,
            ip: context.ip ?? null,
        });
        await authRepository.updateUserById(activeUser._id.toString(), {
            lastLoginAt: new Date(),
        });
        return {
            user: {
                ...serializeUser(activeUser, employmentStatus),
                permissions,
                accessToken,
            },
            refreshToken,
        };
    },
    async getMe(userId) {
        const user = await authRepository.findUserById(userId);
        const rawUser = await authRepository.findUserByIdRaw(userId);
        const activeUser = user ?? rawUser;
        if (!activeUser || activeUser.deletedAt) {
            throw new AppError('User not found', 404);
        }
        const permissions = await roleService.getPermissionsForRole(activeUser.role);
        const employmentStatus = await getEmploymentStatus(activeUser._id);
        const accessToken = signAccessToken({ sub: activeUser._id.toString(), role: activeUser.role, permissions, employmentStatus });
        return {
            ...serializeUser(activeUser, employmentStatus),
            permissions,
            accessToken,
        };
    },
    async updateMe(userId, payload, context) {
        const updatedUser = await userService.updateUser(userId, payload, {
            actorUserId: userId,
            actorRole: context.actorRole,
            request: context.request,
            allowRoleChange: false,
        });
        const permissions = await roleService.getPermissionsForRole(updatedUser.role);
        const employmentStatus = await getEmploymentStatus(updatedUser.id);
        const accessToken = signAccessToken({ sub: updatedUser.id, role: updatedUser.role, permissions, employmentStatus });
        return {
            ...updatedUser,
            employmentStatus,
            permissions,
            accessToken,
        };
    },
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new AppError('Refresh token is required', 401);
        }
        const payload = verifyRefreshToken(refreshToken);
        const session = await authRepository.findSessionByTokenHash(hashToken(refreshToken));
        if (!session) {
            throw new AppError('Refresh session is invalid', 401);
        }
        const user = await authRepository.findUserById(payload.sub);
        const rawUser = await authRepository.findUserByIdRaw(payload.sub);
        const activeUser = user ?? rawUser;
        if (!activeUser || activeUser.deletedAt) {
            throw new AppError('User not found', 404);
        }
        const permissions = await roleService.getPermissionsForRole(activeUser.role);
        const employmentStatus = await getEmploymentStatus(activeUser._id);
        const nextSessionId = randomUUID();
        const nextAccessToken = signAccessToken({ sub: activeUser._id.toString(), role: activeUser.role, permissions, employmentStatus });
        const nextRefreshToken = signRefreshToken({ sub: activeUser._id.toString(), sessionId: nextSessionId });
        await authRepository.revokeSession(session._id.toString());
        await authRepository.createSession({
            _id: nextSessionId,
            userId: activeUser._id,
            tokenHash: hashToken(nextRefreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deviceInfo: session.deviceInfo,
            ip: session.ip,
        });
        return {
            user: {
                ...serializeUser(activeUser, employmentStatus),
                permissions,
                accessToken: nextAccessToken,
            },
            refreshToken: nextRefreshToken,
        };
    },
    async logout(refreshToken) {
        if (!refreshToken) {
            return;
        }
        const session = await authRepository.findSessionByTokenHash(hashToken(refreshToken));
        if (session) {
            await authRepository.revokeSession(session._id.toString());
        }
    },
    async forgotPassword(email) {
        const user = await authRepository.findUserByEmail(email);
        if (!user || user.deletedAt) {
            return { resetToken: undefined };
        }
        const resetToken = signResetToken({ sub: user._id.toString() });
        return {
            resetToken: env.NODE_ENV === 'production' ? undefined : resetToken,
        };
    },
    async resetPassword(payload) {
        const tokenPayload = verifyResetToken(payload.token);
        const user = await authRepository.findUserById(tokenPayload.sub);
        if (!user || user.deletedAt) {
            throw new AppError('User not found', 404);
        }
        const passwordHash = await bcrypt.hash(payload.newPassword, 12);
        const updatedUser = await authRepository.updateUserById(user._id.toString(), { passwordHash });
        await authRepository.revokeAllSessionsForUser(user._id.toString());
        const permissions = await roleService.getPermissionsForRole(updatedUser.role);
        const employmentStatus = await getEmploymentStatus(updatedUser._id);
        const accessToken = signAccessToken({ sub: updatedUser._id.toString(), role: updatedUser.role, permissions, employmentStatus });
        return {
            ...serializeUser(updatedUser, employmentStatus),
            permissions,
            accessToken,
        };
    },
    setRefreshCookie,
};
