import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
import { DepartmentModel } from '../modules/departments/department.model.js';

const DEFAULT_DEPARTMENTS = [
    { name: 'management', label: 'Management' },
    { name: 'reception', label: 'Reception' },
    { name: 'housekeeping', label: 'Housekeeping' },
    { name: 'maintenance', label: 'Maintenance' },
    { name: 'finance', label: 'Finance' },
    { name: 'admin', label: 'Admin' },
];

export const connectDatabase = async () => {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connection established');

    // Seed default departments if none exist
    const count = await DepartmentModel.countDocuments();
    if (count === 0) {
        await DepartmentModel.insertMany(DEFAULT_DEPARTMENTS);
        logger.info(`Seeded ${DEFAULT_DEPARTMENTS.length} default departments`);
    }
};
