import axios from 'axios';

const getFlattenedValidationMessage = (errors) => {
  const formError = Array.isArray(errors?.formErrors) ? errors.formErrors.find(Boolean) : null;
  if (formError) {
    return formError;
  }

  const fieldErrors = errors?.fieldErrors ?? {};
  for (const messages of Object.values(fieldErrors)) {
    if (Array.isArray(messages) && messages.length) {
      return messages[0];
    }
  }

  return null;
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong.') => {
  if (axios.isAxiosError(error)) {
    const validationMessage = getFlattenedValidationMessage(error.response?.data?.errors);
    return validationMessage ?? error.response?.data?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
