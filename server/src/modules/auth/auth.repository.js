import mongoose from 'mongoose';
import { SessionModel } from './session.model.js';
import { UserModel } from '../users/user.model.js';

export const authRepository = {
    findUserByEmail: (email) => UserModel.findOne({ email: email.toLowerCase(), deletedAt: null }),
    findUserByEmailRaw: (email) => UserModel.collection.findOne({ email: email.toLowerCase(), deletedAt: null }),
    findUserByPhone: (phone) => UserModel.findOne({ phone, deletedAt: null }),
    findUserById: (userId) => UserModel.findById(userId),
    findUserByIdRaw: (userId) => UserModel.collection.findOne({ _id: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId }),
    createUser: (payload) => UserModel.create(payload),
    updateUserById: (userId, payload) => UserModel.findByIdAndUpdate(userId, payload, { new: true }),
    createSession: (payload) => SessionModel.create(payload),
    findSessionByTokenHash: (tokenHash) => SessionModel.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } }),
    revokeSession: (sessionId) => SessionModel.findByIdAndUpdate(sessionId, { revokedAt: new Date() }, { new: true }),
    revokeAllSessionsForUser: (userId) => SessionModel.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() }),
};
