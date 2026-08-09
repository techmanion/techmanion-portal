import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("formats minor units using the given currency", () => {
    expect(formatMoney(500000, "USD")).toBe("US$5,000");
  });

  it("formats a different project currency distinctly from PKR", () => {
    const pkr = formatMoney(500000, "PKR");
    const eur = formatMoney(500000, "EUR");
    expect(pkr).not.toBe(eur);
  });

  it("defaults to PKR when no currency is supplied", () => {
    expect(formatMoney(500000)).toBe(formatMoney(500000, "PKR"));
  });
});
