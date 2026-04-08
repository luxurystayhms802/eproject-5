import { Schema, model } from 'mongoose';
const roleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    permissions: {
        type: [String],
        default: [],
    },
    isSystemRole: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
export const RoleModel = model('Role', roleSchema);
