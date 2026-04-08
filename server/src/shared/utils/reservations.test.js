import { describe, expect, it } from 'vitest';
import { calculateNights, getEndOfDay, getStartOfDay } from './reservations.js';
describe('reservation utilities', () => {
    it('normalizes values to the start and end of the same day', () => {
        const start = getStartOfDay('2026-03-26T16:30:00.000Z');
        const end = getEndOfDay('2026-03-26T16:30:00.000Z');
        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
        expect(end.getHours()).toBe(23);
        expect(end.getMinutes()).toBe(59);
    });
    it('calculates nights from the day difference between check-in and check-out', () => {
        expect(calculateNights('2026-03-26', '2026-03-27')).toBe(1);
        expect(calculateNights('2026-03-26', '2026-03-29')).toBe(3);
    });
    it('returns zero or negative values for invalid date ranges so services can reject them', () => {
        expect(calculateNights('2026-03-26', '2026-03-26')).toBe(0);
        expect(calculateNights('2026-03-27', '2026-03-26')).toBe(-1);
    });
});
