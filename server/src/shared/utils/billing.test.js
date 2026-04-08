import { describe, expect, it } from 'vitest';
import { getEffectivePaidAmount, getInvoiceStatusFromAmounts } from './billing.js';
describe('billing utilities', () => {
    it('marks invoice as paid when balance is zero or below', () => {
        expect(getInvoiceStatusFromAmounts(0, 500, 500)).toBe('paid');
        expect(getInvoiceStatusFromAmounts(-10, 510, 500)).toBe('paid');
    });
    it('marks invoice as partially paid when some amount is settled but balance remains', () => {
        expect(getInvoiceStatusFromAmounts(200, 300, 500)).toBe('partially_paid');
    });
    it('marks invoice as unpaid when no effective payment exists', () => {
        expect(getInvoiceStatusFromAmounts(500, 0, 500)).toBe('unpaid');
    });
    it('marks invoice as void when total amount is invalid', () => {
        expect(getInvoiceStatusFromAmounts(0, 0, 0)).toBe('void');
    });
    it('calculates effective paid amount based on payment status', () => {
        expect(getEffectivePaidAmount(200, 'success')).toBe(200);
        expect(getEffectivePaidAmount(200, 'refunded')).toBe(-200);
        expect(getEffectivePaidAmount(200, 'pending')).toBe(0);
        expect(getEffectivePaidAmount(200, 'failed')).toBe(0);
    });
});
