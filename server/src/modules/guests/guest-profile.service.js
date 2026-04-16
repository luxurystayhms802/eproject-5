import { ReservationModel } from '../reservations/reservation.model.js';
import { userService } from '../users/user.service.js';
import { UserModel } from '../users/user.model.js';
import { auditService } from '../audit/audit.service.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { deriveNameParts } from '../../shared/utils/names.js';
import { guestRepository } from './guest-profile.repository.js';
const buildGuestRecord = (user, profile, reservationCount = 0) => {
    const names = deriveNameParts(user);
    return {
        id: user._id.toString(),
        firstName: names.firstName,
        lastName: names.lastName,
        fullName: names.fullName,
        email: String(user.email),
        phone: String(user.phone),
        status: user.status ?? 'active',
        avatarUrl: user.avatarUrl ?? null,
        nationality: profile?.nationality ?? '',
        idType: profile?.idType ?? null,
        idNumber: profile?.idNumber ?? '',
        city: profile?.city ?? '',
        country: profile?.country ?? '',
        reservationCount,
        profile: profile ?? null,
        createdAt: user.createdAt ?? null,
        updatedAt: user.updatedAt ?? null,
    };
};
const getReservationCounts = async (userIds) => {
    const counts = await ReservationModel.aggregate([
        {
            $match: {
                guestUserId: { $in: userIds },
                deletedAt: null,
            },
        },
        {
            $group: {
                _id: '$guestUserId',
                count: { $sum: 1 },
            },
        },
    ]);
    return new Map(counts.map((item) => [String(item._id), Number(item.count)]));
};
export const guestService = {
    async listGuests(query, actor) {
        const pagination = getPagination(query);
        const userFilter = { role: 'guest', deletedAt: null };
        if (actor.role === 'guest') {
            userFilter._id = actor.id;
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
        if (query.status) {
            userFilter.status = query.status;
        }
        const [users, total] = await Promise.all([
            UserModel.find(userFilter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
            UserModel.countDocuments(userFilter),
        ]);
        const userIds = users.map((user) => user._id);
        const [profiles, reservationCounts] = await Promise.all([
            guestRepository.findLeanProfilesByUserIds(userIds),
            getReservationCounts(userIds),
        ]);
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        const filteredItems = users
            .map((user) => buildGuestRecord(user, profileMap.get(String(user._id)), reservationCounts.get(String(user._id)) ?? 0))
            .filter((item) => !query.nationality || item.nationality === query.nationality);
        return {
            items: filteredItems,
            meta: buildPaginationMeta(pagination, actor.role === 'guest' ? filteredItems.length : total),
        };
    },
    async getGuestById(guestId, actor) {
        if (actor.role === 'guest' && actor.id !== guestId) {
            throw new AppError('You can only view your own guest profile', 403);
        }
        const user = await UserModel.findOne({ _id: guestId, role: 'guest', deletedAt: null }).lean();
        if (!user) {
            throw new AppError('Guest not found', 404);
        }
        const [profile, reservationCount] = await Promise.all([
            guestRepository.findProfileByUserId(guestId),
            ReservationModel.countDocuments({ guestUserId: guestId, deletedAt: null }),
        ]);
        return buildGuestRecord(user, (profile?.toObject?.() ?? profile), reservationCount);
    },
    async createGuest(payload, context) {
        const user = await userService.createUser({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            password: payload.password,
            role: 'guest',
            status: payload.status ?? 'active',
            avatarUrl: payload.avatarUrl ?? null,
        }, context);
        const profile = await guestRepository.upsertProfileByUserId(user.id, {
            userId: user.id,
            ...(payload.profile ?? {}),
        });
        return buildGuestRecord({
            _id: { toString: () => user.id },
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            status: user.status,
            avatarUrl: user.avatarUrl,
        }, profile.toObject(), 0);
    },
    async updateGuest(guestId, payload, context) {
        if (context.actorRole === 'guest' && context.actorUserId !== guestId) {
            throw new AppError('You can only update your own guest profile', 403);
        }
        const existingUser = await UserModel.findOne({ _id: guestId, role: 'guest', deletedAt: null }).lean();
        if (!existingUser) {
            throw new AppError('Guest not found', 404);
        }
        const existingProfile = await guestRepository.findProfileByUserId(guestId);
        const updatedUser = await userService.updateUser(guestId, {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            currentPassword: payload.currentPassword,
            password: payload.password,
            avatarUrl: payload.avatarUrl,
            status: payload.status ?? existingUser.status ?? 'active',
        }, {
            actorUserId: context.actorUserId,
            actorRole: context.actorRole,
            request: context.request,
            allowRoleChange: false,
        });
        const profile = await guestRepository.upsertProfileByUserId(guestId, {
            userId: guestId,
            ...(payload.profile ?? {}),
        });
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'guest.update',
            entityType: 'guest',
            entityId: guestId,
            before: buildGuestRecord(existingUser, (existingProfile?.toObject?.() ?? existingProfile), 0),
            after: buildGuestRecord({
                _id: { toString: () => updatedUser.id },
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                status: updatedUser.status,
                avatarUrl: updatedUser.avatarUrl,
            }, profile.toObject(), 0),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return this.getGuestById(guestId, {
            id: context.actorUserId ?? guestId,
            role: context.actorRole,
        });
    },
};
