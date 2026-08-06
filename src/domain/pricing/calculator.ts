import type { JewelleryItem, Quote, QuoteBreakdown } from "@/domain/models";

const finite = (value: number) => (Number.isFinite(value) ? value : 0);

const money = (value: number) =>
  Math.round((finite(value) + Number.EPSILON) * 100) / 100;

const percentage = (base: number, rate: number) => money(base * (rate / 100));

export function calculateQuote(
  item: JewelleryItem,
  quote: Quote,
): QuoteBreakdown {
  const warnings: string[] = [];
  const weight = finite(item.weightGrams);
  const metalRate = finite(quote.metalRatePerGram);
  const makingValue = finite(quote.makingChargeValue);
  const metalValue = money(metalRate * weight);

  let makingCharge: number | null = 0;
  if (quote.makingChargeType === "percentage") {
    makingCharge = percentage(metalValue, makingValue);
  } else if (quote.makingChargeType === "fixed") {
    makingCharge = money(makingValue);
  } else if (quote.makingChargeType === "perGram") {
    makingCharge = money(makingValue * weight);
  } else if (quote.makingChargeType === "unknown") {
    makingCharge = null;
    warnings.push("Making charge is unknown");
  }

  const knownMakingCharge = makingCharge ?? 0;
  const subtotalBeforeDiscount = money(
    metalValue + knownMakingCharge + finite(quote.additionalFees),
  );

  let discount: number | null = 0;
  if (quote.discountType === "percentage") {
    discount = percentage(subtotalBeforeDiscount, finite(quote.discountValue));
  } else if (quote.discountType === "fixed") {
    discount = money(finite(quote.discountValue));
  } else if (quote.discountType === "unknown") {
    discount = null;
    warnings.push("Discount is unknown");
  }

  const taxableSubtotal = money(
    Math.max(0, subtotalBeforeDiscount - (discount ?? 0)),
  );
  const gst = percentage(taxableSubtotal, finite(quote.gstPercent));
  const shopPayablePrice = money(taxableSubtotal + gst);

  let refund: number | null = 0;
  if (quote.refundType === "percentage") {
    refund = percentage(shopPayablePrice, finite(quote.refundValue));
  } else if (quote.refundType === "fixed") {
    refund = money(finite(quote.refundValue));
  } else if (quote.refundType === "unknown") {
    refund = null;
    warnings.push("Tourist refund is unknown");
  }

  const finalCost = money(Math.max(0, shopPayablePrice - (refund ?? 0)));
  const effectivePricePerGram = weight > 0 ? money(finalCost / weight) : 0;

  return {
    metalValue,
    makingCharge,
    additionalFees: money(finite(quote.additionalFees)),
    discount,
    taxableSubtotal,
    gst,
    shopPayablePrice,
    refund,
    finalCost,
    effectivePricePerGram,
    isComplete: warnings.length === 0,
    warnings,
  };
}
