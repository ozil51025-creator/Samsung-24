import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const phoneSessionsTable = pgTable(
  "phone_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => phoneAccountsTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    accountIndex: index("phone_sessions_account_idx").on(table.accountId),
    expiryIndex: index("phone_sessions_expiry_idx").on(table.expiresAt),
  }),
);

export type PhoneSession = typeof phoneSessionsTable.$inferSelect;
