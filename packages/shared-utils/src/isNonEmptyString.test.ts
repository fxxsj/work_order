import { describe, expect, it } from "vitest";
import { isNonEmptyString } from "./index";

describe("isNonEmptyString", () => {
  it("returns true for non-empty strings", () => {
    expect(isNonEmptyString("hello")).toBe(true);
  });

  it("returns false for empty or whitespace strings", () => {
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString("   ")).toBe(false);
  });

  it("returns false for non-string values", () => {
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });
});
