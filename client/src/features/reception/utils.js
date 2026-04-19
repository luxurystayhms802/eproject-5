export const createReceptionReservationForm = (guestUserId = '') => ({
  guestUserId,
  roomTypeId: '',
  roomId: '',
  bookingSource: 'desk',
  checkInDate: '',
  checkOutDate: '',
  adults: '2',
  children: '0',
  discountAmount: '0',
  arrivalTime: '2:00 PM',
  specialRequests: '',
  notes: '',
  advancePaymentAmount: '',
  advancePaymentMethod: 'cash',
});

export const mapReservationToReceptionForm = (reservation) => ({
  guestUserId: reservation.guestUserId ?? '',
  roomTypeId: reservation.roomTypeId ?? '',
  roomId: reservation.roomId ?? '',
  bookingSource: reservation.bookingSource ?? 'desk',
  checkInDate: reservation.checkInDate ? new Date(reservation.checkInDate).toISOString().slice(0, 10) : '',
  checkOutDate: reservation.checkOutDate ? new Date(reservation.checkOutDate).toISOString().slice(0, 10) : '',
  adults: String(reservation.adults ?? 1),
  children: String(reservation.children ?? 0),
  discountAmount: String(reservation.discountAmount ?? 0),
  arrivalTime: reservation.arrivalTime ?? '2:00 PM',
  specialRequests: reservation.specialRequests ?? '',
  notes: reservation.notes ?? '',
});

export const buildReceptionReservationPayload = (form) => ({
  guestUserId: form.guestUserId,
  roomTypeId: form.roomTypeId,
  roomId: form.roomId || null,
  bookingSource: form.bookingSource,
  checkInDate: form.checkInDate,
  checkOutDate: form.checkOutDate,
  adults: Number(form.adults),
  children: Number(form.children),
  discountAmount: Number(form.discountAmount || 0),
  arrivalTime: String(form.arrivalTime ?? '').trim() || null,
  specialRequests: String(form.specialRequests ?? '').trim() || null,
  notes: String(form.notes ?? '').trim() || null,
  advancePaymentAmount: Number(form.advancePaymentAmount || 0),
  advancePaymentMethod: form.advancePaymentMethod || 'cash',
});

export const calculateReceptionStayNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const difference = end.getTime() - start.getTime();

  if (Number.isNaN(difference) || difference <= 0) {
    return 0;
  }

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
};

export const createReceptionGuestForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  status: 'active',
  profile: {
    gender: '',
    dateOfBirth: '',
    nationality: '',
    idType: '',
    idNumber: '',
    addressLine1: '',
    city: '',
    country: '',
    notes: '',
  },
});

export const buildReceptionGuestPayload = (form) => ({
  firstName: String(form.firstName ?? '').trim(),
  lastName: String(form.lastName ?? '').trim(),
  email: String(form.email ?? '').trim(),
  phone: String(form.phone ?? '').trim(),
  password: String(form.password ?? '').trim(),
  status: form.status ?? 'active',
  profile: {
    gender: form.profile?.gender || null,
    dateOfBirth: form.profile?.dateOfBirth || null,
    nationality: String(form.profile?.nationality ?? '').trim(),
    idType: form.profile?.idType || null,
    idNumber: String(form.profile?.idNumber ?? '').trim(),
    addressLine1: String(form.profile?.addressLine1 ?? '').trim(),
    city: String(form.profile?.city ?? '').trim(),
    country: String(form.profile?.country ?? '').trim(),
    notes: String(form.profile?.notes ?? '').trim() || null,
  },
});

export const validateReceptionServiceRequestForm = (form) => {
  if (!form.reservationId) {
    return 'Select a reservation for the service request.';
  }

  if (!form.requestType) {
    return 'Select a service type.';
  }

  if (String(form.description ?? '').trim().length < 8) {
    return 'Description should be at least 8 characters.';
  }

  return null;
};
