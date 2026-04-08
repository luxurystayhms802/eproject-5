const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');

export const deriveNameParts = (record, fallback = 'LuxuryStay User') => {
  const firstName = cleanString(record?.firstName);
  const lastName = cleanString(record?.lastName);
  const email = cleanString(record?.email);
  const explicitFullName = cleanString(record?.fullName) || cleanString(record?.name);
  const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const fallbackName = email ? email.split('@')[0] : fallback;
  const fullName = explicitFullName || combinedName || fallbackName || fallback;
  const fullNameTokens = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: firstName || fullNameTokens[0] || fallback,
    lastName: lastName || fullNameTokens.slice(1).join(' '),
    fullName,
  };
};

export const deriveDisplayName = (record, fallback = 'LuxuryStay User') => deriveNameParts(record, fallback).fullName;
