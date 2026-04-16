import { Schema, model } from 'mongoose';
import { STAFF_SHIFTS, EMPLOYMENT_STATUSES } from '../../shared/constants/enums.js';
const staffProfileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    employeeCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    department: {
        type: String,
        required: true,
    },
    designation: {
        type: String,
        required: true,
        trim: true,
    },
    joiningDate: {
        type: Date,
        required: true,
    },
    shift: {
        type: String,
        enum: STAFF_SHIFTS,
        required: true,
    },
    salary: {
        type: Number,
        default: null,
    },
    employmentStatus: {
        type: String,
        enum: EMPLOYMENT_STATUSES,
        default: 'active',
    },
    permissionsOverride: {
        type: [String],
        default: [],
    },
    address: {
        type: String,
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
export const StaffProfileModel = model('StaffProfile', staffProfileSchema);
