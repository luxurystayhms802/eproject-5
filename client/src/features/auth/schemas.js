import { z } from 'zod';
const namePattern = /^[A-Za-z][A-Za-z\s'-]{1,48}$/;
const phonePattern = /^\+?[0-9\s-]{10,16}$/;
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character');
export const loginSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});
export const registerSchema = z
    .object({
    firstName: z.string().min(2, 'First name is required').regex(namePattern, 'Enter a valid first name'),
    lastName: z.string().min(2, 'Last name is required').regex(namePattern, 'Enter a valid last name'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().regex(phonePattern, 'Enter a valid phone number'),
    password: passwordSchema,
    confirmPassword: z.string().min(8, 'Confirm your password'),
})
    .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
export const forgotPasswordSchema = z.object({
    email: z.string().email('Enter a valid email address'),
});
export const resetPasswordSchema = z
    .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(8, 'Confirm your password'),
})
    .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
