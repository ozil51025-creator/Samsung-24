import { phoneAccountsTable } from "./phone-accounts";
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const adminAccountsTable = pgTable("admin_accounts", {
  accountId: uuid("account_id").primaryKey().references(() => phoneAccountsTable.id, { onDelete: "cascade" }),
  grantedByAccountId: uuid("granted_by_account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
