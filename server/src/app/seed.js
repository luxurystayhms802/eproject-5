import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { logger } from '../config/logger.js';
import { roleService } from '../modules/roles/role.service.js';
import { UserModel } from '../modules/users/user.model.js';
import { GuestProfileModel } from '../modules/guests/guest-profile.model.js';
import { StaffProfileModel } from '../modules/staff/staff-profile.model.js';
import { RoomTypeModel } from '../modules/room-types/room-type.model.js';
import { RoomModel } from '../modules/rooms/room.model.js';
import { ReservationModel } from '../modules/reservations/reservation.model.js';
import { SettingModel } from '../modules/settings/setting.model.js';
import { FolioChargeModel } from '../modules/billing/models/folio-charge.model.js';
import { InvoiceModel } from '../modules/billing/models/invoice.model.js';
import { PaymentModel } from '../modules/billing/models/payment.model.js';
import { FaqModel } from '../modules/faqs/faq.model.js';
import { FeedbackModel } from '../modules/feedback/feedback.model.js';
import { HousekeepingTaskModel } from '../modules/housekeeping/housekeeping-task.model.js';
import { MaintenanceRequestModel } from '../modules/maintenance/maintenance-request.model.js';
import { NotificationModel } from '../modules/notifications/notification.model.js';
import { ServiceRequestModel } from '../modules/services/service-request.model.js';
const daysFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};
const upsertUser = async (payload) => {
    const passwordHash = await bcrypt.hash(payload.password || 'Password123!', 12);
    return UserModel.findOneAndUpdate({ email: payload.email }, {
        $set: {
            ...payload,
            fullName: `${payload.firstName} ${payload.lastName}`,
            passwordHash,
            status: payload.status ?? 'active',
            emailVerified: true,
        },
    }, { new: true, upsert: true });
};
const seedFaqs = async () => {
    const faqs = [
        {
          question: 'Can I reserve a room without immediate assignment?',
          answer: 'Yes. Reservations can begin with a room category first, while an exact room can be confirmed closer to arrival if needed.',
          order: 1,
        },
        {
          question: 'Are room prices and availability shown live?',
          answer: 'Yes. Rates and availability are kept current so guests can browse room categories and book with confidence.',
          order: 2,
        },
        {
          question: 'Can I manage my stay after booking?',
          answer: 'Guest accounts provide access to reservations, invoices, service requests, notifications, and post-stay feedback after sign-in.',
          order: 3,
        },
        {
          question: 'How are extra charges reflected?',
          answer: 'Any approved folio charges such as laundry, dining, or additional services flow into invoice totals and appear in the guest stay history.',
          order: 4,
        },
    ];
    await FaqModel.deleteMany({});
    await FaqModel.insertMany(faqs);
};
const runSeed = async () => {
    await connectDatabase();
    await roleService.ensureSystemRoles();
    await seedFaqs();
    const [superAdmin, admin, manager, receptionist, housekeeping, maintenance, guestOne, guestTwo] = await Promise.all([
        upsertUser({ firstName: 'Super', lastName: 'Admin', email: 'superadmin@luxurystay.com', phone: '03000000001', role: 'admin' }),
        upsertUser({ firstName: 'System', lastName: 'Admin', email: 'admin@luxurystay.com', phone: '03000000002', role: 'admin', password: 'password123' }),
        upsertUser({ firstName: 'General', lastName: 'Manager', email: 'manager@luxurystay.com', phone: '03000000003', role: 'manager', password: 'Password123' }),
        upsertUser({ firstName: 'Front', lastName: 'Desk', email: 'reception@luxurystay.com', phone: '03000000004', role: 'receptionist' }),
        upsertUser({ firstName: 'House', lastName: 'Keeping', email: 'housekeeping@luxurystay.com', phone: '03000000005', role: 'housekeeping' }),
        upsertUser({ firstName: 'Main', lastName: 'Tenance', email: 'maintenance@luxurystay.com', phone: '03000000006', role: 'maintenance' }),
        upsertUser({ firstName: 'Sara', lastName: 'Guest', email: 'guest1@example.com', phone: '03000000007', role: 'guest' }),
        upsertUser({ firstName: 'Ali', lastName: 'Guest', email: 'guest2@example.com', phone: '03000000008', role: 'guest' }),
    ]);
    await Promise.all([
        GuestProfileModel.findOneAndUpdate({ userId: guestOne._id }, {
            $set: {
                userId: guestOne._id,
                nationality: 'Pakistani',
                city: 'Karachi',
                country: 'Pakistan',
                idType: 'cnic',
                idNumber: '42101-1234567-1',
            },
        }, { new: true, upsert: true }),
        GuestProfileModel.findOneAndUpdate({ userId: guestTwo._id }, {
            $set: {
                userId: guestTwo._id,
                nationality: 'Pakistani',
                city: 'Lahore',
                country: 'Pakistan',
                idType: 'passport',
                idNumber: 'PK0099887',
            },
        }, { new: true, upsert: true }),
        StaffProfileModel.findOneAndUpdate({ userId: receptionist._id }, {
            $set: {
                userId: receptionist._id,
                employeeCode: 'EMP-REC-001',
                department: 'reception',
                designation: 'Front Desk Executive',
                joiningDate: daysFromNow(-300),
                shift: 'morning',
            },
        }, { new: true, upsert: true }),
        StaffProfileModel.findOneAndUpdate({ userId: housekeeping._id }, {
            $set: {
                userId: housekeeping._id,
                employeeCode: 'EMP-HK-001',
                department: 'housekeeping',
                designation: 'Housekeeping Attendant',
                joiningDate: daysFromNow(-240),
                shift: 'rotational',
            },
        }, { new: true, upsert: true }),
        StaffProfileModel.findOneAndUpdate({ userId: maintenance._id }, {
            $set: {
                userId: maintenance._id,
                employeeCode: 'EMP-MN-001',
                department: 'maintenance',
                designation: 'Facility Technician',
                joiningDate: daysFromNow(-200),
                shift: 'evening',
            },
        }, { new: true, upsert: true }),
    ]);
    await SettingModel.findOneAndUpdate({}, {
        $set: {
            hotelName: 'LuxuryStay Downtown',
            brandName: 'LuxuryStay Hospitality',
            contactEmail: 'hello@luxurystay.com',
            contactPhone: '+92-300-0000000',
            address: 'Luxury Avenue, Clifton, Karachi',
            currency: 'PKR',
            timezone: 'Asia/Karachi',
            taxRules: [{ name: 'Hotel Tax', percentage: 13, appliesTo: 'room_nights' }],
            checkInTime: '14:00',
            checkOutTime: '12:00',
            cancellationPolicy: 'Free cancellation up to 24 hours before arrival.',
            invoiceTerms: 'Payments are due upon checkout unless corporate billing is approved.',
            themeSettings: {
                primaryColor: '#10243f',
                accentColor: '#b88c4a',
                darkModeEnabled: true,
            },
            updatedBy: admin._id,
        },
    }, { new: true, upsert: true });
    const roomTypes = await Promise.all([
        RoomTypeModel.findOneAndUpdate({ slug: 'standard-room' }, {
            $set: {
                name: 'Standard Room',
                slug: 'standard-room',
                shortDescription: 'Warm, efficient, and refined for short stays.',
                description: 'A polished premium standard room designed for comfort, clean aesthetics, and business-ready hospitality.',
                basePrice: 140,
                maxAdults: 2,
                maxChildren: 1,
                bedCount: 1,
                bedType: 'queen',
                roomSizeSqFt: 280,
                amenities: ['Wi-Fi', 'Smart TV', 'Coffee Station'],
                images: [],
                featured: true,
                isActive: true,
            },
        }, { new: true, upsert: true }),
        RoomTypeModel.findOneAndUpdate({ slug: 'deluxe-room' }, {
            $set: {
                name: 'Deluxe Room',
                slug: 'deluxe-room',
                shortDescription: 'Elevated comfort with additional space and amenities.',
                description: 'Designed for premium comfort with a larger layout, curated finishes, and a stronger luxury feel.',
                basePrice: 220,
                maxAdults: 2,
                maxChildren: 2,
                bedCount: 1,
                bedType: 'king',
                roomSizeSqFt: 360,
                amenities: ['Wi-Fi', 'Smart TV', 'Mini Bar', 'Workspace'],
                images: [],
                featured: true,
                isActive: true,
            },
        }, { new: true, upsert: true }),
        RoomTypeModel.findOneAndUpdate({ slug: 'executive-suite' }, {
            $set: {
                name: 'Executive Suite',
                slug: 'executive-suite',
                shortDescription: 'Luxury suite experience for high-value guests.',
                description: 'An evaluator-friendly premium suite concept with lounge space, VIP service positioning, and executive comfort.',
                basePrice: 420,
                maxAdults: 3,
                maxChildren: 2,
                bedCount: 2,
                bedType: 'king',
                roomSizeSqFt: 520,
                amenities: ['Wi-Fi', 'Dining Area', 'Lounge', 'Butler Call'],
                images: [],
                featured: true,
                isActive: true,
            },
        }, { new: true, upsert: true }),
    ]);
    const [standardRoomType, deluxeRoomType, executiveRoomType] = roomTypes;
    const roomsSeed = [
        ['101', 1, standardRoomType._id, 'available', 'clean'],
        ['102', 1, standardRoomType._id, 'reserved', 'clean'],
        ['103', 1, standardRoomType._id, 'available', 'inspected'],
        ['104', 1, standardRoomType._id, 'cleaning', 'dirty'],
        ['201', 2, deluxeRoomType._id, 'occupied', 'clean'],
        ['202', 2, deluxeRoomType._id, 'available', 'clean'],
        ['203', 2, deluxeRoomType._id, 'reserved', 'clean'],
        ['204', 2, deluxeRoomType._id, 'maintenance', 'dirty'],
        ['301', 3, executiveRoomType._id, 'available', 'clean'],
        ['302', 3, executiveRoomType._id, 'occupied', 'clean'],
        ['303', 3, executiveRoomType._id, 'available', 'inspected'],
        ['304', 3, executiveRoomType._id, 'cleaning', 'in_progress'],
        ['305', 3, executiveRoomType._id, 'available', 'clean'],
        ['401', 4, deluxeRoomType._id, 'maintenance', 'dirty'],
        ['402', 4, deluxeRoomType._id, 'available', 'clean'],
    ];
    const roomDocuments = await Promise.all(roomsSeed.map(([roomNumber, floor, roomTypeId, status, housekeepingStatus]) => RoomModel.findOneAndUpdate({ roomNumber }, {
        $set: {
            roomNumber,
            floor,
            roomTypeId,
            status,
            housekeepingStatus,
            capacityAdults: 2,
            capacityChildren: 1,
            isActive: true,
            images: [],
        },
    }, { new: true, upsert: true })));
    const roomsByNumber = Object.fromEntries(roomDocuments.map((room) => [room.roomNumber, room]));
    const reservationsSeed = [
        {
            reservationCode: 'LS-RES-1001',
            guestUserId: guestOne._id,
            roomTypeId: standardRoomType._id,
            roomId: roomsByNumber['102']._id,
            bookingSource: 'online',
            checkInDate: daysFromNow(3),
            checkOutDate: daysFromNow(6),
            adults: 2,
            children: 0,
            nights: 3,
            roomRate: 140,
            subtotal: 420,
            taxAmount: 54.6,
            discountAmount: 0,
            totalAmount: 474.6,
            status: 'pending',
            guestProfileSnapshot: {
                fullName: guestOne.fullName,
                email: guestOne.email,
                phone: guestOne.phone,
                idType: 'cnic',
                idNumber: '42101-1234567-1',
            },
            createdByUserId: guestOne._id,
        },
        {
            reservationCode: 'LS-RES-1002',
            guestUserId: guestTwo._id,
            roomTypeId: deluxeRoomType._id,
            roomId: roomsByNumber['203']._id,
            bookingSource: 'desk',
            checkInDate: daysFromNow(1),
            checkOutDate: daysFromNow(4),
            adults: 2,
            children: 1,
            nights: 3,
            roomRate: 220,
            subtotal: 660,
            taxAmount: 85.8,
            discountAmount: 20,
            totalAmount: 725.8,
            status: 'confirmed',
            confirmedAt: daysFromNow(-1),
            guestProfileSnapshot: {
                fullName: guestTwo.fullName,
                email: guestTwo.email,
                phone: guestTwo.phone,
                idType: 'passport',
                idNumber: 'PK0099887',
            },
            createdByUserId: receptionist._id,
        },
        {
            reservationCode: 'LS-RES-1003',
            guestUserId: guestOne._id,
            roomTypeId: deluxeRoomType._id,
            roomId: roomsByNumber['201']._id,
            bookingSource: 'desk',
            checkInDate: daysFromNow(-1),
            checkOutDate: daysFromNow(2),
            adults: 2,
            children: 0,
            nights: 3,
            roomRate: 220,
            subtotal: 660,
            taxAmount: 85.8,
            discountAmount: 0,
            totalAmount: 745.8,
            status: 'checked_in',
            confirmedAt: daysFromNow(-3),
            checkedInAt: daysFromNow(-1),
            guestProfileSnapshot: {
                fullName: guestOne.fullName,
                email: guestOne.email,
                phone: guestOne.phone,
                idType: 'cnic',
                idNumber: '42101-1234567-1',
            },
            createdByUserId: receptionist._id,
        },
        {
            reservationCode: 'LS-RES-1004',
            guestUserId: guestTwo._id,
            roomTypeId: executiveRoomType._id,
            roomId: roomsByNumber['304']._id,
            bookingSource: 'online',
            checkInDate: daysFromNow(-5),
            checkOutDate: daysFromNow(-2),
            adults: 2,
            children: 0,
            nights: 3,
            roomRate: 420,
            subtotal: 1260,
            taxAmount: 163.8,
            discountAmount: 50,
            totalAmount: 1373.8,
            status: 'checked_out',
            confirmedAt: daysFromNow(-8),
            checkedInAt: daysFromNow(-5),
            checkedOutAt: daysFromNow(-2),
            guestProfileSnapshot: {
                fullName: guestTwo.fullName,
                email: guestTwo.email,
                phone: guestTwo.phone,
                idType: 'passport',
                idNumber: 'PK0099887',
            },
            createdByUserId: guestTwo._id,
        },
        {
            reservationCode: 'LS-RES-1005',
            guestUserId: guestOne._id,
            roomTypeId: executiveRoomType._id,
            roomId: null,
            bookingSource: 'phone',
            checkInDate: daysFromNow(7),
            checkOutDate: daysFromNow(10),
            adults: 2,
            children: 1,
            nights: 3,
            roomRate: 420,
            subtotal: 1260,
            taxAmount: 163.8,
            discountAmount: 0,
            totalAmount: 1423.8,
            status: 'cancelled',
            guestProfileSnapshot: {
                fullName: guestOne.fullName,
                email: guestOne.email,
                phone: guestOne.phone,
                idType: 'cnic',
                idNumber: '42101-1234567-1',
            },
            createdByUserId: receptionist._id,
            cancellationReason: 'Guest requested cancellation before confirmation',
        },
        {
            reservationCode: 'LS-RES-1006',
            guestUserId: guestOne._id,
            roomTypeId: standardRoomType._id,
            roomId: roomsByNumber['103']._id,
            bookingSource: 'online',
            checkInDate: daysFromNow(-14),
            checkOutDate: daysFromNow(-12),
            adults: 1,
            children: 0,
            nights: 2,
            roomRate: 140,
            subtotal: 280,
            taxAmount: 36.4,
            discountAmount: 0,
            totalAmount: 316.4,
            status: 'checked_out',
            confirmedAt: daysFromNow(-16),
            checkedInAt: daysFromNow(-14),
            checkedOutAt: daysFromNow(-12),
            guestProfileSnapshot: {
                fullName: guestOne.fullName,
                email: guestOne.email,
                phone: guestOne.phone,
                idType: 'cnic',
                idNumber: '42101-1234567-1',
            },
            createdByUserId: guestOne._id,
        },
    ];
    await Promise.all(reservationsSeed.map((reservation) => ReservationModel.findOneAndUpdate({ reservationCode: reservation.reservationCode }, { $set: reservation }, { new: true, upsert: true })));
    const reservations = await ReservationModel.find({
        reservationCode: { $in: reservationsSeed.map((reservation) => reservation.reservationCode) },
    });
    const reservationMap = Object.fromEntries(reservations.map((reservation) => [reservation.reservationCode, reservation]));
    await Promise.all([
        FolioChargeModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1003']._id, description: 'Room service dinner platter' }, {
            $set: {
                reservationId: reservationMap['LS-RES-1003']._id,
                chargeType: 'food',
                description: 'Room service dinner platter',
                unitPrice: 38,
                quantity: 1,
                amount: 38,
                chargeDate: daysFromNow(0),
                createdBy: receptionist._id,
            },
        }, { new: true, upsert: true }),
        FolioChargeModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1003']._id, description: 'Laundry express service' }, {
            $set: {
                reservationId: reservationMap['LS-RES-1003']._id,
                chargeType: 'laundry',
                description: 'Laundry express service',
                unitPrice: 22,
                quantity: 2,
                amount: 44,
                chargeDate: daysFromNow(0),
                createdBy: receptionist._id,
            },
        }, { new: true, upsert: true }),
        FolioChargeModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1004']._id, description: 'Airport transfer' }, {
            $set: {
                reservationId: reservationMap['LS-RES-1004']._id,
                chargeType: 'transport',
                description: 'Airport transfer',
                unitPrice: 55,
                quantity: 1,
                amount: 55,
                chargeDate: daysFromNow(-3),
                createdBy: receptionist._id,
            },
        }, { new: true, upsert: true }),
    ]);
    const [invoiceCheckedIn, invoiceCheckedOut] = await Promise.all([
        InvoiceModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1003']._id }, {
            $set: {
                invoiceNumber: 'LS-INV-5001',
                reservationId: reservationMap['LS-RES-1003']._id,
                guestUserId: guestOne._id,
                subtotal: 742,
                discountAmount: 0,
                taxAmount: 96.46,
                totalAmount: 838.46,
                paidAmount: 300,
                balanceAmount: 538.46,
                status: 'partially_paid',
                issuedAt: daysFromNow(-1),
            },
        }, { new: true, upsert: true }),
        InvoiceModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1004']._id }, {
            $set: {
                invoiceNumber: 'LS-INV-5002',
                reservationId: reservationMap['LS-RES-1004']._id,
                guestUserId: guestTwo._id,
                subtotal: 1315,
                discountAmount: 50,
                taxAmount: 170.95,
                totalAmount: 1435.95,
                paidAmount: 1435.95,
                balanceAmount: 0,
                status: 'paid',
                issuedAt: daysFromNow(-2),
            },
        }, { new: true, upsert: true }),
    ]);
    await Promise.all([
        PaymentModel.findOneAndUpdate({ invoiceId: invoiceCheckedIn._id, referenceNumber: 'CARD-300-CHKIN' }, {
            $set: {
                invoiceId: invoiceCheckedIn._id,
                reservationId: reservationMap['LS-RES-1003']._id,
                guestUserId: guestOne._id,
                amount: 300,
                method: 'card',
                referenceNumber: 'CARD-300-CHKIN',
                status: 'success',
                receivedByUserId: receptionist._id,
                paidAt: daysFromNow(-1),
                notes: 'Partial payment captured at front desk',
            },
        }, { new: true, upsert: true }),
        PaymentModel.findOneAndUpdate({ invoiceId: invoiceCheckedOut._id, referenceNumber: 'ONLINE-PAID-1004' }, {
            $set: {
                invoiceId: invoiceCheckedOut._id,
                reservationId: reservationMap['LS-RES-1004']._id,
                guestUserId: guestTwo._id,
                amount: 1435.95,
                method: 'online',
                referenceNumber: 'ONLINE-PAID-1004',
                status: 'success',
                receivedByUserId: receptionist._id,
                paidAt: daysFromNow(-2),
                notes: 'Invoice settled during checkout',
            },
        }, { new: true, upsert: true }),
    ]);
    await Promise.all([
        HousekeepingTaskModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1004']._id, taskType: 'checkout_cleaning' }, {
            $set: {
                roomId: roomsByNumber['304']._id,
                reservationId: reservationMap['LS-RES-1004']._id,
                taskType: 'checkout_cleaning',
                assignedToUserId: housekeeping._id,
                priority: 'high',
                status: 'pending',
                scheduledFor: daysFromNow(-2),
                notes: 'Suite turnover after checkout',
            },
        }, { new: true, upsert: true }),
        HousekeepingTaskModel.findOneAndUpdate({ roomId: roomsByNumber['104']._id, taskType: 'daily_cleaning' }, {
            $set: {
                roomId: roomsByNumber['104']._id,
                reservationId: null,
                taskType: 'daily_cleaning',
                assignedToUserId: housekeeping._id,
                priority: 'medium',
                status: 'in_progress',
                scheduledFor: daysFromNow(0),
                startedAt: daysFromNow(0),
                notes: 'Midday room refresh in progress',
            },
        }, { new: true, upsert: true }),
        HousekeepingTaskModel.findOneAndUpdate({ roomId: roomsByNumber['103']._id, taskType: 'inspection' }, {
            $set: {
                roomId: roomsByNumber['103']._id,
                reservationId: null,
                taskType: 'inspection',
                assignedToUserId: housekeeping._id,
                priority: 'low',
                status: 'completed',
                scheduledFor: daysFromNow(-1),
                completedAt: daysFromNow(-1),
                notes: 'Post-clean inspection completed',
            },
        }, { new: true, upsert: true }),
    ]);
    await Promise.all([
        MaintenanceRequestModel.findOneAndUpdate({ roomId: roomsByNumber['401']._id, issueType: 'ac', description: 'Suite AC compressor is not cooling properly' }, {
            $set: {
                roomId: roomsByNumber['401']._id,
                locationLabel: null,
                reportedByUserId: housekeeping._id,
                assignedToUserId: maintenance._id,
                issueType: 'ac',
                description: 'Suite AC compressor is not cooling properly',
                priority: 'urgent',
                status: 'assigned',
                images: [],
                reportedAt: daysFromNow(-1),
            },
        }, { new: true, upsert: true }),
        MaintenanceRequestModel.findOneAndUpdate({ roomId: roomsByNumber['204']._id, issueType: 'plumbing', description: 'Bathroom sink leakage requires seal replacement' }, {
            $set: {
                roomId: roomsByNumber['204']._id,
                locationLabel: null,
                reportedByUserId: receptionist._id,
                assignedToUserId: maintenance._id,
                issueType: 'plumbing',
                description: 'Bathroom sink leakage requires seal replacement',
                priority: 'high',
                status: 'in_progress',
                images: [],
                reportedAt: daysFromNow(-2),
                startedAt: daysFromNow(-1),
            },
        }, { new: true, upsert: true }),
        MaintenanceRequestModel.findOneAndUpdate({ roomId: roomsByNumber['304']._id, issueType: 'furniture', description: 'Suite lounge chair leg was repaired and reinforced' }, {
            $set: {
                roomId: roomsByNumber['304']._id,
                locationLabel: null,
                reportedByUserId: housekeeping._id,
                assignedToUserId: maintenance._id,
                issueType: 'furniture',
                description: 'Suite lounge chair leg was repaired and reinforced',
                priority: 'medium',
                status: 'resolved',
                images: [],
                reportedAt: daysFromNow(-5),
                startedAt: daysFromNow(-4),
                resolvedAt: daysFromNow(-3),
                resolutionNotes: 'Chair frame tightened and quality-checked for guest safety',
            },
        }, { new: true, upsert: true }),
    ]);
    await Promise.all([
        ServiceRequestModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1003']._id, requestType: 'laundry', description: 'Express laundry for business attire' }, {
            $set: {
                reservationId: reservationMap['LS-RES-1003']._id,
                guestUserId: guestOne._id,
                requestType: 'laundry',
                description: 'Express laundry for business attire',
                preferredTime: daysFromNow(0),
                status: 'pending',
                assignedToUserId: receptionist._id,
            },
        }, { new: true, upsert: true }),
        ServiceRequestModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1003']._id, requestType: 'wake_up_call', description: 'Wake-up call at 6:30 AM before airport meeting' }, {
            $set: {
                reservationId: reservationMap['LS-RES-1003']._id,
                guestUserId: guestOne._id,
                requestType: 'wake_up_call',
                description: 'Wake-up call at 6:30 AM before airport meeting',
                preferredTime: daysFromNow(1),
                status: 'completed',
                assignedToUserId: receptionist._id,
                completedAt: daysFromNow(0),
            },
        }, { new: true, upsert: true }),
    ]);
    await Promise.all([
        FeedbackModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1004']._id, guestUserId: guestTwo._id }, {
            $set: {
                reservationId: reservationMap['LS-RES-1004']._id,
                guestUserId: guestTwo._id,
                rating: 5,
                title: 'Executive suite experience felt polished and memorable',
                comment: 'The suite was spacious, the checkout was smooth, and the staff handled every request professionally.',
                categories: {
                    room: 5,
                    cleanliness: 5,
                    staff: 5,
                    food: 4,
                    overall: 5,
                },
                isPublished: true,
            },
        }, { new: true, upsert: true }),
        FeedbackModel.findOneAndUpdate({ reservationId: reservationMap['LS-RES-1006']._id, guestUserId: guestOne._id }, {
            $set: {
                reservationId: reservationMap['LS-RES-1006']._id,
                guestUserId: guestOne._id,
                rating: 4,
                title: 'Comfortable stay with fast front desk support',
                comment: 'The room was clean and the team responded quickly to requests, though breakfast options could improve.',
                categories: {
                    room: 4,
                    cleanliness: 4,
                    staff: 5,
                    food: 3,
                    overall: 4,
                },
                isPublished: false,
            },
        }, { new: true, upsert: true }),
    ]);
    await Promise.all([
        NotificationModel.findOneAndUpdate({ title: 'Pending online reservation requires review', message: 'Guest reservation LS-RES-1001 is awaiting confirmation.' }, {
            $set: {
                type: 'reservation',
                title: 'Pending online reservation requires review',
                message: 'Guest reservation LS-RES-1001 is awaiting confirmation.',
                targetRoles: ['admin', 'receptionist'],
                targetUserIds: [],
                isReadBy: [],
                link: '/reception/dashboard',
                priority: 'medium',
            },
        }, { new: true, upsert: true }),
        NotificationModel.findOneAndUpdate({ title: 'Urgent maintenance issue flagged', message: 'Room 401 is blocked due to an urgent AC issue.' }, {
            $set: {
                type: 'maintenance',
                title: 'Urgent maintenance issue flagged',
                message: 'Room 401 is blocked due to an urgent AC issue.',
                targetRoles: ['maintenance', 'admin', 'manager'],
                targetUserIds: [],
                isReadBy: [],
                link: '/maintenance/requests',
                priority: 'high',
            },
        }, { new: true, upsert: true }),
        NotificationModel.findOneAndUpdate({ title: 'Payment captured for in-house guest', message: 'A partial card payment was recorded against LS-INV-5001.' }, {
            $set: {
                type: 'payment',
                title: 'Payment captured for in-house guest',
                message: 'A partial card payment was recorded against LS-INV-5001.',
                targetRoles: ['admin', 'receptionist'],
                targetUserIds: [],
                isReadBy: [],
                link: '/reception/billing',
                priority: 'medium',
            },
        }, { new: true, upsert: true }),
        NotificationModel.findOneAndUpdate({ title: 'Upcoming stay reminder', message: 'Your next LuxuryStay reservation is confirmed and visible in the guest portal.' }, {
            $set: {
                type: 'system',
                title: 'Upcoming stay reminder',
                message: 'Your next LuxuryStay reservation is confirmed and visible in the guest portal.',
                targetRoles: [],
                targetUserIds: [guestTwo._id],
                isReadBy: [],
                link: '/guest/dashboard',
                priority: 'low',
            },
        }, { new: true, upsert: true }),
    ]);
    logger.info({
        credentials: {
            superAdmin: 'superadmin@luxurystay.com / Password123!',
            admin: 'admin@luxurystay.com / Password123!',
            manager: 'manager@luxurystay.com / Password123!',
            receptionist: 'reception@luxurystay.com / Password123!',
            housekeeping: 'housekeeping@luxurystay.com / Password123!',
            maintenance: 'maintenance@luxurystay.com / Password123!',
            guest1: 'guest1@example.com / Password123!',
            guest2: 'guest2@example.com / Password123!',
        },
    }, 'LuxuryStay seed completed');
    await mongoose.disconnect();
    process.exit(0);
};
runSeed().catch(async (error) => {
    logger.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
