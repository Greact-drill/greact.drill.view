export const formatNumber = (
  value: number | null | undefined,
  precision?: number | null
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  const digits = precision != null ? precision : 2;
  return value.toFixed(digits);
};

export const formatNumberWithUnit = (
  value: number | null | undefined,
  unit?: string,
  precision?: number | null
): string => {
  const formatted = formatNumber(value, precision);
  if (formatted === '--') {
    return formatted;
  }
  return unit ? `${formatted} ${unit}` : formatted;
};
