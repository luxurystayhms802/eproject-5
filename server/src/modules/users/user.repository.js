import { UserModel } from './user.model.js';
export const userRepository = {
    findById: (userId) => UserModel.findOne({ _id: userId, deletedAt: null }),
    findLeanById: (userId) => UserModel.findOne({ _id: userId, deletedAt: null }).lean(),
    findByEmail: (email) => UserModel.findOne({ email: email.toLowerCase(), deletedAt: null }),
    findByPhone: (phone) => UserModel.findOne({ phone, deletedAt: null }),
    list: (filter, skip, limit) => UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    count: (filter) => UserModel.countDocuments(filter),
    create: (payload) => UserModel.create(payload),
    updateById: (userId, payload) => UserModel.findOneAndUpdate({ _id: userId, deletedAt: null }, payload, { new: true, runValidators: true }),
    deleteById: (userId) => UserModel.findByIdAndDelete(userId),
};
