import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const giftCodesTable = pgTable("gift_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  amountUgx: integer("amount_ugx").notNull(),
  createdByAdminAccountId: uuid("created_by_admin_account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
  redeemedByAccountId: uuid("redeemed_by_account_id").references(() => phoneAccountsTable.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
