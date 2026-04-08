export const getStartOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};
export const getEndOfDay = (value) => {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
};
export const calculateNights = (checkInDate, checkOutDate) => {
    const start = getStartOfDay(checkInDate);
    const end = getStartOfDay(checkOutDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
export const generateReservationCode = () => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `LS-RES-${Date.now().toString().slice(-6)}${random}`;
};
