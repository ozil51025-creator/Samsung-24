import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const payoutAccountsTable = pgTable("payout_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  holderName: text("holder_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  accountUnique: uniqueIndex("payout_accounts_account_id_unique").on(table.accountId),
}));

export const insertPayoutAccountSchema = createInsertSchema(payoutAccountsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type PayoutAccount = typeof payoutAccountsTable.$inferSelect;
