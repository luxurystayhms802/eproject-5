import { z } from 'zod';
export const listAuditLogsSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
        action: z.string().trim().optional(),
        entityType: z.string().trim().optional(),
        userId: z.string().trim().optional(),
    }),
});
