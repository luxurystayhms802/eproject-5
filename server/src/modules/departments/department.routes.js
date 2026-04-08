import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { listDepartments, createDepartment, deleteDepartment } from './department.controller.js';

export const departmentsRouter = Router();

departmentsRouter.get('/', authenticate, asyncHandler(listDepartments));
departmentsRouter.post('/', authenticate, asyncHandler(createDepartment));
departmentsRouter.delete('/:name', authenticate, asyncHandler(deleteDepartment));
