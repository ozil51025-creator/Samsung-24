import { index, integer, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";
import { productOrdersTable } from "./product-orders";

export const referralCommissionsTable = pgTable(
  "referral_commissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientAccountId: uuid("recipient_account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
    purchaserAccountId: uuid("purchaser_account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
    orderId: uuid("order_id").notNull().references(() => productOrdersTable.id, { onDelete: "restrict" }),
    level: integer("level").notNull(),
    amountUgx: integer("amount_ugx").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderRecipientUnique: uniqueIndex("referral_commissions_order_recipient_unique").on(table.orderId, table.recipientAccountId),
    recipientLevelIndex: index("referral_commissions_recipient_level_idx").on(table.recipientAccountId, table.level),
  }),
);
