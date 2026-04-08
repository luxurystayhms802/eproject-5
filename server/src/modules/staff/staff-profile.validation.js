import { z } from 'zod';
import { STAFF_SHIFTS, USER_ROLES, USER_STATUSES } from '../../shared/constants/enums.js';
const staffProfileFields = z.object({
    employeeCode: z.string().trim().min(3).optional(),
    department: z.string().trim().min(2).optional(),
    designation: z.string().trim().min(2).optional(),
    joiningDate: z.coerce.date().optional(),
    shift: z.enum(STAFF_SHIFTS).optional(),
    salary: z.number().min(0).nullable().optional(),
    permissionsOverride: z.array(z.string()).optional(),
    address: z.string().trim().nullable().optional(),
});
export const staffIdParamsSchema = z.object({
    params: z.object({
        staffId: z.string().min(1),
    }),
});
export const listStaffSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
        search: z.string().trim().optional(),
        role: z.string().trim().min(2).optional(),
        department: z.string().trim().min(2).optional(),
        shift: z.enum(STAFF_SHIFTS).optional(),
        status: z.enum(USER_STATUSES).optional(),
    }),
});
export const createStaffSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).max(50),
        lastName: z.string().min(2).max(50),
        email: z.string().email(),
        phone: z.string().min(10),
        password: z.string().min(8),
        role: z.string().trim().min(2).refine((value) => value !== 'guest', {
            message: 'Staff role cannot be guest',
        }),
        status: z.enum(USER_STATUSES).default('active'),
        avatarUrl: z.string().url().nullable().optional(),
        profile: staffProfileFields.extend({
            department: z.string().trim().min(2),
            designation: z.string().trim().min(2),
            joiningDate: z.coerce.date(),
            shift: z.enum(STAFF_SHIFTS),
        }),
    }),
});
export const updateStaffSchema = z.object({
    body: z
        .object({
        firstName: z.string().min(2).max(50).optional(),
        lastName: z.string().min(2).max(50).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(10).optional(),
        password: z.string().min(8).optional(),
        role: z.string().trim().min(2).optional(),
        status: z.enum(USER_STATUSES).optional(),
        avatarUrl: z.string().url().nullable().optional(),
        profile: staffProfileFields.optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
