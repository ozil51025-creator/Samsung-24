import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const phoneReferralCodesTable = pgTable(
  "phone_referral_codes",
  {
    accountId: uuid("account_id")
      .primaryKey()
      .references(() => phoneAccountsTable.id, { onDelete: "cascade" }),
    referralCode: text("referral_code").notNull(),
    referredByAccountId: uuid("referred_by_account_id")
      .references(() => phoneAccountsTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    referralCodeUnique: uniqueIndex("phone_referral_codes_code_unique").on(table.referralCode),
    referredByAccountIdx: index("phone_referral_codes_referred_by_idx").on(table.referredByAccountId),
  }),
);
