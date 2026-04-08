export const generateInvoiceNumber = () => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `LS-INV-${Date.now().toString().slice(-6)}${random}`;
};
export const getInvoiceStatusFromAmounts = (balanceAmount, paidAmount, totalAmount) => {
    if (totalAmount <= 0) {
        return 'void';
    }
    if (balanceAmount <= 0) {
        return 'paid';
    }
    if (paidAmount > 0 && paidAmount < totalAmount) {
        return 'partially_paid';
    }
    return 'unpaid';
};
export const getEffectivePaidAmount = (amount, status) => {
    if (status === 'success') {
        return amount;
    }
    if (status === 'refunded') {
        return -amount;
    }
    return 0;
};
