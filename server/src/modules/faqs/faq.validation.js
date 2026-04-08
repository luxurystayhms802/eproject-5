import { z } from 'zod';

export const createFaqSchema = z.object({
  body: z.object({
    question: z.string().min(3, 'Question must be at least 3 characters'),
    answer: z.string().min(5, 'Answer must be at least 5 characters'),
    isActive: z.boolean().optional().default(true),
    order: z.number().int().min(0).optional().default(0),
  }),
});

export const updateFaqSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid FAQ ID'),
  }),
  body: z.object({
    question: z.string().min(3, 'Question must be at least 3 characters').optional(),
    answer: z.string().min(5, 'Answer must be at least 5 characters').optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const getFaqSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid FAQ ID'),
  }),
});
