import { GuestProfileModel } from './guest-profile.model.js';
export const guestRepository = {
    findProfileByUserId: (userId) => GuestProfileModel.findOne({ userId, deletedAt: null }),
    findLeanProfilesByUserIds: (userIds) => GuestProfileModel.find({ userId: { $in: userIds }, deletedAt: null }).lean(),
    upsertProfileByUserId: (userId, payload) => GuestProfileModel.findOneAndUpdate({ userId }, { $set: payload }, { new: true, upsert: true }),
};
