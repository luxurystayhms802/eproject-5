import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';

export const managerDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const formatManagerCurrency = (value) => `Rs ${Number(value ?? 0).toFixed(2)}`;

export const validateManagerDateRange = ({ from, to }) => {
  if (from && !managerDatePattern.test(from)) {
    return 'Enter a valid start date.';
  }

  if (to && !managerDatePattern.test(to)) {
    return 'Enter a valid end date.';
  }

  if (from && to && new Date(from) > new Date(to)) {
    return 'Start date cannot be after end date.';
  }

  return null;
};

export const buildManagerReportParams = ({ from, to }) => {
  const params = {};

  if (from) {
    params.from = new Date(`${from}T00:00:00.000Z`).toISOString();
  }

  if (to) {
    params.to = new Date(`${to}T23:59:59.999Z`).toISOString();
  }

  return params;
};

export const getManagerRangeLabel = ({ from, to }, fallback = 'Default reporting window') => {
  if (from && to) {
    return `${from} to ${to}`;
  }

  if (from) {
    return `From ${from}`;
  }

  if (to) {
    return `Until ${to}`;
  }

  return fallback;
};

export const downloadManagerReportCsv = async ({ reportKey, range, exportFn, label }) => {
  try {
    const blob = await exportFn(reportKey, buildManagerReportParams(range));
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `luxurystay-manager-${reportKey}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${label} exported successfully.`);
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Unable to export this manager report right now.'));
  }
};
