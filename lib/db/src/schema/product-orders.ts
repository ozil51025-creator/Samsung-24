import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const productOrdersTable = pgTable("product_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  priceUgx: integer("price_ugx").notNull(),
  isFirstPurchase: boolean("is_first_purchase").notNull(),
  status: text("status").notNull().default("pending_fulfillment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
