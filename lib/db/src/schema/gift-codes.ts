import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const giftCodesTable = pgTable("gift_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  amountUgx: integer("amount_ugx").notNull(),
  maxRedemptions: integer("max_redemptions").notNull().default(1),
  redeemedCount: integer("redeemed_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  createdByAdminAccountId: uuid("created_by_admin_account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
  redeemedByAccountId: uuid("redeemed_by_account_id").references(() => phoneAccountsTable.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const giftCodeRedemptionsTable = pgTable("gift_code_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  giftCodeId: uuid("gift_code_id").notNull().references(() => giftCodesTable.id, { onDelete: "restrict" }),
  accountId: uuid("account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeAccountUnique: uniqueIndex("gift_code_redemptions_code_account_unique").on(table.giftCodeId, table.accountId),
}));
