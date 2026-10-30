import { describe, expect, it } from "vitest";
import { distinctValues, PROJECT_CURRENCIES } from "./options";

describe("PROJECT_CURRENCIES", () => {
  it("only allows PKR, USD, EUR, and GBP", () => {
    expect(PROJECT_CURRENCIES).toEqual(["PKR", "USD", "EUR", "GBP"]);
  });
});

describe("distinctValues", () => {
  it("sorts, trims, and removes blanks", () => {
    expect(distinctValues(["Utilities", " Rent ", null, "  "])).toEqual(["Rent", "Utilities"]);
  });

  it("treats different capitalisations as one value and keeps the first spelling", () => {
    expect(distinctValues(["Rent", "rent", "RENT"])).toEqual(["Rent"]);
  });
});
