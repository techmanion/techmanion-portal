import { describe, expect, it } from "vitest";
import { currentMonth, formatCurrencyTotals, formatMoney } from "./format";

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

describe("currentMonth", () => {
  it("uses the local month with a zero-padded number", () => {
    expect(currentMonth(new Date(2026, 2, 15))).toBe("2026-03");
  });

  it("does not roll back to the previous month at the start of a local month", () => {
    expect(currentMonth(new Date(2026, 10, 1, 0, 30))).toBe("2026-11");
  });
});

describe("formatCurrencyTotals", () => {
  it("adds up amounts in the same currency", () => {
    const rows = [{ amount: 500000, currency: "USD" }, { amount: 250000, currency: "USD" }];
    expect(formatCurrencyTotals(rows)).toBe("US$7,500");
  });

  it("keeps currencies separate with PKR first", () => {
    const rows = [
      { amount: 500000, currency: "USD" },
      { amount: 100000, currency: "EUR" },
      { amount: 200000, currency: "PKR" },
    ];
    expect(formatCurrencyTotals(rows)).toBe(
      `${formatMoney(200000, "PKR")} · ${formatMoney(100000, "EUR")} · ${formatMoney(500000, "USD")}`,
    );
  });

  it("shows zero when there are no rows", () => {
    expect(formatCurrencyTotals([])).toBe(formatMoney(0));
  });
});
