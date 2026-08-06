"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm, useWatch } from "react-hook-form";
import {
  BadgeCheck,
  BarChart3,
  Check,
  ChevronDown,
  CirclePlus,
  Gem,
  Plus,
  Save,
  Search,
  Share2,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { JewelleryItem, Quote } from "@/domain/models";
import { HeaderLinks } from "@/components/HeaderLinks";
import { calculateQuote } from "@/domain/pricing/calculator";
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

const categories = [
  "Necklace",
  "Choker",
  "Rani haar / long necklace",
  "Mangalsutra",
  "Chain",
  "Pendant",
  "Ring",
  "Earrings",
  "Studs",
  "Jhumka / Jhumki",
  "Nose pin / Nath",
  "Maang tikka",
  "Bracelet",
  "Bangle / Kangan",
  "Kada",
  "Armlet / Bajuband",
  "Anklet / Payal",
  "Toe ring / Bichiya",
  "Waist chain / Kamarband",
  "Gold bar / biscuit",
  "Gold coin",
  "Other",
];

const purities = [
  "24K (999/999.9)",
  "22K (916)",
  "21K (875)",
  "18K (750)",
  "14K (585)",
  "Custom",
];

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

const money = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "SGD",
  minimumFractionDigits: 2,
});

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
  return new Intl.DateTimeFormat("en-SG", {
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

  useEffect(() => {
    seedDatabase().then(() => setReady(true));
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
          ? (undefined as unknown as number)
          : quote.metalRatePerGram,
      makingChargeType:
        quote.metalRatePerGram === 0
          ? ("" as Quote["makingChargeType"])
          : quote.makingChargeType,
      makingChargeValue:
        quote.makingChargeValue === 0
          ? (undefined as unknown as number)
          : quote.makingChargeValue,
      gstPercent:
        quote.gstPercent === 0
          ? (undefined as unknown as number)
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
          ? (undefined as unknown as number)
          : quote.refundValue,
      refundNotApplicable: quote.refundNotApplicable ?? false,
      notes: quote.notes ?? "",
    });
  }, [quote, reset, shop]);

  const rawRefundValue = watched.refundNotApplicable
    ? 0
    : (watched.refundValue ?? quote?.refundValue ?? 0);
  const effectiveRefundValue = Number.isFinite(rawRefundValue)
    ? rawRefundValue
    : 0;
  const previewQuote = quote
    ? {
        ...quote,
        metalRatePerGram: watched.metalRatePerGram ?? quote.metalRatePerGram,
        makingChargeType: watched.makingChargeType ?? quote.makingChargeType,
        makingChargeValue: watched.makingChargeValue ?? quote.makingChargeValue,
        gstPercent: watched.gstNotApplicable
          ? 0
          : (watched.gstPercent ?? quote.gstPercent),
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
    if (!showComparison) return [];
    const comparisonGroups = new Map<string, JewelleryItem[]>();
    items.forEach((currentItem) => {
      const itemName = (currentItem.category || currentItem.name)
        .trim()
        .toLowerCase();
      if (!itemName || currentItem.weightGrams <= 0) return;
      const key = [
        itemName,
        currentItem.purity.trim().toLowerCase(),
        currentItem.weightGrams.toFixed(3),
      ].join("|");
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
  }, [items, quotes, shops, showComparison]);

  const save = handleSubmit(async (values) => {
    if (!quote || !shop) return;
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
    flash("Saved in this browser");
  });

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2400);
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
    const text = results
      .map(({ item: resultItem, ranked }) =>
        ranked[0]
          ? `${resultItem.name || "Item"}: ${shopLabels.get(ranked[0].quote.shopId) || "Shop"} — ${money.format(ranked[0].total.finalCost)}`
          : `${resultItem.name || "Item"}: add another quote`,
      )
      .join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "JwellCheck", text });
      else {
        await navigator.clipboard.writeText(text);
        flash("Comparison copied");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        flash("Sharing is unavailable");
    }
  }

  async function clearAllData() {
    const confirmed = window.confirm(
      "Clear every item and shop price? This cannot be undone.",
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
        <header className={styles.header}>
          <Brand />
          <div className={styles.headerActions}>
            <HeaderLinks />
            <button
              className={styles.clearButton}
              type="button"
              onClick={clearAllData}
              aria-label="Clear all data"
            >
              <Trash2 size={17} /> <span>Clear</span>
            </button>
          </div>
        </header>
        <main className={styles.emptyStart}>
          <span className={styles.brandMark}>
            <Gem size={25} />
          </span>
          <h1>Start your comparison</h1>
          <p>Add your first shop and jewellery item.</p>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={createShop}
          >
            <CirclePlus size={18} /> Add first shop
          </button>
          <small className={styles.purchaseNote}>
            For comparison only. Before purchasing, confirm the final price with
            the shopkeeper.
          </small>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Brand />
        <div className={styles.headerActions}>
          <HeaderLinks />
          <span className={styles.savedState}>Saved automatically</span>
          <button
            className={styles.clearButton}
            type="button"
            onClick={clearAllData}
            aria-label="Clear all data"
          >
            <Trash2 size={17} /> <span>Clear</span>
          </button>
          <button
            className={styles.ghostButton}
            type="button"
            onClick={share}
            aria-label="Share comparison"
          >
            <Share2 size={17} /> <span>Share</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1>Compare jewellery prices</h1>
            <p>One item. Multiple shops. A clear final price.</p>
          </div>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={createShop}
          >
            <CirclePlus size={18} /> New shop
          </button>
        </section>

        <label className={styles.mobileItemPicker}>
          Choose shop
          <select
            value={activeShopId}
            onChange={(event) => {
              setSelectedShopId(event.target.value);
              const firstQuote = quotes.find(
                (entry) => entry.shopId === event.target.value,
              );
              setSelectedItemId(firstQuote?.itemId);
            }}
          >
            {shopGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.entries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {shopLabels.get(entry.id)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

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
                <label>
                  Item
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
                </label>
                <label>
                  Purity
                  <select
                    value={item.purity}
                    onChange={(event) =>
                      updateItem(item.id, { purity: event.target.value })
                    }
                  >
                    {purities.map((purity) => (
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
                      <input
                        type="hidden"
                        {...register("refundNotApplicable")}
                      />
                      <div className={styles.quickChoices}>
                        <button
                          type="button"
                          aria-pressed={watched.makingChargeType === "none"}
                          onClick={() => {
                            const next = watched.makingChargeType !== "none";
                            setValue(
                              "makingChargeType",
                              next ? "none" : ("" as Quote["makingChargeType"]),
                            );
                            if (next)
                              setValue(
                                "makingChargeValue",
                                undefined as unknown as number,
                              );
                          }}
                        >
                          {watched.makingChargeType === "none" && (
                            <Check size={14} />
                          )}
                          No making charge
                        </button>
                        <button
                          type="button"
                          aria-pressed={Boolean(watched.gstNotApplicable)}
                          onClick={() => {
                            const next = !watched.gstNotApplicable;
                            setValue("gstNotApplicable", next);
                            if (next)
                              setValue(
                                "gstPercent",
                                undefined as unknown as number,
                              );
                          }}
                        >
                          {watched.gstNotApplicable && <Check size={14} />}
                          No GST
                        </button>
                        <button
                          type="button"
                          aria-pressed={Boolean(watched.refundNotApplicable)}
                          onClick={() => {
                            const next = !watched.refundNotApplicable;
                            setValue("refundNotApplicable", next);
                            if (next)
                              setValue(
                                "refundValue",
                                undefined as unknown as number,
                              );
                          }}
                        >
                          {watched.refundNotApplicable && <Check size={14} />}
                          No tourist refund
                        </button>
                      </div>
                      <div className={styles.formGrid}>
                        <label>
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
                        <label>
                          Making charge
                          <select
                            {...register("makingChargeType", {
                              required: true,
                            })}
                          >
                            <option value="" disabled>
                              Select charge
                            </option>
                            <option value="none">None</option>
                            <option value="fixed">Fixed amount</option>
                            <option value="percentage">Percentage (%)</option>
                          </select>
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
                        {!watched.gstNotApplicable && (
                          <label>
                            GST (%)
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              {...register("gstPercent", {
                                valueAsNumber: true,
                                required: true,
                              })}
                              placeholder="Enter GST"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <details className={styles.moreOptions}>
                      <summary>
                        <span>
                          <SlidersHorizontal size={16} /> More options
                        </span>
                        <ChevronDown size={16} />
                      </summary>
                      <div className={styles.formGrid}>
                        <label>
                          Discount
                          <select {...register("discountType")}>
                            <option value="" disabled>
                              Select discount
                            </option>
                            <option value="none">None</option>
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed amount</option>
                          </select>
                        </label>
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
                              {...register("discountValue", {
                                valueAsNumber: true,
                              })}
                            />
                          </label>
                        )}
                        {!watched.refundNotApplicable && (
                          <label>
                            Tourist refund (%)
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="Optional"
                              {...register("refundValue", {
                                valueAsNumber: true,
                              })}
                            />
                          </label>
                        )}
                        <label className={styles.fullField}>
                          Notes
                          <textarea
                            rows={2}
                            {...register("notes")}
                            placeholder="Optional"
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
                {results.some(({ ranked }) => ranked.length > 0) ? (
                  <div className={styles.resultList}>
                    {results
                      .filter(({ ranked }) => ranked.length > 0)
                      .map(({ item: resultItem, ranked }) => {
                        const best = ranked[0];
                        const nextBest = ranked[1];
                        return (
                          <article key={resultItem.id}>
                            <div className={styles.resultItem}>
                              <strong>{resultItem.name || "Item"}</strong>
                              <small>
                                {resultItem.purity} · {ranked.length}{" "}
                                {ranked.length === 1 ? "shop" : "shops"}
                              </small>
                            </div>
                            {best ? (
                              <>
                                <div className={styles.bestShop}>
                                  <BadgeCheck size={16} />
                                  <span>
                                    <strong>
                                      {shopLabels.get(best.quote.shopId)}
                                    </strong>
                                    <small>
                                      {nextBest
                                        ? "Lowest final price"
                                        : "Only listed shop price"}
                                    </small>
                                  </span>
                                </div>
                                <div className={styles.resultPrice}>
                                  <strong>
                                    {money.format(best.total.finalCost)}
                                  </strong>
                                  <small>
                                    {nextBest
                                      ? `Save ${money.format(nextBest.total.finalCost - best.total.finalCost)} vs next shop`
                                      : "Add another shop to compare"}
                                  </small>
                                </div>
                              </>
                            ) : null}
                          </article>
                        );
                      })}
                  </div>
                ) : (
                  <div className={styles.comparisonEmpty}>
                    <BarChart3 size={22} />
                    <strong>No complete prices to compare yet</strong>
                    <span>
                      Add an item weight and a complete price from at least one
                      shop.
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
  const rows = [
    {
      label: "Metal value",
      detail: `${safe(item.weightGrams)}g × ${money.format(safe(quote.metalRatePerGram))}`,
      value: breakdown.metalValue,
    },
    {
      label: "Making charge",
      detail: makingDetail,
      value: breakdown.makingCharge,
    },
    {
      label: "Discount",
      detail: discountDetail,
      value: breakdown.discount === null ? null : -breakdown.discount,
    },
    {
      label: "Taxable subtotal",
      detail: "Metal + making − discount",
      value: breakdown.taxableSubtotal,
    },
    {
      label: "GST",
      detail: `${safe(quote.gstPercent)}%`,
      value: breakdown.gst,
    },
    {
      label: "Price including GST",
      detail: "Amount payable at shop",
      value: breakdown.shopPayablePrice,
    },
    {
      label: "Tourist refund",
      detail:
        quote.refundType === "percentage"
          ? `${safe(quote.refundValue)}% estimate`
          : "No refund",
      value: breakdown.refund === null ? null : -breakdown.refund,
    },
  ] as const;

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
    <div className={styles.brand} aria-label="JwellCheck">
      <span className={styles.brandMark}>
        <Gem size={22} />
        <BadgeCheck size={12} />
      </span>
      <strong>JwellCheck</strong>
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

  const matches = categories.filter((category) =>
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
