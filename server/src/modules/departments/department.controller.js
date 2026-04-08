import { departmentService } from './department.service.js';

export const listDepartments = async (req, res, next) => {
    try {
        const departments = await departmentService.listDepartments();
        res.status(200).json({
            success: true,
            data: departments,
        });
    } catch (error) {
        next(error);
    }
};

export const createDepartment = async (req, res, next) => {
    try {
        const { label } = req.body;
        const department = await departmentService.createDepartment(label);
        res.status(201).json({
            success: true,
            data: department,
            message: 'Department created successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const deleteDepartment = async (req, res, next) => {
    try {
        const { name } = req.params;
        await departmentService.deleteDepartment(name);
        res.status(200).json({
            success: true,
            message: 'Department deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
