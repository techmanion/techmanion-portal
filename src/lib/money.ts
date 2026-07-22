/**
 * Money helpers. Every monetary value in this app is stored as an INTEGER in
 * minor units (paisa/cents) plus an ISO-4217 currency code — see
 * docs/architecture.md §5. No floating-point money anywhere; all arithmetic
 * here is on integers.
 *
 * v1 assumes a 2-decimal minor unit (paisa, cents). Zero-decimal currencies
 * (JPY, etc.) are out of scope until Phase 3 multi-currency reporting.
 */

const MINOR_UNIT_DIGITS = 2;
const MINOR_UNIT_FACTOR = 10 ** MINOR_UNIT_DIGITS; // 100

export const DEFAULT_CURRENCY = "PKR";

export interface Money {
  /** Integer amount in minor units (paisa/cents). */
  amount: number;
  /** ISO-4217 code, e.g. "PKR". */
  currency: string;
}

/**
 * Convert a major-unit value (e.g. from a form input, `"1500.50"` or `1500.5`)
 * into integer minor units. Rounds to the nearest minor unit to absorb any
 * floating-point representation error.
 */
export function toMinorUnits(major: number | string): number {
  const n = typeof major === "string" ? Number(major.trim()) : major;
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid money value: ${JSON.stringify(major)}`);
  }
  return Math.round(n * MINOR_UNIT_FACTOR);
}

/** Convert integer minor units back to a major-unit number (for editing/export). */
export function fromMinorUnits(minor: number): number {
  assertInteger(minor);
  return minor / MINOR_UNIT_FACTOR;
}

/**
 * Format minor units for display, right-aligned currency style
 * (docs/design-doc.md §4). Defaults to PKR / en-PK.
 */
export function formatMoney(
  minor: number,
  currency: string = DEFAULT_CURRENCY,
  locale = "en-PK",
): string {
  assertInteger(minor);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: MINOR_UNIT_DIGITS,
    maximumFractionDigits: MINOR_UNIT_DIGITS,
  }).format(minor / MINOR_UNIT_FACTOR);
}

/** Sum minor-unit amounts. Integer-only; guards against float inputs. */
export function sumMinor(...amounts: number[]): number {
  return amounts.reduce((total, a) => {
    assertInteger(a);
    return total + a;
  }, 0);
}

/**
 * Throw unless every amount shares the same currency. Enforces the integrity
 * rule "money on the same record must share one currency" (data-model.md §7);
 * v1 does no cross-currency conversion.
 */
export function assertSameCurrency(...values: Money[]): void {
  if (values.length === 0) return;
  const currency = values[0].currency;
  const mismatch = values.find((v) => v.currency !== currency);
  if (mismatch) {
    throw new Error(
      `Currency mismatch: expected ${currency}, got ${mismatch.currency}. ` +
        `v1 does not convert between currencies.`,
    );
  }
}

function assertInteger(minor: number): void {
  if (!Number.isInteger(minor)) {
    throw new Error(
      `Money must be an integer number of minor units, got ${minor}. ` +
        `Use toMinorUnits() before storing/computing.`,
    );
  }
}
