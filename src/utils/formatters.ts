export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  return value.toFixed(2);
};

export const formatNumberWithUnit = (
  value: number | null | undefined,
  unit?: string
): string => {
  const formatted = formatNumber(value);
  if (formatted === '--') {
    return formatted;
  }
  return unit ? `${formatted} ${unit}` : formatted;
};
