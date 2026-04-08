import { StaffProfileModel } from './staff-profile.model.js';
export const staffRepository = {
    findProfileByUserId: (userId) => StaffProfileModel.findOne({ userId, deletedAt: null }),
    findProfileByEmployeeCode: (employeeCode) => StaffProfileModel.findOne({ employeeCode, deletedAt: null }),
    findLeanProfilesByUserIds: (userIds) => StaffProfileModel.find({ userId: { $in: userIds }, deletedAt: null }).lean(),
    upsertProfileByUserId: (userId, payload) => StaffProfileModel.findOneAndUpdate({ userId }, { $set: payload }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }),
};
