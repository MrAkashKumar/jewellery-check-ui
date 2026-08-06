import type { JewelleryItem, Quote, Shop } from "@/domain/models";
import { db } from "@/infrastructure/database/jwellcheck-db";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export const DEMO_SESSION_ID = "session-demo";

export async function seedDatabase(): Promise<void> {
  if ((await db.sessions.count()) === 0) {
    const timestamp = now();
    await db.sessions.put({
      id: DEMO_SESSION_ID,
      name: "My jewellery comparison",
      currency: "SGD",
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  await separateSharedShopItems();
}

async function separateSharedShopItems() {
  await db.transaction("rw", db.items, db.quotes, async () => {
    const allQuotes = await db.quotes.toArray();
    const quotesByItem = new Map<string, Quote[]>();
    allQuotes.forEach((quote) => {
      const group = quotesByItem.get(quote.itemId) ?? [];
      group.push(quote);
      quotesByItem.set(quote.itemId, group);
    });

    for (const [itemId, linkedQuotes] of quotesByItem) {
      if (linkedQuotes.length < 2) continue;
      const sourceItem = await db.items.get(itemId);
      if (!sourceItem) continue;

      for (const linkedQuote of linkedQuotes.slice(1)) {
        const clonedItemId = id("item");
        await db.items.add({
          ...sourceItem,
          id: clonedItemId,
          createdAt: linkedQuote.createdAt,
          updatedAt: now(),
        });
        await db.quotes.update(linkedQuote.id, {
          itemId: clonedItemId,
          updatedAt: now(),
        });
      }
    }
  });
}

export async function addItem(): Promise<string> {
  const timestamp = now();
  const itemId = id("item");
  await db.items.add({
    id: itemId,
    sessionId: DEMO_SESSION_ID,
    name: "",
    category: "",
    metal: "gold",
    purity: "22K (916)",
    weightGrams: 0,
    comparisonGroup: `new-${itemId}`,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return itemId;
}

export async function addShop(): Promise<string> {
  const timestamp = now();
  const shopId = id("shop");
  await db.shops.add({
    id: shopId,
    name: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return shopId;
}

export async function addQuote(
  itemId: string,
  shopId: string,
): Promise<string> {
  const timestamp = now();
  const quoteId = id("quote");
  await db.quotes.add({
    id: quoteId,
    itemId,
    shopId,
    metalRatePerGram: 0,
    makingChargeType: "none",
    makingChargeValue: 0,
    gstPercent: 0,
    gstNotApplicable: false,
    discountType: "none",
    discountValue: 0,
    additionalFees: 0,
    refundType: "none",
    refundValue: 0,
    refundNotApplicable: false,
    calculationVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return quoteId;
}

export async function updateItem(
  itemId: string,
  changes: Partial<JewelleryItem>,
) {
  await db.items.update(itemId, { ...changes, updatedAt: now() });
}

export async function updateQuote(quoteId: string, changes: Partial<Quote>) {
  await db.quotes.update(quoteId, { ...changes, updatedAt: now() });
}

export async function updateShop(shopId: string, changes: Partial<Shop>) {
  await db.shops.update(shopId, { ...changes, updatedAt: now() });
}
