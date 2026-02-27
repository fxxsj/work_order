import { describe, expect, it } from "vitest";
import { toEpochSeconds } from "./index";

describe("toEpochSeconds", () => {
  it("converts date to epoch seconds", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    expect(toEpochSeconds(date)).toBe(1767225600);
  });
});
