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
  { value: 'room_service', label: 'Room service' },
  { value: 'wake_up_call', label: 'Wake-up call' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'transport', label: 'Transport' },
  { value: 'extra_bed', label: 'Extra bed' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'misc', label: 'Other request' },
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
