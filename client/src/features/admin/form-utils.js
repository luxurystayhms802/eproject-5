const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{10,20}$/;
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]{0,49}$/u;
const ROOM_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s\-/#]{0,19}$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-_/]{4,29}$/;
const TIME_PATTERN = /^(?:(?:0?[1-9]|1[0-2]):[0-5]\d\s?(?:AM|PM)|(?:[01]?\d|2[0-3]):[0-5]\d)$/i;

const isBlank = (value) => String(value ?? '').trim() === '';
const toNumber = (value) => Number(value);
const hasImages = (value) => Array.isArray(value) && value.length > 0;
const isValidName = (value) => NAME_PATTERN.test(String(value ?? '').trim());
const isValidUrlOrBlank = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return true;
  }
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
};

export const validateAdminRoomTypeForm = (form) => {
  if (isBlank(form.name)) return 'Room type name is required.';
  if (isBlank(form.shortDescription)) return 'Short description is required.';
  if (isBlank(form.description)) return 'Long description is required.';
  if (Number.isNaN(toNumber(form.basePrice)) || toNumber(form.basePrice) < 0) return 'Base price must be 0 or greater.';
  if (Number.isNaN(toNumber(form.maxAdults)) || toNumber(form.maxAdults) < 1) return 'Max adults must be at least 1.';
  if (Number.isNaN(toNumber(form.maxChildren)) || toNumber(form.maxChildren) < 0) return 'Max children cannot be negative.';
  if (Number.isNaN(toNumber(form.bedCount)) || toNumber(form.bedCount) < 1) return 'Bed count must be at least 1.';
  if (!String(form.amenities ?? '').split(',').map((item) => item.trim()).filter(Boolean).length) return 'Add at least one amenity.';
  if (!hasImages(form.images)) return 'Upload at least one room type image for website and reservation views.';
  return null;
};

export const validateAdminRoomForm = (form) => {
  if (isBlank(form.roomNumber)) return 'Room number is required.';
  if (!ROOM_NUMBER_PATTERN.test(String(form.roomNumber ?? '').trim())) return 'Room number may only contain letters, numbers, spaces, hyphens, slashes, and #.';
  if (isBlank(form.roomTypeId)) return 'Select a room type for this room.';
  if (Number.isNaN(toNumber(form.floor)) || toNumber(form.floor) < 0) return 'Floor must be 0 or greater.';
  if (form.customPrice !== '' && (Number.isNaN(toNumber(form.customPrice)) || toNumber(form.customPrice) < 0)) return 'Custom price must be 0 or greater.';
  if (Number.isNaN(toNumber(form.capacityAdults)) || toNumber(form.capacityAdults) < 1) return 'Adults capacity must be at least 1.';
  if (Number.isNaN(toNumber(form.capacityChildren)) || toNumber(form.capacityChildren) < 0) return 'Children capacity cannot be negative.';
  if (!hasImages(form.images)) return 'Upload at least one room image for the live website and admin inventory.';
  return null;
};

export const validateAdminStaffForm = (form, isEditing = false) => {
  if (isBlank(form.firstName)) return 'First name is required.';
  if (isBlank(form.lastName)) return 'Last name is required.';
  if (!isValidName(form.firstName)) return 'First name should contain letters only, with spaces or punctuation where needed.';
  if (!isValidName(form.lastName)) return 'Last name should contain letters only, with spaces or punctuation where needed.';
  if (!EMAIL_PATTERN.test(String(form.email ?? '').trim())) return 'Enter a valid staff email address.';
  if (!PHONE_PATTERN.test(String(form.phone ?? '').trim())) return 'Enter a valid phone number.';
  if ((String(form.phone ?? '').match(/\d/g) || []).length > 11) return 'Phone number cannot contain more than 11 digits.';
  if (!isEditing || !isBlank(form.password)) {
    if (String(form.password ?? '').trim().length < 8) return 'Password must be at least 8 characters.';
  }
  if (isBlank(form.role)) return 'Select a staff role.';
  if (isBlank(form.status)) return 'Select an account status.';
  if (isBlank(form.profile?.department)) return 'Select a department.';
  if (isBlank(form.profile?.designation)) return 'Designation is required.';
  if (isBlank(form.profile?.joiningDate)) return 'Joining date is required.';
  if (isBlank(form.profile?.shift)) return 'Select a shift.';
  if (form.profile?.salary !== '' && (Number.isNaN(toNumber(form.profile.salary)) || toNumber(form.profile.salary) < 0)) return 'Salary cannot be negative.';
  return null;
};

