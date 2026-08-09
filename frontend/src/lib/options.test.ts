import { describe, expect, it } from "vitest";
import { PROJECT_CURRENCIES } from "./options";

describe("PROJECT_CURRENCIES", () => {
  it("only allows PKR, USD, EUR, and GBP", () => {
    expect(PROJECT_CURRENCIES).toEqual(["PKR", "USD", "EUR", "GBP"]);
  });
});
