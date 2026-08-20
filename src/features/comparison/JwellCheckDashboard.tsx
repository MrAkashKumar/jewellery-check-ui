"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm, useWatch } from "react-hook-form";
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Gem,
  Plus,
  Save,
  Search,
  Share2,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import type { JewelleryItem, Quote } from "@/domain/models";
import { HeaderLinks } from "@/components/HeaderLinks";
import {
  APP,
  JEWELLERY_CATEGORIES,
  ITEM_IMAGE_CONFIG,
  PRICING_DEFAULTS,
  PURITY_OPTIONS,
  UI_COPY,
  UI_TIMINGS,
} from "@/config/app-constants";
import { calculateQuote } from "@/domain/pricing/calculator";
import { compressItemImage } from "./compress-item-image";
import { createShareImage } from "./create-share-image";
import { db } from "@/infrastructure/database/jwellcheck-db";
import {
  addItem,
  addQuote,
  addShop,
  DEMO_SESSION_ID,
  seedDatabase,
  updateItem,
  updateQuote,
  updateShop,
} from "@/infrastructure/repositories/comparison-repository";
import styles from "./JwellCheckDashboard.module.css";

type QuoteForm = Pick<
  Quote,
  | "metalRatePerGram"
  | "makingChargeType"
  | "makingChargeValue"
  | "gstPercent"
  | "gstNotApplicable"
  | "discountType"
  | "discountValue"
  | "additionalFees"
  | "refundType"
  | "refundValue"
  | "refundNotApplicable"
  | "notes"
>;

const money = new Intl.NumberFormat(APP.locale, {
  style: "currency",
  currency: APP.currency,
  minimumFractionDigits: 2,
});

type RankedQuote = {
  quote: Quote;
  item: JewelleryItem | undefined;
  total: ReturnType<typeof calculateQuote>;
};

function explainPriceAdvantage(best: RankedQuote, next: RankedQuote) {
  const candidates = [
    {
      label:
        best.quote.metalRatePerGram < next.quote.metalRatePerGram
          ? "lower gold rate"
          : "lower metal value",
      amount: next.total.metalValue - best.total.metalValue,
    },
    {
      label: "lower making charge",
      amount:
        (next.total.makingCharge ?? 0) - (best.total.makingCharge ?? 0),
    },
    { label: "lower GST", amount: next.total.gst - best.total.gst },
    {
      label: "better discount",
      amount: (best.total.discount ?? 0) - (next.total.discount ?? 0),
    },
    {
      label: "higher tourist refund",
      amount: (best.total.refund ?? 0) - (next.total.refund ?? 0),
    },
  ].sort((a, b) => b.amount - a.amount);
  const main = candidates[0];
  return main.amount > 0.005
    ? `Main advantage: ${main.label} by ${money.format(main.amount)}`
    : "Lowest combined final price";
}

function localDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function shopDateLabel(value: string, today = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const calendarDay = (current: Date) =>
    Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  const daysAgo = Math.round(
    (calendarDay(today) - calendarDay(date)) / 86_400_000,
  );
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return new Intl.DateTimeFormat(APP.locale, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function JwellCheckDashboard() {
  const [ready, setReady] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>();
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [message, setMessage] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [mobileShopMenuOpen, setMobileShopMenuOpen] = useState(false);
  const [showGstEditor, setShowGstEditor] = useState(false);
  const [showRefundEditor, setShowRefundEditor] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const photoChooserRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    seedDatabase().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!saveConfirmation) return;
    const timeout = window.setTimeout(
      () => setSaveConfirmation(0),
      UI_TIMINGS.saveSuccessMs,
    );
    return () => window.clearTimeout(timeout);
  }, [saveConfirmation]);

  useEffect(() => {
    if (!saveError) return;
    const timeout = window.setTimeout(
      () => setSaveError(""),
      UI_TIMINGS.saveErrorMs,
    );
    return () => window.clearTimeout(timeout);
  }, [saveError]);

  useEffect(() => {
    if (!photoMenuOpen) return;
    function closePhotoMenu(event: PointerEvent) {
      if (!photoChooserRef.current?.contains(event.target as Node)) {
        setPhotoMenuOpen(false);
      }
    }
    function closePhotoMenuWithKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setPhotoMenuOpen(false);
    }
    document.addEventListener("pointerdown", closePhotoMenu);
    document.addEventListener("keydown", closePhotoMenuWithKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closePhotoMenu);
      document.removeEventListener("keydown", closePhotoMenuWithKeyboard);
    };
  }, [photoMenuOpen]);

  useEffect(() => {
    function updateHeaderSurface() {
      setHeaderScrolled(window.scrollY > 8);
    }
    updateHeaderSurface();
    window.addEventListener("scroll", updateHeaderSurface, { passive: true });
    return () => window.removeEventListener("scroll", updateHeaderSurface);
  }, []);


  const items = useLiveQuery(
    () =>
      db.items.where("sessionId").equals(DEMO_SESSION_ID).sortBy("createdAt"),
    [ready],
    [],
  );
  const shops = useLiveQuery(() => db.shops.toArray(), [ready], []);
  const quotes = useLiveQuery(() => db.quotes.toArray(), [ready], []);
  const shopGroups = useMemo(() => {
    const now = new Date();
    const groups = new Map<
      string,
      { label: string; entries: Array<(typeof shops)[number]> }
    >();
    [...shops]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .forEach((entry) => {
        const key = localDateKey(entry.createdAt);
        const group = groups.get(key) ?? {
          label: shopDateLabel(entry.createdAt, now),
          entries: [],
        };
        group.entries.push(entry);
        groups.set(key, group);
      });
    return [...groups.values()];
  }, [shops]);
  const shopLabels = useMemo(
    () =>
      new Map(
        [...shops]
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((entry, index) => [
            entry.id,
            entry.name.trim() || `New shop ${index + 1}`,
          ]),
      ),
    [shops],
  );

  const activeShopId = shops.some((shop) => shop.id === selectedShopId)
    ? selectedShopId
    : shops[0]?.id;
  const shopQuotes = quotes.filter((quote) => quote.shopId === activeShopId);
  const activeItemId = shopQuotes.some(
    (quote) => quote.itemId === selectedItemId,
  )
    ? selectedItemId
    : shopQuotes[0]?.itemId;
  const item = items.find((entry) => entry.id === activeItemId);
  const quote = shopQuotes.find((entry) => entry.itemId === activeItemId);
  const shop = shops.find((entry) => entry.id === activeShopId);

  const { control, register, handleSubmit, reset, setValue } =
    useForm<QuoteForm>();
  const watched = useWatch({ control });

  useEffect(() => {
    if (!quote || !shop) return;
    reset({
      metalRatePerGram:
        quote.metalRatePerGram === 0
          ? Number.NaN
          : quote.metalRatePerGram,
      makingChargeType: quote.makingChargeType,
      makingChargeValue:
        quote.makingChargeValue === 0
          ? Number.NaN
          : quote.makingChargeValue,
      gstPercent:
        quote.gstPercent === 0
          ? Number.NaN
          : quote.gstPercent,
      gstNotApplicable: quote.gstNotApplicable ?? false,
      discountType:
        quote.discountType === "none"
          ? ("" as Quote["discountType"])
          : quote.discountType,
      discountValue: quote.discountValue,
      additionalFees: quote.additionalFees,
      refundType: quote.refundType,
      refundValue:
        quote.refundValue === 0
          ? Number.NaN
          : quote.refundValue,
      refundNotApplicable:
        quote.refundValue > 0 ? (quote.refundNotApplicable ?? false) : true,
      notes: quote.notes ?? "",
    });
  }, [quote, reset, shop]);

  const rawRefundValue = watched.refundNotApplicable
    ? 0
    : showRefundEditor
      ? watched.refundValue
      : (watched.refundValue ?? quote?.refundValue ?? 0);
  const effectiveRefundValue =
    typeof rawRefundValue === "number" && Number.isFinite(rawRefundValue)
    ? rawRefundValue
    : 0;
  const refundOptionLabel =
    effectiveRefundValue > 0
      ? `Tourist ${effectiveRefundValue}%`
      : "Tourist rate";
  const rawGstValue = watched.gstNotApplicable
    ? 0
    : showGstEditor
      ? watched.gstPercent
      : (watched.gstPercent ?? quote?.gstPercent ?? 9);
  const effectiveGstValue =
    typeof rawGstValue === "number" && Number.isFinite(rawGstValue)
      ? rawGstValue
      : 0;
  const gstOptionLabel =
    showGstEditor && effectiveGstValue <= 0
      ? "GST rate"
      : `GST ${effectiveGstValue > 0 ? effectiveGstValue : PRICING_DEFAULTS.gstPercent}%`;
  const previewQuote = quote
    ? {
        ...quote,
        metalRatePerGram: watched.metalRatePerGram ?? quote.metalRatePerGram,
        makingChargeType: watched.makingChargeType ?? quote.makingChargeType,
        makingChargeValue: watched.makingChargeValue ?? quote.makingChargeValue,
        gstPercent: watched.gstNotApplicable ? 0 : effectiveGstValue,
        gstNotApplicable:
          watched.gstNotApplicable ?? quote.gstNotApplicable ?? false,
        discountType: watched.discountType ?? quote.discountType,
        discountValue: watched.discountValue ?? quote.discountValue,
        additionalFees: 0,
        refundType:
          effectiveRefundValue > 0
            ? ("percentage" as const)
            : ("none" as const),
        refundValue: effectiveRefundValue,
      }
    : undefined;
  const breakdown =
    item && previewQuote ? calculateQuote(item, previewQuote) : undefined;
  const metalValue =
    (watched.metalRatePerGram ?? quote?.metalRatePerGram ?? 0) *
    (item?.weightGrams ?? 0);
  const fixedMakingPercentage =
    watched.makingChargeType === "fixed" &&
    metalValue > 0 &&
    Number.isFinite(watched.makingChargeValue)
      ? ((watched.makingChargeValue ?? 0) / metalValue) * 100
      : null;

  const results = useMemo(() => {
    const comparisonGroups = new Map<string, JewelleryItem[]>();
    items.forEach((currentItem) => {
      const itemName = (currentItem.category || currentItem.name)
        .trim()
        .toLowerCase();
      if (!itemName || currentItem.weightGrams <= 0) return;
      const key = [itemName, currentItem.purity.trim().toLowerCase()].join("|");
      const group = comparisonGroups.get(key) ?? [];
      group.push(currentItem);
      comparisonGroups.set(key, group);
    });

    return [...comparisonGroups.values()].map((groupItems) => {
      const currentItem = groupItems[0];
      const itemIds = new Set(groupItems.map((entry) => entry.id));
      const pricedQuotes = quotes
        .filter((entry) => itemIds.has(entry.itemId))
        .map((entry) => ({
          quote: entry,
          shop: shops.find((currentShop) => currentShop.id === entry.shopId),
          item: items.find((entryItem) => entryItem.id === entry.itemId),
        }))
        .map((entry) => ({
          ...entry,
          total: calculateQuote(entry.item ?? currentItem, entry.quote),
        }))
        .filter(
          (entry) =>
            entry.total.isComplete &&
            entry.quote.metalRatePerGram > 0 &&
            Boolean(entry.item?.weightGrams) &&
            Boolean(entry.shop),
        )
        .sort((a, b) => a.total.finalCost - b.total.finalCost);
      const seenShops = new Set<string>();
      const ranked = pricedQuotes.filter((entry) => {
        if (seenShops.has(entry.quote.shopId)) return false;
        seenShops.add(entry.quote.shopId);
        return true;
      });
      return { item: currentItem, ranked };
    });
  }, [items, quotes, shops]);

  const comparableResults = results.filter(({ ranked }) => ranked.length >= 2);

  const save = handleSubmit(async (values) => {
    if (!quote || !shop || !item) return;
    const itemName = (item.category || item.name).trim();
    if (!itemName) {
      setSaveError(UI_COPY.dashboard.validation.item);
      return;
    }
    if (!Number.isFinite(item.weightGrams) || item.weightGrams <= 0) {
      setSaveError(UI_COPY.dashboard.validation.weight);
      return;
    }
    if (
      !Number.isFinite(values.metalRatePerGram) ||
      values.metalRatePerGram <= 0
    ) {
      setSaveError(UI_COPY.dashboard.validation.rate);
      return;
    }
    if (
      showGstEditor &&
      !values.gstNotApplicable &&
      (!Number.isFinite(values.gstPercent) || values.gstPercent <= 0)
    ) {
      setSaveError(UI_COPY.dashboard.validation.gst);
      return;
    }
    if (
      showRefundEditor &&
      !values.refundNotApplicable &&
      (!Number.isFinite(values.refundValue) || values.refundValue <= 0)
    ) {
      setSaveError(UI_COPY.dashboard.validation.refund);
      return;
    }
    await updateQuote(quote.id, {
      ...values,
      metalRatePerGram: Number.isFinite(values.metalRatePerGram)
        ? values.metalRatePerGram
        : 0,
      makingChargeType: values.makingChargeType || "none",
      makingChargeValue: Number.isFinite(values.makingChargeValue)
        ? values.makingChargeValue
        : 0,
      gstPercent:
        !values.gstNotApplicable && Number.isFinite(values.gstPercent)
          ? values.gstPercent
          : 0,
      discountType: values.discountType || "none",
      discountValue: Number.isFinite(values.discountValue)
        ? values.discountValue
        : 0,
      additionalFees: 0,
      refundType:
        !values.refundNotApplicable &&
        Number.isFinite(values.refundValue) &&
        values.refundValue > 0
          ? "percentage"
          : "none",
      refundValue:
        !values.refundNotApplicable && Number.isFinite(values.refundValue)
          ? values.refundValue
          : 0,
    });
    setSaveConfirmation((current) => current + 1);
    setSaveError("");
  }, (errors) => {
    if (errors.metalRatePerGram) {
      setSaveError(UI_COPY.dashboard.validation.rate);
      return;
    }
    if (errors.makingChargeValue) {
      setSaveError(UI_COPY.dashboard.validation.makingCharge);
      return;
    }
    if (errors.gstPercent) {
      setSaveError(UI_COPY.dashboard.validation.gst);
      return;
    }
    if (errors.refundValue) {
      setSaveError(UI_COPY.dashboard.validation.refund);
      return;
    }
    if (errors.discountValue) {
      setSaveError(UI_COPY.dashboard.validation.discount);
    }
  });

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(
      () => setMessage(""),
      UI_TIMINGS.inlineMessageMs,
    );
  }

  async function createItem() {
    const shopId = activeShopId ?? (await addShop());
    const id = await addItem();
    await addQuote(id, shopId);
    setSelectedShopId(shopId);
    setSelectedItemId(id);
  }

  async function createShop() {
    const shopId = await addShop();
    const itemId = await addItem();
    await addQuote(itemId, shopId);
    setSelectedShopId(shopId);
    setSelectedItemId(itemId);
  }

  async function addItemPhoto(file?: File) {
    if (!file || !item) return;
    try {
      const compressed = await compressItemImage(file);
      await updateItem(item.id, {
        photoDataUrl: compressed.dataUrl,
        photoSizeBytes: compressed.sizeBytes,
      });
      if (compressed.sizeBytes > ITEM_IMAGE_CONFIG.warningBytes) {
        setSaveError(UI_COPY.dashboard.messages.imageTooLarge);
      }
    } catch {
      setSaveError(UI_COPY.dashboard.messages.imageFailed);
    } finally {
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      setPhotoMenuOpen(false);
    }
  }

  async function removeItemPhoto() {
    if (!item) return;
    await updateItem(item.id, { photoDataUrl: undefined, photoSizeBytes: undefined });
    setPhotoPreview(undefined);
  }

  async function deleteShop(shopId: string) {
    const confirmed = window.confirm(
      `Delete ${shopLabels.get(shopId) || "this shop"} and all of its items?`,
    );
    if (!confirmed) return;

    const linkedQuotes = quotes.filter((entry) => entry.shopId === shopId);
    const itemIds = linkedQuotes.map((entry) => entry.itemId);
    const quoteIds = linkedQuotes.map((entry) => entry.id);
    await db.transaction("rw", db.shops, db.items, db.quotes, async () => {
      await Promise.all([
        db.shops.delete(shopId),
        db.items.bulkDelete(itemIds),
        db.quotes.bulkDelete(quoteIds),
      ]);
    });

    if (shopId === activeShopId) {
      const nextShop = shops.find((entry) => entry.id !== shopId);
      const nextQuote = quotes.find((entry) => entry.shopId === nextShop?.id);
      setSelectedShopId(nextShop?.id);
      setSelectedItemId(nextQuote?.itemId);
    }
  }

  async function deleteItem(itemId: string) {
    if (shopQuotes.length <= 1) {
      flash("Every shop needs at least one item");
      return;
    }
    const itemToDelete = items.find((entry) => entry.id === itemId);
    const confirmed = window.confirm(
      `Delete ${itemToDelete?.name.trim() || "this item"} from this shop?`,
    );
    if (!confirmed) return;

    const linkedQuoteIds = quotes
      .filter((entry) => entry.itemId === itemId)
      .map((entry) => entry.id);
    await db.transaction("rw", db.items, db.quotes, async () => {
      await Promise.all([
        db.items.delete(itemId),
        db.quotes.bulkDelete(linkedQuoteIds),
      ]);
    });

    if (itemId === activeItemId) {
      const nextQuote = shopQuotes.find((entry) => entry.itemId !== itemId);
      setSelectedItemId(nextQuote?.itemId);
    }
  }

  async function share() {
    const comparisonText = results
      .map(({ item: resultItem, ranked }) =>
        ranked[0]
          ? `${resultItem.name || "Item"}: ${shopLabels.get(ranked[0].quote.shopId) || "Shop"} — ${money.format(ranked[0].total.finalCost)}`
          : `${resultItem.name || "Item"}: add another quote`,
      )
      .join("\n");
    const currentPriceText =
      item && shop && breakdown
        ? `${item.name || item.category || "Item"}: ${shop.name || "Shop"} — ${money.format(breakdown.finalCost)}`
        : UI_COPY.dashboard.subtitle;
    const text = comparisonText || currentPriceText;
    try {
      const shareImage = createShareImage({
        shop: shop?.name || UI_COPY.dashboard.shareCard.shopFallback,
        item: item?.name || item?.category || UI_COPY.dashboard.shareCard.itemFallback,
        purity: item?.purity || PRICING_DEFAULTS.purity,
        weight: `${item?.weightGrams || 0} g`,
        finalPrice: money.format(breakdown?.finalCost || 0),
        breakdown: [
          { label: UI_COPY.dashboard.shareCard.metalValue, value: money.format(breakdown?.metalValue || 0) },
          { label: UI_COPY.dashboard.shareCard.makingCharge, value: money.format(breakdown?.makingCharge || 0) },
          { label: UI_COPY.dashboard.shareCard.discount, value: `-${money.format(breakdown?.discount || 0)}` },
          { label: UI_COPY.dashboard.shareCard.subtotal, value: money.format(breakdown?.taxableSubtotal || 0) },
          { label: UI_COPY.dashboard.shareCard.gst, value: money.format(breakdown?.gst || 0) },
          { label: UI_COPY.dashboard.shareCard.shopPrice, value: money.format(breakdown?.shopPayablePrice || 0) },
          { label: UI_COPY.dashboard.shareCard.touristRefund, value: `-${money.format(breakdown?.refund || 0)}` },
          { label: UI_COPY.dashboard.labels.finalPrice, value: money.format(breakdown?.finalCost || 0) },
        ],
        comparisons: results.map(({ item: resultItem, ranked }) => ({
          item: resultItem.name || resultItem.category || UI_COPY.dashboard.shareCard.itemFallback,
          shops: ranked.map((entry, index) => ({
            shop: shopLabels.get(entry.quote.shopId) || UI_COPY.dashboard.shareCard.shopFallback,
            price: money.format(entry.total.finalCost),
            best: index === 0,
          })),
        })),
      });
      if (
        navigator.share &&
        navigator.canShare?.({ files: [shareImage] })
      ) {
        try {
          await navigator.share({ title: APP.name, text, files: [shareImage] });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          downloadShareImage(shareImage);
          flash(UI_COPY.dashboard.messages.nativeShareFallback);
          return;
        }
      } else {
        downloadShareImage(shareImage);
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // The PNG download still succeeds when clipboard permission is denied.
        }
        flash(UI_COPY.dashboard.messages.imageShareFallback);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setSaveError(UI_COPY.dashboard.messages.shareFailed);
    }
  }

  function downloadShareImage(image: File) {
    const imageUrl = URL.createObjectURL(image);
    const download = document.createElement("a");
    download.href = imageUrl;
    download.download = image.name;
    document.body.appendChild(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(imageUrl), UI_TIMINGS.mailDraftDelayMs);
  }

  async function clearAllData() {
    const confirmed = window.confirm(
      UI_COPY.dashboard.messages.clearConfirmation,
    );
    if (!confirmed) return;
    await db.transaction("rw", db.items, db.shops, db.quotes, async () => {
      await Promise.all([
        db.items.clear(),
        db.shops.clear(),
        db.quotes.clear(),
      ]);
    });
    setSelectedItemId(undefined);
    setSelectedShopId(undefined);
  }

  if (!ready) {
    return (
      <main className={styles.loading}>
        <Brand />
      </main>
    );
  }

  if (!item || !shop) {
    return (
      <div className={styles.app}>
        <header className={`${styles.header} ${headerScrolled ? styles.headerScrolled : ""}`}>
          <Brand />
          <div className={styles.headerActions}>
            <HeaderLinks />
            <button
              className={styles.clearButton}
              type="button"
              onClick={clearAllData}
              aria-label={UI_COPY.dashboard.labels.clearAll}
            >
              <Trash2 size={17} /> <span>{UI_COPY.dashboard.labels.clear}</span>
            </button>
            <button
              className={styles.ghostButton}
              type="button"
              onClick={share}
              aria-label={UI_COPY.dashboard.labels.shareComparison}
            >
              <Share2 size={17} /> <span>{UI_COPY.dashboard.labels.share}</span>
            </button>
          </div>
        </header>
        {saveError && (
          <div
            className={`${styles.saveToast} ${styles.saveErrorToast}`}
            role="alert"
            aria-live="assertive"
          >
            <span><AlertCircle size={21} /></span>
            <div>
              <strong>{UI_COPY.dashboard.cannotSave}</strong>
              <small>{saveError}</small>
            </div>
          </div>
        )}
        <main className={styles.emptyStart}>
          <span className={styles.brandMark}>
            <Gem size={25} />
          </span>
          <h1>{UI_COPY.dashboard.labels.startTitle}</h1>
          <p>{UI_COPY.dashboard.labels.startText}</p>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={createShop}
          >
            <CirclePlus size={18} /> {UI_COPY.dashboard.labels.addFirstShop}
          </button>
          <small className={styles.purchaseNote}>
            {UI_COPY.dashboard.purchaseNote}
          </small>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={`${styles.header} ${headerScrolled ? styles.headerScrolled : ""}`}>
        <Brand />
        <div className={styles.headerActions}>
          <HeaderLinks />
          <span className={styles.savedState}>{UI_COPY.dashboard.labels.savedAutomatically}</span>
          <button
            className={styles.clearButton}
            type="button"
            onClick={clearAllData}
            aria-label={UI_COPY.dashboard.labels.clearAll}
          >
            <Trash2 size={17} /> <span>{UI_COPY.dashboard.labels.clear}</span>
          </button>
          <button
            className={styles.ghostButton}
            type="button"
            onClick={share}
            aria-label={UI_COPY.dashboard.labels.shareComparison}
          >
            <Share2 size={17} /> <span>{UI_COPY.dashboard.labels.share}</span>
          </button>
        </div>
      </header>

      {saveConfirmation > 0 && (
        <div
          className={styles.saveToast}
          role="status"
          aria-live="polite"
          key={saveConfirmation}
        >
          <span>
            <CheckCircle2 size={21} />
          </span>
          <div>
            <strong>{UI_COPY.dashboard.savedSuccessfully}</strong>
            <small>{UI_COPY.dashboard.savedBrowser}</small>
          </div>
        </div>
      )}
      {saveError && (
        <div
          className={`${styles.saveToast} ${styles.saveErrorToast}`}
          role="alert"
          aria-live="assertive"
        >
          <span>
            <AlertCircle size={21} />
          </span>
          <div>
            <strong>{UI_COPY.dashboard.cannotSave}</strong>
            <small>{saveError}</small>
          </div>
        </div>
      )}
      {photoPreview && (
        <div className={styles.photoLightbox} role="dialog" aria-modal="true">
          <button
            type="button"
            className={styles.photoLightboxClose}
            aria-label={UI_COPY.dashboard.labels.closePhoto}
            onClick={() => setPhotoPreview(undefined)}
          >
            <X size={20} />
          </button>
          {/* Browser-only user content cannot use the optimized Next Image component. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoPreview} alt="" onClick={() => setPhotoPreview(undefined)} />
        </div>
      )}

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1>{UI_COPY.dashboard.title}</h1>
            <p>{UI_COPY.dashboard.subtitle}</p>
          </div>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={createShop}
          >
            <CirclePlus size={18} /> New shop
          </button>
        </section>

        <section className={styles.mobileItemPicker} aria-label="Choose shop">
          <div className={styles.mobileShopHeading}>
            <strong>Choose shop</strong>
            <span>{shops.length} saved</span>
          </div>
          <details
            className={styles.mobileShopMenu}
            open={mobileShopMenuOpen}
            onToggle={(event) =>
              setMobileShopMenuOpen(event.currentTarget.open)
            }
          >
            <summary>
              <span className={styles.mobileShopIcon}>
                <Check size={16} />
              </span>
              <span className={styles.mobileShopText}>
                <strong>{shopLabels.get(activeShopId ?? "")}</strong>
                <small>
                  {shopQuotes.length}{" "}
                  {shopQuotes.length === 1 ? "item" : "items"}
                </small>
              </span>
              <ChevronDown size={18} />
            </summary>
            <div className={styles.mobileShopList}>
              {shopGroups.map((group) => (
                <div className={styles.mobileShopGroup} key={group.label}>
                  <span>{group.label}</span>
                  {group.entries.map((entry) => {
                    const entryQuotes = quotes.filter(
                      (quoteEntry) => quoteEntry.shopId === entry.id,
                    );
                    const count = entryQuotes.length;
                    const selected = entry.id === activeShopId;

                    return (
                      <div className={styles.mobileShopRow} key={entry.id}>
                        <button
                          className={styles.mobileShopSelect}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setSelectedShopId(entry.id);
                            setSelectedItemId(entryQuotes[0]?.itemId);
                            setMobileShopMenuOpen(false);
                          }}
                        >
                          <span className={styles.mobileShopIcon}>
                            {selected ? (
                              <Check size={16} />
                            ) : (
                              <Gem size={16} />
                            )}
                          </span>
                          <span className={styles.mobileShopText}>
                            <strong>{shopLabels.get(entry.id)}</strong>
                            <small>
                              {count} {count === 1 ? "item" : "items"}
                            </small>
                          </span>
                        </button>
                        <button
                          className={styles.mobileShopDelete}
                          type="button"
                          aria-label={`Delete ${shopLabels.get(entry.id)}`}
                          onClick={() => deleteShop(entry.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </details>
        </section>

        <div className={styles.pageLayout}>
          <aside className={styles.itemSidebar} aria-label="Your shops">
            <div className={styles.sidebarTitle}>
              <strong>Your shops</strong>
              <span>{shops.length}</span>
            </div>
            <nav>
              {shopGroups.map((group) => (
                <div className={styles.shopDateGroup} key={group.label}>
                  <span className={styles.shopDateLabel}>{group.label}</span>
                  {group.entries.map((entry) => {
                    const entryQuotes = quotes.filter(
                      (quoteEntry) => quoteEntry.shopId === entry.id,
                    );
                    const count = entryQuotes.length;
                    return (
                      <div className={styles.shopEntry} key={entry.id}>
                        <div className={styles.shopRow}>
                          <button
                            type="button"
                            aria-current={entry.id === activeShopId}
                            onClick={() => {
                              setSelectedShopId(entry.id);
                              setSelectedItemId(entryQuotes[0]?.itemId);
                            }}
                          >
                            <span>{shopLabels.get(entry.id)}</span>
                            <small>
                              {count} {count === 1 ? "item" : "items"}
                            </small>
                          </button>
                          <button
                            className={styles.shopDeleteButton}
                            type="button"
                            aria-label={`Delete ${shopLabels.get(entry.id)}`}
                            title="Delete shop"
                            onClick={() => deleteShop(entry.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {entry.id === activeShopId && count > 1 && (
                          <div
                            className={styles.sidebarItems}
                            aria-label="Items at selected shop"
                          >
                            {entryQuotes.map((entryQuote, index) => {
                              const entryItem = items.find(
                                (currentItem) =>
                                  currentItem.id === entryQuote.itemId,
                              );
                              if (!entryItem) return null;
                              return (
                                <div
                                  className={styles.sidebarItemRow}
                                  key={entryItem.id}
                                >
                                  <button
                                    className={styles.sidebarItemButton}
                                    type="button"
                                    aria-current={entryItem.id === activeItemId}
                                    onClick={() =>
                                      setSelectedItemId(entryItem.id)
                                    }
                                  >
                                    {entryItem.name || `Item ${index + 1}`}
                                  </button>
                                  <button
                                    className={styles.itemDeleteButton}
                                    type="button"
                                    aria-label={`Delete ${entryItem.name || `Item ${index + 1}`}`}
                                    title="Delete item"
                                    onClick={() => deleteItem(entryItem.id)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </nav>
            <button
              className={styles.sidebarAdd}
              type="button"
              onClick={createShop}
            >
              <Plus size={17} /> Add shop
            </button>
          </aside>

          <div className={styles.contentColumn}>
            <section className={styles.itemCard} aria-labelledby="item-title">
              <div className={styles.sectionTop}>
                <div className={styles.stepTitle}>
                  <h2 id="item-title">Items at this shop</h2>
                </div>
                <div className={styles.itemActions}>
                  <button
                    className={styles.outlineButton}
                    type="button"
                    onClick={createItem}
                  >
                    <Plus size={17} /> Add item
                  </button>
                </div>
              </div>
              <div className={styles.shopDetails}>
                <label>
                  Shop name
                  <input
                    key={`shop-name-${shop.id}`}
                    defaultValue={shop.name}
                    placeholder="Enter shop name"
                    onBlur={(event) =>
                      updateShop(shop.id, { name: event.target.value.trim() })
                    }
                  />
                </label>
              </div>
              {shopQuotes.length > 1 && (
                <label className={styles.mobileQuotePicker}>
                  Choose item
                  <select
                    value={activeItemId}
                    onChange={(event) => setSelectedItemId(event.target.value)}
                  >
                    {shopQuotes.map((shopQuote, index) => {
                      const shopItem = items.find(
                        (entry) => entry.id === shopQuote.itemId,
                      );
                      if (!shopItem) return null;
                      return (
                        <option key={shopItem.id} value={shopItem.id}>
                          {shopItem.name || `Item ${index + 1}`}
                        </option>
                      );
                    })}
                  </select>
                </label>
              )}
              <div className={styles.itemGrid}>
                <label className={styles.itemPhotoField}>
                  Item
                  <span className={styles.itemPhotoRow}>
                    <SearchableItemSelect
                      key={item.id}
                      value={item.category}
                      onSelect={(category) =>
                        updateItem(item.id, {
                          category,
                          name: category,
                        })
                      }
                    />
                    <input
                      ref={cameraInputRef}
                      className={styles.photoInput}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => addItemPhoto(event.target.files?.[0])}
                    />
                    <input
                      ref={galleryInputRef}
                      className={styles.photoInput}
                      type="file"
                      accept="image/*"
                      onChange={(event) => addItemPhoto(event.target.files?.[0])}
                    />
                    {item.photoDataUrl ? (
                      <span className={styles.photoThumbWrap}>
                        <button
                          type="button"
                          className={styles.photoThumb}
                          aria-label={UI_COPY.dashboard.labels.changePhoto}
                          onClick={() => setPhotoPreview(item.photoDataUrl)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.photoDataUrl} alt="" />
                        </button>
                        <button
                          type="button"
                          className={styles.photoRemove}
                          aria-label={UI_COPY.dashboard.labels.removePhoto}
                          onClick={removeItemPhoto}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : (
                      <span ref={photoChooserRef} className={styles.photoChooser}>
                        <button
                          type="button"
                          className={styles.photoButton}
                          aria-label={UI_COPY.dashboard.labels.addPhoto}
                          title={UI_COPY.dashboard.labels.addPhoto}
                          aria-expanded={photoMenuOpen}
                          onClick={() => setPhotoMenuOpen((open) => !open)}
                        >
                          <Camera size={19} />
                        </button>
                        {photoMenuOpen && (
                          <span className={styles.photoMenu}>
                            <button
                              type="button"
                              onClick={() => cameraInputRef.current?.click()}
                            >
                              <Camera size={16} /> {UI_COPY.dashboard.labels.takePhoto}
                            </button>
                            <button
                              type="button"
                              onClick={() => galleryInputRef.current?.click()}
                            >
                              {UI_COPY.dashboard.labels.choosePhoto}
                            </button>
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </label>
                <label>
                  Purity
                  <select
                    value={item.purity}
                    onChange={(event) =>
                      updateItem(item.id, { purity: event.target.value })
                    }
                  >
                    {PURITY_OPTIONS.map((purity) => (
                      <option key={purity}>{purity}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Weight (g)
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.weightGrams || ""}
                    placeholder="Enter weight"
                    required
                    onChange={(event) =>
                      updateItem(item.id, {
                        weightGrams: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
            </section>

            <section
              className={styles.quoteSection}
              aria-labelledby="quote-title"
            >
              <div className={styles.sectionTop}>
                <div className={styles.stepTitle}>
                  <h2 id="quote-title">Price for selected item</h2>
                </div>
              </div>

              {quote && shop && breakdown ? (
                <form className={styles.quoteWorkspace} onSubmit={save}>
                  <div className={styles.quoteEditor}>
                    <div className={styles.quoteForm}>
                      <input type="hidden" {...register("gstNotApplicable")} />
                      <input type="hidden" {...register("makingChargeType")} />
                      <input
                        type="hidden"
                        {...register("refundNotApplicable")}
                      />
                      <div className={styles.quickChoices}>
                        <div
                          className={`${styles.optionChoices} ${styles.gstChoices}`}
                          role="group"
                          aria-label="GST options"
                        >
                          <button
                            type="button"
                            aria-pressed={Boolean(watched.gstNotApplicable)}
                            onClick={() => {
                              setValue("gstNotApplicable", true);
                              setValue(
                                "gstPercent",
                                undefined as unknown as number,
                              );
                              setShowGstEditor(false);
                            }}
                          >
                            {watched.gstNotApplicable && <Check size={14} />}
                            No GST
                          </button>
                          <button
                            type="button"
                            aria-pressed={
                              !watched.gstNotApplicable && !showGstEditor
                            }
                            onClick={() => {
                              setValue("gstNotApplicable", false);
                              if (effectiveGstValue <= 0) {
                                setValue("gstPercent", 9);
                              }
                              setShowGstEditor(false);
                            }}
                          >
                            {!watched.gstNotApplicable &&
                              !showGstEditor && <Check size={14} />}
                            {gstOptionLabel}
                          </button>
                          <button
                            type="button"
                            aria-expanded={showGstEditor}
                            aria-pressed={showGstEditor}
                            onClick={() => {
                              const openingEditor = !showGstEditor;
                              setValue("gstNotApplicable", false);
                              if (
                                openingEditor &&
                                (watched.gstNotApplicable ||
                                  effectiveGstValue === PRICING_DEFAULTS.gstPercent)
                              ) {
                                setValue("gstPercent", Number.NaN);
                              }
                              setShowGstEditor(openingEditor);
                            }}
                          >
                            {showGstEditor && <Check size={14} />}
                            Edit GST
                          </button>
                        </div>
                        <div className={styles.quickChoiceField}>
                          <div
                            className={styles.optionChoices}
                            role="group"
                            aria-label="Making charge options"
                          >
                            <button
                              type="button"
                              aria-label="Making charge: None"
                              aria-pressed={
                                watched.makingChargeType === "none"
                              }
                              onClick={() => {
                                setValue("makingChargeType", "none");
                                setValue(
                                  "makingChargeValue",
                                  undefined as unknown as number,
                                );
                              }}
                            >
                              {watched.makingChargeType === "none" && (
                                <Check size={14} />
                              )}
                              <span className={styles.desktopChargeLabel}>
                                Making charge: None
                              </span>
                              <span className={styles.mobileChargeLabel}>
                                Making: None
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-pressed={
                                watched.makingChargeType === "fixed"
                              }
                              onClick={() => {
                                setValue("makingChargeType", "fixed");
                                setValue(
                                  "makingChargeValue",
                                  undefined as unknown as number,
                                );
                              }}
                            >
                              {watched.makingChargeType === "fixed" && (
                                <Check size={14} />
                              )}
                              Fixed amount
                            </button>
                            <button
                              type="button"
                              aria-pressed={
                                watched.makingChargeType === "percentage"
                              }
                              onClick={() => {
                                setValue("makingChargeType", "percentage");
                                setValue(
                                  "makingChargeValue",
                                  undefined as unknown as number,
                                );
                              }}
                            >
                              {watched.makingChargeType === "percentage" && (
                                <Check size={14} />
                              )}
                              Percentage
                            </button>
                          </div>
                        </div>
                        <div
                          className={`${styles.optionChoices} ${styles.refundChoices}`}
                          role="group"
                          aria-label="Tourist refund options"
                        >
                          <button
                            type="button"
                            aria-pressed={Boolean(
                              watched.refundNotApplicable,
                            )}
                            onClick={() => {
                              setValue("refundNotApplicable", true);
                              setValue(
                                "refundValue",
                                undefined as unknown as number,
                              );
                              setShowRefundEditor(false);
                            }}
                          >
                            {watched.refundNotApplicable && <Check size={14} />}
                            No refund
                          </button>
                          <button
                            type="button"
                            aria-pressed={
                              !watched.refundNotApplicable &&
                              !showRefundEditor
                            }
                            onClick={() => {
                              setValue("refundNotApplicable", false);
                              if (effectiveRefundValue <= 0) {
                                setValue("refundValue", 7);
                              }
                              setShowRefundEditor(false);
                            }}
                          >
                            {!watched.refundNotApplicable &&
                              !showRefundEditor && <Check size={14} />}
                            {refundOptionLabel}
                          </button>
                          <button
                            type="button"
                            aria-expanded={showRefundEditor}
                            aria-pressed={showRefundEditor}
                            onClick={() => {
                              const openingEditor = !showRefundEditor;
                              setValue("refundNotApplicable", false);
                              if (
                                openingEditor &&
                                (watched.refundNotApplicable ||
                                  effectiveRefundValue === PRICING_DEFAULTS.touristRefundPercent)
                              ) {
                                setValue("refundValue", Number.NaN);
                              }
                              setShowRefundEditor(openingEditor);
                            }}
                          >
                            {showRefundEditor && <Check size={14} />}
                            Edit rate
                          </button>
                        </div>
                      </div>
                      <div className={styles.formGrid}>
                        <label
                          className={
                            watched.makingChargeType === "none" &&
                            (watched.gstNotApplicable || !showGstEditor) &&
                            !showRefundEditor
                              ? styles.fullField
                              : undefined
                          }
                        >
                          Rate per gram (S$)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter rate"
                            {...register("metalRatePerGram", {
                              valueAsNumber: true,
                              required: true,
                            })}
                          />
                        </label>
                        {(watched.makingChargeType === "fixed" ||
                          watched.makingChargeType === "percentage") && (
                          <label>
                            {watched.makingChargeType === "fixed"
                              ? "Fixed amount (S$)"
                              : "Making charge (%)"}
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              {...register("makingChargeValue", {
                                valueAsNumber: true,
                                required: true,
                              })}
                            />
                            {fixedMakingPercentage !== null && (
                              <small className={styles.fieldHint}>
                                Equivalent to {fixedMakingPercentage.toFixed(2)}
                                % of the {money.format(metalValue)} metal value
                              </small>
                            )}
                          </label>
                        )}
                        {!watched.gstNotApplicable && showGstEditor && (
                          <label>
                            Custom GST (%)
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              {...register("gstPercent", {
                                setValueAs: (value) =>
                                  value === "" ? Number.NaN : Number(value),
                              })}
                              onInput={(event) => {
                                const value = event.currentTarget.value;
                                setValue(
                                  "gstPercent",
                                  value === "" ? Number.NaN : Number(value),
                                  { shouldDirty: true },
                                );
                              }}
                              placeholder="Enter GST"
                            />
                          </label>
                        )}
                        {!watched.refundNotApplicable && showRefundEditor && (
                          <label>
                            Custom tourist refund (%)
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="7"
                              {...register("refundValue", {
                                setValueAs: (value) =>
                                  value === "" ? Number.NaN : Number(value),
                              })}
                              onInput={(event) => {
                                const value = event.currentTarget.value;
                                setValue(
                                  "refundValue",
                                  value === "" ? Number.NaN : Number(value),
                                  { shouldDirty: true },
                                );
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <details className={styles.moreOptions}>
                      <summary>
                        <span>
                          <SlidersHorizontal size={16} />
                          <span className={styles.moreOptionsLabel}>
                            <strong>Discount &amp; notes</strong>
                            <small>Optional</small>
                          </span>
                        </span>
                        <ChevronDown size={16} />
                      </summary>
                      <div className={`${styles.formGrid} ${styles.optionalFields}`}>
                        <div className={`${styles.fullField} ${styles.discountField}`}>
                          <span className={styles.fieldHeading}>Discount</span>
                          <div
                            className={`${styles.optionChoices} ${styles.discountChoices}`}
                            aria-label="Discount type"
                          >
                            <button
                              type="button"
                              aria-pressed={
                                !watched.discountType ||
                                watched.discountType === "none"
                              }
                              onClick={() => {
                                setValue("discountType", "none", {
                                  shouldDirty: true,
                                });
                                setValue("discountValue", 0, {
                                  shouldDirty: true,
                                });
                              }}
                            >
                              {(!watched.discountType ||
                                watched.discountType === "none") && (
                                <Check size={14} />
                              )}
                              No discount
                            </button>
                            <button
                              type="button"
                              aria-pressed={watched.discountType === "fixed"}
                              onClick={() => {
                                setValue("discountType", "fixed", {
                                  shouldDirty: true,
                                });
                                if (watched.discountType !== "fixed") {
                                  setValue(
                                    "discountValue",
                                    Number.NaN,
                                    { shouldDirty: true },
                                  );
                                }
                              }}
                            >
                              {watched.discountType === "fixed" && (
                                <Check size={14} />
                              )}
                              Fixed amount
                            </button>
                            <button
                              type="button"
                              aria-pressed={watched.discountType === "percentage"}
                              onClick={() => {
                                setValue("discountType", "percentage", {
                                  shouldDirty: true,
                                });
                                if (watched.discountType !== "percentage") {
                                  setValue(
                                    "discountValue",
                                    Number.NaN,
                                    { shouldDirty: true },
                                  );
                                }
                              }}
                            >
                              {watched.discountType === "percentage" && (
                                <Check size={14} />
                              )}
                              Percentage
                            </button>
                          </div>
                        </div>
                        {(watched.discountType === "percentage" ||
                          watched.discountType === "fixed") && (
                          <label>
                            {watched.discountType === "percentage"
                              ? "Discount (%)"
                              : "Discount amount (S$)"}
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={
                                watched.discountType === "percentage"
                                  ? "Enter percentage"
                                  : "Enter amount"
                              }
                              {...register("discountValue", {
                                valueAsNumber: true,
                              })}
                            />
                          </label>
                        )}
                        <label className={`${styles.fullField} ${styles.notesField}`}>
                          <span>
                            Notes <small>Optional</small>
                          </span>
                          <textarea
                            rows={3}
                            {...register("notes")}
                            placeholder="Add design details, shop terms, or anything worth remembering…"
                          />
                        </label>
                      </div>
                    </details>

                    <div className={styles.formActions}>
                      <span role="status">{message}</span>
                      <div className={styles.actionButtons}>
                        <button className={styles.primaryButton} type="submit">
                          <Save size={17} /> Save
                        </button>
                      </div>
                    </div>

                    {!showComparison && (
                      <div className={styles.compareTrigger}>
                        <div>
                          <strong>Compare saved prices</strong>
                          <span>Find the best price for matching items.</span>
                        </div>
                        <button
                          className={styles.primaryButton}
                          type="button"
                          aria-expanded="false"
                          onClick={() => setShowComparison(true)}
                        >
                          <BarChart3 size={17} />
                          Compare best prices
                        </button>
                      </div>
                    )}
                  </div>

                  <aside
                    className={styles.priceColumn}
                    aria-label="Price summary"
                  >
                    <PriceCard
                      breakdown={breakdown}
                      quote={previewQuote ?? quote}
                      item={item}
                    />
                  </aside>
                </form>
              ) : null}
            </section>

            {showComparison && (
              <section
                className={styles.compareSection}
                aria-labelledby="compare-title"
              >
                <div className={styles.sectionTop}>
                  <div className={styles.stepTitle}>
                    <h2 id="compare-title">Best shop for each item</h2>
                  </div>
                  <button
                    className={styles.outlineButton}
                    type="button"
                    onClick={() => setShowComparison(false)}
                  >
                    Hide
                  </button>
                </div>
                {comparableResults.length > 0 ? (
                  <div className={styles.comparisonResults}>
                    <div className={styles.comparisonIntro}>
                      <BadgeCheck size={19} />
                      <div>
                        <strong>
                          {comparableResults.length} matching{" "}
                          {comparableResults.length === 1 ? "item" : "items"} found
                        </strong>
                        <span>
                          Each winner is based on the lowest estimated final price.
                        </span>
                      </div>
                    </div>
                    <div className={styles.resultList}>
                    {comparableResults
                      .map(({ item: resultItem, ranked }) => {
                        const best = ranked[0];
                        const nextBest = ranked[1];
                        const highestPrice = Math.max(
                          ...ranked.map((entry) => entry.total.finalCost),
                          1,
                        );
                        const saving = nextBest
                          ? nextBest.total.finalCost - best.total.finalCost
                          : 0;
                        const advantage = nextBest
                          ? explainPriceAdvantage(best, nextBest)
                          : "Lowest saved final price";
                        return (
                          <article key={resultItem.id}>
                            <div className={styles.resultHeader}>
                              <div className={styles.resultItem}>
                                <strong>{resultItem.name || resultItem.category || "Item"}</strong>
                                <small>
                                  {resultItem.purity} · Compared across {ranked.length} shops
                                </small>
                              </div>
                              <div className={styles.savingBadge}>
                                Save {money.format(saving)}
                              </div>
                            </div>
                            <div className={styles.winnerSummary}>
                              <div className={styles.bestShop}>
                                <BadgeCheck size={19} />
                                <span>
                                  <small>Best price for this item</small>
                                  <strong>
                                    {shopLabels.get(best.quote.shopId)}
                                  </strong>
                                </span>
                              </div>
                              <div className={styles.resultPrice}>
                                <strong>{money.format(best.total.finalCost)}</strong>
                                <small>{advantage}</small>
                              </div>
                            </div>
                            <div className={styles.shopComparisonGrid}>
                              {ranked.map((entry, index) => (
                                <div
                                  className={`${styles.shopBreakdown} ${
                                    index === 0 ? styles.shopBreakdownBest : ""
                                  }`}
                                  key={entry.quote.id}
                                >
                                  <div className={styles.shopBreakdownTop}>
                                    <span>
                                      {index === 0 && <BadgeCheck size={15} />}
                                      <strong>
                                        {shopLabels.get(entry.quote.shopId)}
                                      </strong>
                                    </span>
                                    <strong>{money.format(entry.total.finalCost)}</strong>
                                  </div>
                                  <div className={styles.priceBar} aria-hidden="true">
                                    <span
                                      style={{
                                        width: `${Math.max(
                                          8,
                                          (entry.total.finalCost / highestPrice) * 100,
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <dl>
                                    <div>
                                      <dt>Weight</dt>
                                      <dd>{entry.item?.weightGrams ?? 0}g</dd>
                                    </div>
                                    <div>
                                      <dt>Gold rate</dt>
                                      <dd>{money.format(entry.quote.metalRatePerGram)}/g</dd>
                                    </div>
                                    <div>
                                      <dt>Metal value</dt>
                                      <dd>{money.format(entry.total.metalValue)}</dd>
                                    </div>
                                    <div>
                                      <dt>Making</dt>
                                      <dd>{money.format(entry.total.makingCharge ?? 0)}</dd>
                                    </div>
                                    <div>
                                      <dt>GST</dt>
                                      <dd>{money.format(entry.total.gst)}</dd>
                                    </div>
                                    <div>
                                      <dt>Discount</dt>
                                      <dd>-{money.format(entry.total.discount ?? 0)}</dd>
                                    </div>
                                    <div>
                                      <dt>Tourist refund</dt>
                                      <dd>-{money.format(entry.total.refund ?? 0)}</dd>
                                    </div>
                                  </dl>
                                </div>
                              ))}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={styles.comparisonEmpty}>
                    <BarChart3 size={22} />
                    <strong>
                      {shops.length < 2
                        ? "Add one more shop to compare"
                        : "No matching shop items yet"}
                    </strong>
                    <span>
                      {shops.length < 2
                        ? `Save the same item in another shop, then ${APP.name} can find the better price.`
                        : "Use the same item name and purity in at least two shops, with weight, rate and complete pricing."}
                    </span>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PriceCard({
  breakdown,
  quote,
  item,
}: {
  breakdown: ReturnType<typeof calculateQuote>;
  quote: Quote;
  item: JewelleryItem;
}) {
  const safe = (value: number) => (Number.isFinite(value) ? value : 0);
  const makingDetail =
    quote.makingChargeType === "percentage"
      ? `${safe(quote.makingChargeValue)}% of metal value`
      : quote.makingChargeType === "fixed"
        ? "Fixed amount"
        : quote.makingChargeType === "none"
          ? "No charge"
          : "Not selected";
  const discountDetail =
    quote.discountType === "percentage"
      ? `${safe(quote.discountValue)}%`
      : quote.discountType === "fixed"
        ? "Fixed amount"
        : "No discount";
  const hasMakingCharge =
    quote.makingChargeType === "fixed" ||
    quote.makingChargeType === "percentage";
  const hasDiscount =
    quote.discountType === "fixed" || quote.discountType === "percentage";
  const hasGst = !quote.gstNotApplicable;
  const hasTouristRefund =
    quote.refundType === "percentage" && safe(quote.refundValue) > 0;
  const rows: Array<{
    label: string;
    detail: string;
    value: number | null;
  }> = [
    {
      label: "Metal value",
      detail: `${safe(item.weightGrams)}g × ${money.format(safe(quote.metalRatePerGram))}`,
      value: breakdown.metalValue,
    },
    ...(hasMakingCharge
      ? [
          {
            label: "Making charge",
            detail: makingDetail,
            value: breakdown.makingCharge,
          },
        ]
      : []),
    ...(hasDiscount
      ? [
          {
            label: "Discount",
            detail: discountDetail,
            value: breakdown.discount === null ? null : -breakdown.discount,
          },
        ]
      : []),
    ...(hasMakingCharge || hasDiscount
      ? [
          {
            label: hasGst ? "Taxable subtotal" : "Subtotal",
            detail: "Metal + making − discount",
            value: breakdown.taxableSubtotal,
          },
        ]
      : []),
    ...(hasGst
      ? [
          {
            label: "GST",
            detail: `${safe(quote.gstPercent)}%`,
            value: breakdown.gst,
          },
        ]
      : []),
    {
      label: hasGst ? "Price including GST" : "Shop price",
      detail: "Amount payable at shop",
      value: breakdown.shopPayablePrice,
    },
    ...(hasTouristRefund
      ? [
          {
            label: "Tourist refund",
            detail: `${safe(quote.refundValue)}% estimate`,
            value: breakdown.refund === null ? null : -breakdown.refund,
          },
        ]
      : []),
  ];

  return (
    <aside className={styles.priceCard}>
      <span>Final price</span>
      <strong>{money.format(safe(breakdown.finalCost))}</strong>
      <small>
        {money.format(safe(breakdown.effectivePricePerGram))} per gram
      </small>
      <dl>
        {rows.map(({ label, detail, value }) => (
          <div key={label}>
            <dt>
              <span>{label}</span>
              <small>{detail}</small>
            </dt>
            <dd>{value === null ? "Unknown" : money.format(safe(value))}</dd>
          </div>
        ))}
      </dl>
      {breakdown.warnings.length > 0 && <p>{breakdown.warnings[0]}</p>}
    </aside>
  );
}

function Brand() {
  return (
    <div className={styles.brand} aria-label={APP.name}>
      <span className={styles.brandMark}>
        <Gem size={22} />
        <BadgeCheck size={12} />
      </span>
      <strong>{APP.name}</strong>
    </div>
  );
}

function SearchableItemSelect({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const matches = JEWELLERY_CATEGORIES.filter((category) =>
    category.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function choose(category: string) {
    onSelect(category);
    setQuery(category);
    setOpen(false);
  }

  return (
    <div className={styles.searchSelect}>
      <Search size={17} aria-hidden="true" />
      <input
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="item-search-options"
        value={query}
        placeholder="Search jewellery item"
        required
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && matches[0]) {
            event.preventDefault();
            choose(matches[0]);
          }
          if (event.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <div
          id="item-search-options"
          className={styles.searchOptions}
          role="listbox"
        >
          {matches.length > 0 ? (
            matches.map((category) => (
              <button
                key={category}
                type="button"
                role="option"
                aria-selected={category === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(category)}
              >
                <span>{category}</span>
                {category === value && <Check size={16} />}
              </button>
            ))
          ) : (
            <span className={styles.noSearchResult}>No matching item</span>
          )}
        </div>
      )}
    </div>
  );
}
