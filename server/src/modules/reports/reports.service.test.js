import { describe, expect, it, vi } from 'vitest';
import { reportsRepository } from './reports.repository.js';
import { reportsService } from './reports.service.js';
describe('reportsService.exportCsv', () => {
    it('exports revenue trend rows to CSV', async () => {
        const spy = vi.spyOn(reportsRepository, 'listPaymentsForExport').mockResolvedValue([
            {
                paidAt: new Date('2026-02-10T10:00:00.000Z'),
                status: 'success',
                method: 'card',
                amount: 700,
                referenceNumber: 'PAY-700',
                invoiceId: {
                    invoiceNumber: 'INV-700',
                    status: 'paid',
                    totalAmount: 700,
                    balanceAmount: 0,
                },
                reservationId: {
                    reservationCode: 'RES-700',
                    status: 'checked_out',
                    bookingSource: 'online',
                    checkInDate: new Date('2026-02-05T00:00:00.000Z'),
                    checkOutDate: new Date('2026-02-10T00:00:00.000Z'),
                },
                guestUserId: { fullName: 'Guest One', email: 'guest1@example.com' },
                receivedByUserId: { fullName: 'Admin Desk', email: 'admin@luxurystay.com' },
                notes: 'Captured successfully',
                createdAt: new Date('2026-02-10T10:00:00.000Z'),
            },
            {
                paidAt: new Date('2026-03-12T11:30:00.000Z'),
                status: 'success',
                method: 'cash',
                amount: 800,
                referenceNumber: 'PAY-800',
                invoiceId: {
                    invoiceNumber: 'INV-800',
                    status: 'paid',
                    totalAmount: 800,
                    balanceAmount: 0,
                },
                reservationId: {
                    reservationCode: 'RES-800',
                    status: 'checked_out',
                    bookingSource: 'desk',
                    checkInDate: new Date('2026-03-08T00:00:00.000Z'),
                    checkOutDate: new Date('2026-03-12T00:00:00.000Z'),
                },
                guestUserId: { fullName: 'Guest Two', email: 'guest2@example.com' },
                receivedByUserId: { fullName: 'Admin Desk', email: 'admin@luxurystay.com' },
                notes: 'Collected at checkout',
                createdAt: new Date('2026-03-12T11:30:00.000Z'),
            },
        ]);
        const csv = await reportsService.exportCsv('revenue');
        expect(csv).toContain('paymentStatus,paymentMethod,amount');
        expect(csv).toContain('"success","card","700"');
        expect(csv).toContain('"success","cash","800"');
        spy.mockRestore();
    });
    it('exports occupancy distribution rows to CSV', async () => {
        const spy = vi.spyOn(reportsRepository, 'listRoomsForExport').mockResolvedValue([
            {
                roomNumber: '101',
                floor: 1,
                status: 'occupied',
                housekeepingStatus: 'dirty',
                customPrice: 500,
                capacityAdults: 2,
                capacityChildren: 1,
                isActive: true,
                lastCleanedAt: new Date('2026-03-01T08:00:00.000Z'),
                createdAt: new Date('2026-02-01T08:00:00.000Z'),
                updatedAt: new Date('2026-03-01T08:00:00.000Z'),
                roomTypeId: {
                    name: 'Deluxe',
                    basePrice: 450,
                    maxAdults: 2,
                    maxChildren: 1,
                    bedType: 'King',
                },
            },
            {
                roomNumber: '102',
                floor: 1,
                status: 'cleaning',
                housekeepingStatus: 'in_progress',
                customPrice: 0,
                capacityAdults: 2,
                capacityChildren: 2,
                isActive: true,
                lastCleanedAt: null,
                createdAt: new Date('2026-02-02T08:00:00.000Z'),
                updatedAt: new Date('2026-03-02T08:00:00.000Z'),
                roomTypeId: {
                    name: 'Standard',
                    basePrice: 300,
                    maxAdults: 2,
                    maxChildren: 2,
                    bedType: 'Queen',
                },
            },
        ]);
        const csv = await reportsService.exportCsv('occupancy');
        expect(csv).toContain('"101","1","Deluxe","occupied"');
        expect(csv).toContain('"102","1","Standard","cleaning"');
        spy.mockRestore();
    });
});
