import { describe, expect, it } from "vitest";
import type { BankAccount } from "../types";
import { bankAccountOptionLabel, defaultBankAccountId, distinctValues, PROJECT_CURRENCIES } from "./options";

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

describe("excluded bank accounts", () => {
  const account = (id: number, excludeFromTotals: boolean) =>
    ({ id, name: `Account ${id}`, currency: "PKR", excludeFromTotals }) as BankAccount;

  it("never defaults to an excluded account", () => {
    expect(defaultBankAccountId([account(1, true), account(2, false)])).toBe(2);
    expect(defaultBankAccountId([account(1, true)])).toBeNull();
  });

  it("labels excluded accounts in dropdowns", () => {
    expect(bankAccountOptionLabel(account(1, false))).toBe("Account 1 (PKR)");
    expect(bankAccountOptionLabel(account(1, true))).toBe("Account 1 (PKR) · Not in totals");
  });
});
