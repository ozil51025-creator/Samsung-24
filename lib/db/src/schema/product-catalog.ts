import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const productCatalogTable = pgTable("product_catalog", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceUgx: integer("price_ugx").notNull(),
  illustration: text("illustration").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
