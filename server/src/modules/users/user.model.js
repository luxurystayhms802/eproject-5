import { Schema, model } from 'mongoose';
import { USER_ROLES, USER_STATUSES } from '../../shared/constants/enums.js';
const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        default: 'guest',
    },
    status: {
        type: String,
        enum: USER_STATUSES,
        required: true,
        default: 'active',
    },
    avatarUrl: {
        type: String,
        default: null,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    forcePasswordReset: {
        type: Boolean,
        default: false,
    },
    lastLoginAt: {
        type: Date,
        default: null,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
userSchema.pre('validate', function updateFullName(next) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
    next();
});
userSchema.index({ role: 1, status: 1 });
export const UserModel = model('User', userSchema);
