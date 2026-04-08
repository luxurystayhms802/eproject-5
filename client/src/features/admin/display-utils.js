const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');

export const getDisplayName = (record, fallback = 'Unknown user') => {
  if (!record) {
    return fallback;
  }

  const fullName = cleanString(record.fullName) || cleanString(record.name);
  if (fullName && fullName.toLowerCase() !== 'undefined') {
    return fullName;
  }

  const combinedName = [cleanString(record.firstName), cleanString(record.lastName)].filter(Boolean).join(' ').trim();
  if (combinedName) {
    return combinedName;
  }

  const email = cleanString(record.email);
  if (email) {
    return email;
  }

  const employeeCode = cleanString(record.employeeCode);
  if (employeeCode) {
    return employeeCode;
  }

  return fallback;
};
