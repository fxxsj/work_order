import { describe, expect, it } from "vitest";
import { maskEmail } from "./index";

describe("maskEmail", () => {
  it("masks normal email", () => {
    expect(maskEmail("alice@example.com")).toBe("a***e@example.com");
  });

  it("handles short names", () => {
    expect(maskEmail("ab@example.com")).toBe("**@example.com");
  });

  it("returns original value for invalid emails", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});
