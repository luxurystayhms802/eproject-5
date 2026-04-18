export const ADMIN_ROLE_OPTIONS = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'];
export const USER_ROLE_OPTIONS = [...ADMIN_ROLE_OPTIONS, 'guest'];
export const USER_STATUS_OPTIONS = ['active', 'inactive'];
export const EMPLOYMENT_STATUS_OPTIONS = ['active', 'suspended'];
export const STAFF_SHIFT_OPTIONS = ['morning', 'evening', 'night', 'rotational'];
export const ROOM_STATUS_OPTIONS = ['available', 'reserved', 'occupied', 'cleaning', 'maintenance', 'out_of_service'];
export const HOUSEKEEPING_STATUS_OPTIONS = ['clean', 'dirty', 'inspected', 'in_progress'];
export const BED_TYPE_OPTIONS = ['single', 'double', 'queen', 'king', 'twin'];
export const GENDER_OPTIONS = ['male', 'female', 'other'];
export const ID_TYPE_OPTIONS = ['cnic', 'passport', 'driving_license', 'other'];
export const BOOKING_SOURCE_OPTIONS = ['online', 'walk_in', 'phone', 'desk'];
export const RESERVATION_STATUS_OPTIONS = ['draft', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'missed_arrival'];
export const FOLIO_CHARGE_TYPE_OPTIONS = ['room', 'laundry', 'food', 'transport', 'minibar', 'tax', 'misc', 'late_checkout', 'early_checkin'];
export const INVOICE_STATUS_OPTIONS = ['draft', 'unpaid', 'partially_paid', 'paid', 'void'];
export const PAYMENT_METHOD_OPTIONS = ['cash', 'card', 'bank_transfer', 'online'];
export const PAYMENT_STATUS_OPTIONS = ['pending', 'success', 'failed', 'refunded'];
export const HOUSEKEEPING_TASK_TYPE_OPTIONS = ['checkout_cleaning', 'daily_cleaning', 'deep_cleaning', 'inspection'];
export const HOUSEKEEPING_TASK_STATUS_OPTIONS = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
export const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
export const MAINTENANCE_STATUS_OPTIONS = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
export const MAINTENANCE_ISSUE_TYPE_OPTIONS = ['ac', 'plumbing', 'electricity', 'furniture', 'lock', 'internet', 'bathroom', 'appliance', 'other'];
export const SERVICE_REQUEST_TYPE_OPTIONS = ['room_service', 'wake_up_call', 'laundry', 'transport', 'extra_bed', 'housekeeping', 'misc'];
export const SERVICE_REQUEST_STATUS_OPTIONS = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
export const NOTIFICATION_TYPE_OPTIONS = ['reservation', 'payment', 'housekeeping', 'maintenance', 'service_request', 'system', 'feedback'];
export const NOTIFICATION_PRIORITY_OPTIONS = ['low', 'medium', 'high'];
export const ROLE_PERMISSION_OPTIONS = [
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'guests.read',
  'guests.create',
  'guests.update',
  'staff.read',
  'staff.create',
  'staff.update',
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',
  'rooms.read',
  'rooms.create',
  'rooms.update',
  'rooms.delete',
  'roomTypes.read',
  'roomTypes.create',
  'roomTypes.update',
  'roomTypes.delete',
  'reservations.read',
  'reservations.create',
  'reservations.update',
  'reservations.confirm',
  'reservations.assignRoom',
  'reservations.cancel',
  'checkIn.read',
  'checkIn.update',
  'checkOut.read',
  'checkOut.update',
  'folioCharges.read',
  'folioCharges.create',
  'folioCharges.update',
  'folioCharges.delete',
  'invoices.read',
  'invoices.create',
  'invoices.finalize',
  'payments.read',
  'payments.create',
  'housekeeping.read',
  'housekeeping.update',
  'maintenance.read',
  'maintenance.create',
  'maintenance.update',
  'serviceRequests.read',
  'serviceRequests.create',
  'serviceRequests.update',
  'feedback.read',
  'feedback.create',
  'feedback.publish',
  'notifications.read',
  'notifications.create',
  'notifications.update',
  'reports.read',
  'settings.read',
  'settings.update',
  'faqs.read',
  'faqs.create',
  'faqs.update',
  'faqs.delete',
  'audit.read',
  'inquiries.read',
  'inquiries.update',
];

export const adminInputClassName =
  'w-full rounded-[18px] border border-[var(--border)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:bg-white focus:shadow-[0_12px_28px_rgba(16,36,63,0.06)]';

export const adminTextAreaClassName = `${adminInputClassName} min-h-[120px] resize-y`;

export const adminSelectClassName =
  'w-full rounded-[18px] border border-[var(--border)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-white focus:shadow-[0_12px_28px_rgba(16,36,63,0.06)]';

export const adminLabelClassName = 'space-y-2';
export const adminLabelTextClassName = 'text-sm font-semibold text-[var(--primary)]';

export const formatAdminCurrency = (value) => `Rs ${Number(value ?? 0).toFixed(2)}`;
export const formatAdminDate = (value) => (value ? new Date(value).toLocaleDateString() : 'n/a');
export const formatAdminDateTime = (value) => (value ? new Date(value).toLocaleString() : 'n/a');
export const titleCase = (value) => String(value ?? '').replaceAll('_', ' ');
export const getDisplayRoleLabel = (value) => value;

export const formatPermission = (permission) => {
  const [_, action] = permission.split('.');
  const actionMap = {
    read: 'View',
    create: 'Create',
    update: 'Edit',
    delete: 'Delete',
    publish: 'Publish',
    finalize: 'Finalize',
    assignRoom: 'Assign Room',
    confirm: 'Confirm',
    checkin: 'Check-in',
    checkout: 'Check-out',
    cancel: 'Cancel',
  };
  return actionMap[action] || titleCase(action);
};
