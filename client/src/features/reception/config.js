export const formatReceptionCurrency = (value) => `Rs ${Number(value ?? 0).toFixed(2)}`;

export const formatReceptionDate = (value, options = {}) => {
  if (!value) {
    return 'n/a';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'n/a';
  }

  return parsed.toLocaleDateString(undefined, options);
};

export const formatReceptionDateTime = (value) => {
  if (!value) {
    return 'n/a';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'n/a';
  }

  return parsed.toLocaleString();
};

export const bookingSourceOptions = [
  { value: 'desk', label: 'Desk' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'online', label: 'Online' },
  { value: 'agent', label: 'Agent' },
];

export const idTypeOptions = [
  { value: 'cnic', label: 'CNIC' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving license' },
  { value: 'other', label: 'Other' },
];

export const paymentMethodOptions = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'online', label: 'Online' },
];

export const chargeTypeOptions = [
  { value: 'food', label: 'Food' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'transport', label: 'Transport' },
  { value: 'minibar', label: 'Minibar' },
  { value: 'late_checkout', label: 'Late checkout' },
  { value: 'early_checkin', label: 'Early check-in' },
  { value: 'misc', label: 'Miscellaneous' },
];

export const serviceRequestTypeOptions = [
  { value: 'room_service', label: 'Room Service' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'amenities_request', label: 'Amenities Request' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'wake_up_call', label: 'Wake-up Call' },
  { value: 'transport', label: 'Transport' },
  { value: 'luggage_assistance', label: 'Luggage Assistance' },
  { value: 'extra_bed', label: 'Extra Bed' },
  { value: 'internet_wifi_support', label: 'Internet/Wi-Fi Support' },
  { value: 'late_check_out_request', label: 'Late Check-out Request' },
  { value: 'early_check_in_request', label: 'Early Check-in Request' },
  { value: 'booking_reservation_help', label: 'Booking/Reservation Help' },
  { value: 'concierge_service', label: 'Concierge Service' },
  { value: 'lost_and_found', label: 'Lost & Found' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'medical_assistance', label: 'Medical Assistance' },
  { value: 'security_assistance', label: 'Security Assistance' },
  { value: 'special_occasion_request', label: 'Special Occasion Request' },
  { value: 'other_request', label: 'Other Request' },
];

export const serviceRequestStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const receptionFieldClassName =
  'w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--primary)] outline-none transition focus:border-[rgba(184,140,74,0.4)] focus:ring-4 focus:ring-[rgba(184,140,74,0.14)]';

export const receptionTextAreaClassName =
  'w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--primary)] outline-none transition focus:border-[rgba(184,140,74,0.4)] focus:ring-4 focus:ring-[rgba(184,140,74,0.14)]';

export const receptionLabelClassName = 'space-y-2';
export const receptionLabelTextClassName = 'text-sm font-medium text-[var(--primary)]';
