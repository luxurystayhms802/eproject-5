import { z } from 'zod';
import { allPermissions } from '../../shared/constants/permissions.js';
export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        description: z.string().min(3),
        permissions: z.array(z.enum(allPermissions)).default([]),
        isSystemRole: z.boolean().optional(),
    }),
});
export const updateRoleSchema = z.object({
    body: z.object({
        description: z.string().min(3).optional(),
        permissions: z.array(z.enum(allPermissions)).optional(),
        isSystemRole: z.boolean().optional(),
    }),
    params: z.object({
        roleId: z.string().min(1),
    }),
});
