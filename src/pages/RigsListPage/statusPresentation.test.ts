import { describe, expect, it } from "vitest";
import { formatStatusValue, getStatusClass } from "./statusPresentation";

describe("statusPresentation", () => {
  it("returns status class for boolean and state values", () => {
    expect(getStatusClass(true, "boolean")).toBe("ok");
    expect(getStatusClass(false, "boolean")).toBe("error");
    expect(getStatusClass("normal", "state")).toBe("ok");
    expect(getStatusClass("error", "state")).toBe("error");
  });

  it("formats human-readable labels for аварии and states", () => {
    expect(formatStatusValue("closed")).toBe("Закрыт");
    expect(formatStatusValue("open")).toBe("Открыт");
    expect(formatStatusValue("error")).toBe("Авария");
    expect(formatStatusValue(true)).toBe("Выполнено");
  });
});
