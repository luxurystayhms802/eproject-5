export const average = (values = []) => {
  const numericValues = values.map((value) => Number(value ?? 0)).filter((value) => Number.isFinite(value));
  if (!numericValues.length) {
    return 0;
  }
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
};

export const buildForecastSeries = (trend = [], periods = 3) => {
  const cleanedTrend = (trend ?? []).map((item) => ({
    label: String(item.label ?? ''),
    value: Number(item.value ?? 0),
    forecast: false,
  }));

  if (!cleanedTrend.length) {
    return [];
  }

  const values = cleanedTrend.map((item) => item.value);
  const trailingAverage = average(values.slice(-3));
  const lastLabel = cleanedTrend[cleanedTrend.length - 1]?.label ?? '';

  const forecastPoints = Array.from({ length: periods }).map((_, index) => ({
    label: `${lastLabel || 'Next'} +${index + 1}`,
    value: Number(trailingAverage.toFixed(2)),
    forecast: true,
  }));

  return [...cleanedTrend, ...forecastPoints];
};

export const getTrendDirection = (trend = []) => {
  if ((trend ?? []).length < 2) {
    return 'stable';
  }

  const first = Number(trend[0]?.value ?? 0);
  const last = Number(trend[trend.length - 1]?.value ?? 0);

  if (last > first) {
    return 'up';
  }

  if (last < first) {
    return 'down';
  }

  return 'stable';
};

export const formatDirectionLabel = (direction) => {
  if (direction === 'up') {
    return 'Trending up';
  }

  if (direction === 'down') {
    return 'Trending down';
  }

  return 'Stable';
};
