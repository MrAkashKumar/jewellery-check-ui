import Dexie, { type EntityTable } from "dexie";
import type {
  ComparisonSession,
  JewelleryItem,
  Quote,
  Shop,
} from "@/domain/models";

class JwellCheckDatabase extends Dexie {
  sessions!: EntityTable<ComparisonSession, "id">;
  items!: EntityTable<JewelleryItem, "id">;
  shops!: EntityTable<Shop, "id">;
  quotes!: EntityTable<Quote, "id">;

  constructor() {
    super("jwellcheck");
    this.version(1).stores({
      sessions: "id, status, updatedAt",
      items: "id, sessionId, comparisonGroup, updatedAt",
      shops: "id, name, updatedAt",
      quotes: "id, itemId, shopId, [itemId+shopId], updatedAt",
    });
    this.version(3)
      .stores({
        sessions: "id, status, updatedAt",
        items: "id, sessionId, comparisonGroup, updatedAt",
        shops: "id, name, updatedAt",
        quotes: "id, itemId, shopId, [itemId+shopId], updatedAt",
      })
      .upgrade(async (transaction) => {
        await Promise.all([
          transaction.table("sessions").clear(),
          transaction.table("items").clear(),
          transaction.table("shops").clear(),
          transaction.table("quotes").clear(),
        ]);
      });
  }
}

export const db = new JwellCheckDatabase();
