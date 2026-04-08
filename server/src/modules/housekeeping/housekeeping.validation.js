import { z } from 'zod';
import { HOUSEKEEPING_TASK_STATUSES, HOUSEKEEPING_TASK_TYPES, PRIORITIES } from '../../shared/constants/enums.js';
export const housekeepingTaskIdParamsSchema = z.object({
    params: z.object({
        taskId: z.string().min(1),
    }),
});
export const listHousekeepingTasksSchema = z.object({
    query: z.object({
        status: z.enum(HOUSEKEEPING_TASK_STATUSES).optional(),
        taskType: z.enum(HOUSEKEEPING_TASK_TYPES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        assignedToUserId: z.string().trim().optional(),
        reservationId: z.string().trim().optional(),
        roomId: z.string().trim().optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
    }),
});