export const validateAdminGuestForm = (form, isEditing = false) => {
  if (isBlank(form.firstName)) return 'First name is required.';
  if (isBlank(form.lastName)) return 'Last name is required.';
  if (!isValidName(form.firstName)) return 'First name should contain letters only, with spaces or punctuation where needed.';
  if (!isValidName(form.lastName)) return 'Last name should contain letters only, with spaces or punctuation where needed.';
  
  if (isBlank(form.email)) return 'Email address is required.';
  if (!EMAIL_PATTERN.test(String(form.email ?? '').trim())) return 'Enter a valid guest email address.';
  
  if (isBlank(form.phone)) return 'Phone number is required.';
  if (!PHONE_PATTERN.test(String(form.phone ?? '').trim())) return 'Enter a valid phone number.';
  if ((String(form.phone ?? '').match(/\d/g) || []).length > 11) return 'Phone number cannot contain more than 11 digits.';
  
  if (isBlank(form.status)) return 'Select an account status.';
  
  if (!isEditing) {
    if (isBlank(form.password)) return 'Password is required to secure the guest account.';
    if (String(form.password ?? '').trim().length < 8) return 'Password must be at least 8 characters.';
  } else if (!isBlank(form.password) && String(form.password ?? '').trim().length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (isBlank(form.profile?.gender)) return 'Gender is required.';
  if (isBlank(form.profile?.dateOfBirth)) return 'Date of birth is required.';
  
  if (isBlank(form.profile?.nationality)) return 'Nationality is required.';
  if (!isValidName(form.profile?.nationality)) return 'Nationality should only contain letters.';
  
  if (isBlank(form.profile?.city)) return 'City is required.';
  if (!isValidName(form.profile?.city)) return 'City should only contain letters.';
  
  if (isBlank(form.profile?.country)) return 'Country is required.';
  if (!isValidName(form.profile?.country)) return 'Country should only contain letters.';
  
  if (isBlank(form.profile?.addressLine1)) return 'Address line 1 is required.';
  
  if (isBlank(form.profile?.idType)) return 'ID type is required for clear records.';
  if (isBlank(form.profile?.idNumber)) return 'ID number (NIC/Passport) is required for clear records.';
  
  if (!IDENTIFIER_PATTERN.test(String(form.profile?.idNumber ?? '').trim())) return 'ID number should contain 5 to 30 letters, numbers, hyphens, or underscores only.';
  
  return null;
};

export const validateAdminReservationForm = (form) => {
  if (isBlank(form.guestUserId)) return 'Select a guest for the reservation.';
  if (isBlank(form.roomTypeId)) return 'Select a room type.';
  if (isBlank(form.checkInDate)) return 'Check-in date is required.';
  const d = new Date();
  const todayString = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  if (String(form.checkInDate) < todayString) return 'Check-in date cannot be in the past.';
  if (isBlank(form.checkOutDate)) return 'Check-out date is required.';
  if (new Date(form.checkOutDate) <= new Date(form.checkInDate)) return 'Check-out date must be after check-in date.';
  if (Number.isNaN(toNumber(form.adults)) || toNumber(form.adults) < 1) return 'At least one adult is required.';
  if (Number.isNaN(toNumber(form.children)) || toNumber(form.children) < 0) return 'Children count cannot be negative.';
  if (Number.isNaN(toNumber(form.discountAmount || 0)) || toNumber(form.discountAmount || 0) < 0) return 'Discount amount cannot be negative.';
  if (!isBlank(form.arrivalTime) && !TIME_PATTERN.test(String(form.arrivalTime ?? '').trim())) return 'Arrival time should look like 2:00 PM or 14:00.';
  return null;
};

export const validateRoleForm = (form, isEditing = false) => {
  if (!isEditing && isBlank(form.name)) return 'Role name is required.';
  if (!isEditing && !/^[a-z_]+$/.test(String(form.name ?? '').trim())) return 'Role name should use lowercase letters and underscores only.';
  if (isBlank(form.description)) return 'Role description is required.';
  if (!Array.isArray(form.permissions) || form.permissions.length === 0) return 'Select at least one permission.';

  const modulesWithActions = new Set();
  const modulesWithRead = new Set();

  for (const perm of form.permissions) {
    const [module, action] = perm.split('.');
    if (action === 'read') {
      modulesWithRead.add(module);
    } else {
      modulesWithActions.add(module);
    }
  }

  for (const module of modulesWithActions) {
    if (!modulesWithRead.has(module)) {
      return `Please select the 'read' permission for '${module}' before granting other capabilities.`;
    }
  }

  return null;
};

export const validateGenerateInvoiceForm = (form) => {
  if (isBlank(form.reservationId)) return 'Select a reservation before generating an invoice.';
  return null;
};

export const validateChargeForm = (form) => {
  if (isBlank(form.reservationId)) return 'A reservation is required for folio charges.';
  if (isBlank(form.description)) return 'Charge description is required.';
  const price = toNumber(form.unitPrice);
  if (Number.isNaN(price) || price <= 0) return 'Unit price must be a positive number greater than 0.';
  const qty = toNumber(form.quantity);
  if (Number.isNaN(qty) || !Number.isInteger(qty) || qty < 1) return 'Quantity must be a whole number of at least 1.';
  if (isBlank(form.chargeDate)) return 'Charge date is required.';
  return null;
};

export const validatePaymentForm = (form, invoice = null) => {
  if (isBlank(form.invoiceId)) return 'Select an invoice before recording payment.';
  if (Number.isNaN(toNumber(form.amount)) || toNumber(form.amount) <= 0) return 'Payment amount must be greater than 0.';
  if (invoice && form.status === 'success' && toNumber(form.amount) > Number(invoice.balanceAmount ?? 0)) {
    return 'Successful payment cannot exceed the invoice balance.';
  }
  return null;
};

export const validateSettingsForm = (form) => {
  if (isBlank(form.hotelName)) return 'Hotel name is required.';
  if (isBlank(form.brandName)) return 'Brand name is required.';
  if (!EMAIL_PATTERN.test(String(form.contactEmail ?? '').trim())) return 'Enter a valid contact email address.';
  if (!PHONE_PATTERN.test(String(form.contactPhone ?? '').trim())) return 'Enter a valid contact phone number.';
  if (isBlank(form.address)) return 'Hotel address is required.';
  if (!isBlank(form.contactChannels?.supportEmail) && !EMAIL_PATTERN.test(String(form.contactChannels?.supportEmail ?? '').trim())) return 'Enter a valid support email address.';
  if (!isBlank(form.contactChannels?.reservationsEmail) && !EMAIL_PATTERN.test(String(form.contactChannels?.reservationsEmail ?? '').trim())) return 'Enter a valid reservations email address.';
  if (!isBlank(form.contactChannels?.reservationsPhone) && !PHONE_PATTERN.test(String(form.contactChannels?.reservationsPhone ?? '').trim())) return 'Enter a valid reservations phone number.';
  if (!isBlank(form.contactChannels?.whatsappPhone) && !PHONE_PATTERN.test(String(form.contactChannels?.whatsappPhone ?? '').trim())) return 'Enter a valid WhatsApp contact number.';
  if (isBlank(form.currency)) return 'Currency is required.';
  if (isBlank(form.timezone)) return 'Timezone is required.';
  if (isBlank(form.checkInTime) || isBlank(form.checkOutTime)) return 'Check-in and check-out times are required.';
  if (isBlank(form.taxRules?.[0]?.name)) return 'Primary tax name is required.';
  if (Number.isNaN(Number(form.taxRules?.[0]?.percentage ?? 0)) || Number(form.taxRules?.[0]?.percentage ?? 0) < 0) return 'Primary tax percentage cannot be negative.';
  if (isBlank(form.websiteSettings?.heroTitle)) return 'Website hero title is required.';
  if (isBlank(form.websiteSettings?.heroSubtitle)) return 'Website hero subtitle is required.';
  if (isBlank(form.websiteSettings?.footerDescription)) return 'Footer description is required.';
  if (isBlank(form.seoSettings?.metaTitle)) return 'SEO meta title is required.';
  if (isBlank(form.seoSettings?.metaDescription)) return 'SEO meta description is required.';
  if (!isValidUrlOrBlank(form.websiteSettings?.mapEmbedUrl)) return 'Map embed URL should be a valid URL.';
  if (form.websiteSettings?.heroGalleryUrls?.some((url) => !isValidUrlOrBlank(url))) return 'Each hero gallery image should use a valid URL.';
  if (!isValidUrlOrBlank(form.websiteSettings?.aboutHeroImageUrl)) return 'About hero image URL should be valid.';
  if (!isValidUrlOrBlank(form.websiteSettings?.storyImageUrl)) return 'Story image URL should be valid.';
  if (!isValidUrlOrBlank(form.websiteSettings?.diningImageUrl)) return 'Dining image URL should be valid.';
  if (!isValidUrlOrBlank(form.websiteSettings?.wellnessImageUrl)) return 'Wellness image URL should be valid.';
  if (!isValidUrlOrBlank(form.websiteSettings?.eventsImageUrl)) return 'Events image URL should be valid.';
  if (!isValidUrlOrBlank(form.websiteSettings?.destinationImageUrl)) return 'Destination image URL should be valid.';
  if (!isValidUrlOrBlank(form.websiteSettings?.contactImageUrl)) return 'Contact image URL should be valid.';
  if (!isValidUrlOrBlank(form.websiteSettings?.galleryHighlightUrl)) return 'Gallery highlight image URL should be valid.';
  if (!isValidUrlOrBlank(form.socialLinks?.facebook)) return 'Facebook URL should be valid.';
  if (!isValidUrlOrBlank(form.socialLinks?.instagram)) return 'Instagram URL should be valid.';
  if (!isValidUrlOrBlank(form.socialLinks?.linkedin)) return 'LinkedIn URL should be valid.';
  if (!isValidUrlOrBlank(form.socialLinks?.x)) return 'X / Twitter URL should be valid.';
  if (!isValidUrlOrBlank(form.socialLinks?.youtube)) return 'YouTube URL should be valid.';
  return null;
};

export const validatePricingRulesForm = (form) => {
  if (isBlank(form.currency)) return 'Currency is required.';
  if (isBlank(form.timezone)) return 'Timezone is required.';
  if (isBlank(form.checkInTime) || isBlank(form.checkOutTime)) return 'Check-in and check-out times are required.';
  if (!Array.isArray(form.taxRules) || form.taxRules.length === 0) return 'Add at least one tax rule.';
  for (const rule of form.taxRules) {
    if (isBlank(rule.name)) return 'Each tax rule needs a name.';
    if (isBlank(rule.appliesTo)) return 'Each tax rule needs an applies-to value.';
    if (Number.isNaN(Number(rule.percentage)) || Number(rule.percentage) < 0) return 'Tax rule percentages cannot be negative.';
  }
  return null;
};

export const validatePoliciesForm = (form) => {
  if (isBlank(form.hotelName)) return 'Hotel name is required.';
  if (isBlank(form.brandName)) return 'Brand name is required.';
  if (!EMAIL_PATTERN.test(String(form.contactEmail ?? '').trim())) return 'Enter a valid contact email address.';
  if (!PHONE_PATTERN.test(String(form.contactPhone ?? '').trim())) return 'Enter a valid contact phone number.';
  if (isBlank(form.cancellationPolicy)) return 'Cancellation policy is required.';
  if (isBlank(form.invoiceTerms)) return 'Invoice terms are required.';
  return null;
};

export const validateAccountSettingsForm = (form) => {
  if (isBlank(form.firstName)) return 'First name is required.';
  if (isBlank(form.lastName)) return 'Last name is required.';
  if (!isValidName(form.firstName)) return 'First name should contain letters only, with spaces or punctuation where needed.';
  if (!isValidName(form.lastName)) return 'Last name should contain letters only, with spaces or punctuation where needed.';
  if (!EMAIL_PATTERN.test(String(form.email ?? '').trim())) return 'Enter a valid account email address.';
  if (!PHONE_PATTERN.test(String(form.phone ?? '').trim())) return 'Enter a valid phone number.';
  if (!isBlank(form.password) && String(form.password).trim().length < 8) return 'New password must be at least 8 characters.';
  return null;
};

export const validateCheckInDraft = (draft, hasAssignedRoom) => {
  if (!hasAssignedRoom && isBlank(draft.roomId)) return 'Assign a room before check-in.';
  if (isBlank(draft.idType)) return 'ID type is required for check-in.';
  if (isBlank(draft.idNumber)) return 'ID number is required for check-in.';
  if (!IDENTIFIER_PATTERN.test(String(draft.idNumber ?? '').trim())) return 'ID number should contain 5 to 30 letters, numbers, hyphens, or underscores only.';
  return null;
};
