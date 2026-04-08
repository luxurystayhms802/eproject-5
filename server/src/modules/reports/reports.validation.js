import { z } from 'zod';
export const reportsQuerySchema = z.object({
    query: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        report: z.string().trim().optional(),
    }),
});
