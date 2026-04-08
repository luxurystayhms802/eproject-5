import { DepartmentModel } from './department.model.js';
import { StaffProfileModel } from '../staff/staff-profile.model.js';

class DepartmentService {
    async listDepartments() {
        return await DepartmentModel.find().sort({ label: 1 });
    }

    async createDepartment(label) {
        if (!label || label.trim() === '') {
            throw Object.assign(new Error('Department label is required'), { statusCode: 400 });
        }
        
        const name = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        
        const exists = await DepartmentModel.findOne({ name });
        if (exists) {
            throw Object.assign(new Error('Department already exists'), { statusCode: 409 });
        }
        
        const newDept = new DepartmentModel({ name, label: label.trim() });
        await newDept.save();
        return newDept;
    }

    async deleteDepartment(name) {
        const staffInUse = await StaffProfileModel.countDocuments({ department: name });
        if (staffInUse > 0) {
            throw Object.assign(new Error(`This department has ${staffInUse} staff assigned. Please reassign them to another department before deleting.`), { statusCode: 400 });
        }
        
        const result = await DepartmentModel.findOneAndDelete({ name });
        if (!result) {
            throw Object.assign(new Error('Department not found'), { statusCode: 404 });
        }
        
        return { success: true };
    }
}

export const departmentService = new DepartmentService();
