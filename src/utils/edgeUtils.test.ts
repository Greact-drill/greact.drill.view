import { describe, expect, it } from "vitest";
import { transformRawAttributes } from "./edgeUtils";

describe("transformRawAttributes", () => {
  it("maps bypass/drive states to normal conditions", () => {
    const result = transformRawAttributes(
      {
        P2_feed: 0,
        "PC_IO_2.30": 0,
        "PC_IO_2.25": 1,
        "PC_IO_2.26": 1,
      },
      "14820"
    );

    expect(result.bypass_state).toBe("closed");
    expect(result.drive_state).toBe("normal");
  });

  it("maps аварийные состояния when values are out of normal", () => {
    const result = transformRawAttributes(
      {
        P2_feed: 1,
        "PC_IO_2.30": 0,
        "PC_IO_2.25": 0,
        "PC_IO_2.26": 1,
        "PC_IO_2.31": 1,
      },
      "14820"
    );

    expect(result.bypass_state).toBe("open");
    expect(result.drive_state).toBe("error");
    expect(result.daily_maintenance).toBe(false);
  });
});
