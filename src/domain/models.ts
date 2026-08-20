export type MetalType = "gold" | "silver" | "platinum" | "other";

export type MakingChargeType =
  "none" | "percentage" | "fixed" | "perGram" | "unknown";

export type AdjustmentType = "none" | "percentage" | "fixed" | "unknown";

export interface ComparisonSession {
  id: string;
  name: string;
  currency: "SGD";
  status: "draft" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface JewelleryItem {
  id: string;
  sessionId: string;
  name: string;
  category: string;
  metal: MetalType;
  purity: string;
  weightGrams: number;
  comparisonGroup: string;
  photoDataUrl?: string;
  photoSizeBytes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  itemId: string;
  shopId: string;
  metalRatePerGram: number;
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  gstPercent: number;
  gstNotApplicable?: boolean;
  discountType: AdjustmentType;
  discountValue: number;
  additionalFees: number;
  refundType: AdjustmentType;
  refundValue: number;
  refundNotApplicable?: boolean;
  quotedAt?: string;
  notes?: string;
  calculationVersion: 1;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteBreakdown {
  metalValue: number;
  makingCharge: number | null;
  additionalFees: number;
  discount: number | null;
  taxableSubtotal: number;
  gst: number;
  shopPayablePrice: number;
  refund: number | null;
  finalCost: number;
  effectivePricePerGram: number;
  isComplete: boolean;
  warnings: string[];
}
