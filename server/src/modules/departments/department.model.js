import { Schema, model } from 'mongoose';

const departmentSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Internal standardized name (e.g. 'front_desk')
    },
    label: {
        type: String, // Display label (e.g. 'Front Desk')
        required: true,
        trim: true,
    }
}, {
    timestamps: true,
});

export const DepartmentModel = model('Department', departmentSchema);
