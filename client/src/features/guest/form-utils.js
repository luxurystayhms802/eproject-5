const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]{0,49}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-_/]{4,29}$/;

const isBlank = (value) => String(value ?? '').trim() === '';

const validateIdNumberStrict = (idType, idNumber) => {
  const type = String(idType ?? '').trim();
  const num = String(idNumber ?? '').trim();
  
  if (type === 'cnic') {
    if (!/^\d{5}-?\d{7}-?\d{1}$/.test(num)) {
      return 'CNIC must be a valid 13-digit format (e.g. 12345-1234567-1).';
    }
    return null;
  }
  
  if (type === 'passport') {
    if (!/^[A-Za-z0-9]{6,15}$/.test(num)) {
      return 'Passport number should be 6 to 15 alphanumeric characters.';
    }
    return null;
  }
  
  if (type === 'driving_license') {
    if (!/^[A-Za-z0-9\-_]{5,20}$/.test(num)) {
      return 'Driving license should be 5 to 20 characters.';
    }
    return null;
  }
  
  if (!IDENTIFIER_PATTERN.test(num)) {
    return 'ID number should contain 5 to 30 letters, numbers, hyphens, or underscores only.';
  }
  
  return null;
};

export const validateGuestProfileForm = (form) => {
  if (!NAME_PATTERN.test(String(form.firstName ?? '').trim())) return 'Enter a valid first name.';
  if (!NAME_PATTERN.test(String(form.lastName ?? '').trim())) return 'Enter a valid last name.';
  if (!EMAIL_PATTERN.test(String(form.email ?? '').trim())) return 'Enter a valid email address.';
  if (!PHONE_PATTERN.test(String(form.phone ?? '').trim())) return 'Enter a valid phone number.';
  if (!isBlank(form.profile?.idNumber)) {
    if (isBlank(form.profile?.idType)) return 'ID Type must be selected to validate ID Number.';
    const idError = validateIdNumberStrict(form.profile?.idType, form.profile?.idNumber);
    if (idError) return idError;
  }
  if (!isBlank(form.profile?.emergencyContact?.phone) && !PHONE_PATTERN.test(String(form.profile?.emergencyContact?.phone ?? '').trim())) {
    return 'Enter a valid emergency contact phone number.';
  }

  return null;
};

export const validateGuestServiceRequestForm = (form, hasEligibleReservations) => {
  if (!hasEligibleReservations) return 'No confirmed or checked-in stays are available for service requests right now.';
  if (isBlank(form.reservationId)) return 'Select the stay you want to attach this request to.';
  if (String(form.description ?? '').trim().length < 8) return 'Add a request description with at least 8 characters.';
  return null;
};

export const validateGuestFeedbackForm = (form, hasEligibleReservations) => {
  if (!hasEligibleReservations) return 'Only completed stays without an existing review can receive feedback.';
  if (isBlank(form.reservationId)) return 'Select a checked-out reservation before submitting feedback.';
  if (String(form.title ?? '').trim().length < 4) return 'Feedback title should be at least 4 characters long.';
  if (String(form.comment ?? '').trim().length < 10) return 'Please add a more detailed feedback comment.';
  const rating = Number(form.rating);
  if (Number.isNaN(rating) || rating < 1 || rating > 5) return 'Rating must stay between 1 and 5.';
  return null;
};
