import { describe, expect, it } from "vitest";
import type { JewelleryItem, Quote } from "@/domain/models";
import { calculateQuote } from "./calculator";

const item: JewelleryItem = {
  id: "item-1",
  sessionId: "session-1",
  name: "Wedding necklace",
  category: "Necklace",
  metal: "gold",
  purity: "22K (916)",
  weightGrams: 10,
  comparisonGroup: "necklace-gold-916",
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
};

const quote: Quote = {
  id: "quote-1",
  itemId: item.id,
  shopId: "shop-1",
  metalRatePerGram: 100,
  makingChargeType: "fixed",
  makingChargeValue: 150,
  gstPercent: 9,
  discountType: "none",
  discountValue: 0,
  additionalFees: 0,
  refundType: "percentage",
  refundValue: 6.5,
  calculationVersion: 1,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
};

describe("calculateQuote", () => {
  it("calculates fixed making charge, GST and refund", () => {
    expect(calculateQuote(item, quote)).toMatchObject({
      metalValue: 1000,
      makingCharge: 150,
      gst: 103.5,
      shopPayablePrice: 1253.5,
      refund: 81.48,
      finalCost: 1172.02,
      isComplete: true,
    });
  });

  it("supports percentage making charges", () => {
    const result = calculateQuote(item, {
      ...quote,
      makingChargeType: "percentage",
      makingChargeValue: 10,
      refundType: "none",
    });
    expect(result.makingCharge).toBe(100);
    expect(result.finalCost).toBe(1199);
  });

  it("marks an unknown making charge as incomplete", () => {
    const result = calculateQuote(item, {
      ...quote,
      makingChargeType: "unknown",
      refundType: "none",
    });
    expect(result.makingCharge).toBeNull();
    expect(result.isComplete).toBe(false);
    expect(result.warnings).toContain("Making charge is unknown");
  });

  it("never returns NaN for empty numeric form values", () => {
    const result = calculateQuote(item, {
      ...quote,
      metalRatePerGram: Number.NaN,
      makingChargeValue: Number.NaN,
      gstPercent: Number.NaN,
      refundValue: Number.NaN,
    });

    expect(result.finalCost).toBe(0);
    expect(Number.isNaN(result.finalCost)).toBe(false);
    expect(Number.isNaN(result.effectivePricePerGram)).toBe(false);
  });
});
