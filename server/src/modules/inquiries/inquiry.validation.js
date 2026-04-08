import { z } from 'zod';

export const createInquirySchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email address is required'),
    phone: z.union([z.string().min(7), z.literal('')]).optional().nullable(),
    message: z.string().min(10, 'Message should be at least 10 characters').max(2000, 'Message is too long'),
  }),
});
