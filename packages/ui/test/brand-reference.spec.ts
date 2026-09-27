import { describe, expect, it } from "vitest";
import { contrastRatio } from "../.storybook/brand/contrast";

describe("brand reference contrast", () => {
  it("reports known opaque sRGB pairs without rounding the threshold", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
    expect(contrastRatio("#123456", "#123456")).toBe(1);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.478, 3);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThan(4.5);
  });

  it("is independent of pair order and hex case", () => {
    expect(contrastRatio("#ABCDEF", "#102030")).toBe(
      contrastRatio("#102030", "#abcdef"),
    );
  });

  it.each(["#fff", "#ffffff80", "red", "#gggggg"])(
    "rejects unsupported colour %s",
    (colour) => {
      expect(() => contrastRatio(colour, "#ffffff")).toThrow(
        "six-digit colour",
      );
    },
  );
});
