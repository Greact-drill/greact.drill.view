import { describe, expect, it } from "vitest";
import {
  getDefaultWidgetValue,
  isWidgetValueOK,
  parseBooleanValue,
  parseNumericValue,
} from "./widgetValue";

describe("widgetValue utils", () => {
  it("parses numeric values from numbers, booleans and strings", () => {
    expect(parseNumericValue(5)).toBe(5);
    expect(parseNumericValue(true)).toBe(1);
    expect(parseNumericValue(false)).toBe(0);
    expect(parseNumericValue("12,5")).toBe(12.5);
    expect(parseNumericValue("")).toBeNull();
  });

  it("validates ranges and status values correctly", () => {
    expect(isWidgetValueOK({ value: 50, min: 0, max: 100 })).toBe(true);
    expect(isWidgetValueOK({ value: 120, min: 0, max: 100 })).toBe(false);
    expect(isWidgetValueOK({ value: "true", unit: "bool", isStatusTag: true })).toBe(true);
    expect(isWidgetValueOK({ value: 0, unit: "bool", isStatusTag: true })).toBe(false);
  });

  it("returns default widget values by type", () => {
    expect(getDefaultWidgetValue("gauge", "bar")).toBe(0);
    expect(getDefaultWidgetValue("number", "bool")).toBe(false);
    expect(getDefaultWidgetValue("status", "")).toBe("Ожидание данных");
  });

  it("parses boolean-like values", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(1)).toBe(true);
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("0")).toBe(false);
  });
});
