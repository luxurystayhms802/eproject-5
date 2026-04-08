import { z } from 'zod';
const phonePattern = /^\+?[0-9\s-]{10,16}$/;
const availabilitySearchBaseSchema = z.object({
    checkInDate: z.string().min(1, 'Check-in date is required'),
    checkOutDate: z.string().min(1, 'Check-out date is required'),
    adults: z.coerce.number().min(1),
    children: z.coerce.number().min(0),
});
const getTodayString = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export const availabilitySearchSchema = availabilitySearchBaseSchema
    .refine((value) => new Date(value.checkOutDate).getTime() > new Date(value.checkInDate).getTime(), {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
}).refine((value) => value.checkInDate >= getTodayString(), {
    message: 'Check-in date cannot be in the past',
    path: ['checkInDate'],
});
export const reservationBookingSchema = availabilitySearchBaseSchema
    .extend({
    roomTypeId: z.string().optional(),
    specialRequests: z.string().max(400).optional(),
})
    .refine((value) => new Date(value.checkOutDate).getTime() > new Date(value.checkInDate).getTime(), {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
}).refine((value) => value.checkInDate >= getTodayString(), {
    message: 'Check-in date cannot be in the past',
    path: ['checkInDate'],
});
export const contactInquirySchema = z.object({
    fullName: z.string().trim().min(3, 'Full name is required'),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z.string().trim().regex(/^[0-9]{11}$/, 'Phone number must be exactly 11 digits'),
    message: z.string().trim().min(20, 'Please enter at least 20 characters').max(700, 'Message is too long'),
});
