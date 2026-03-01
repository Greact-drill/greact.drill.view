import type { WidgetType } from "../types/widget";

export type WidgetValue = number | string | boolean | null | undefined;

interface IsValueOkParams {
  value: WidgetValue;
  min?: number;
  max?: number;
  unit?: string;
  widgetType?: WidgetType;
  isStatusTag?: boolean;
}

export const parseNumericValue = (value: WidgetValue): number | null => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const parseBooleanValue = (value: WidgetValue): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return String(value).toLowerCase() === "true" || String(value) === "1";
};

export const isWidgetValueOK = ({
  value,
  min = 0,
  max = 100,
  unit = "",
  widgetType,
  isStatusTag = false,
}: IsValueOkParams): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  const numericValue = parseNumericValue(value);
  // Для status: 1 = OK (зелёный), 0 = ошибка (красный)
  if (widgetType === "status" && numericValue !== null) {
    return numericValue === 1;
  }

  if (unit !== "bool" && numericValue !== null) {
    return numericValue >= min && numericValue <= max;
  }

  if (unit === "bool" || isStatusTag) {
    return value === 1 || value === true || String(value).toLowerCase() === "true";
  }

  return true;
};

export const getDefaultWidgetValue = (
  widgetType: WidgetType,
  unit: string
): number | string | boolean => {
  switch (widgetType) {
    case "gauge":
    case "bar":
      return 0;
    case "number":
      return unit === "bool" ? false : 0;
    case "status":
      return "Ожидание данных";
    default:
      return "--";
  }
};
