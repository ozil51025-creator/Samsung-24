import { pgTable, serial, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const adminAuditLogsTable = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  adminAccountId: uuid("admin_account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  targetAccountId: uuid("target_account_id").references(() => phoneAccountsTable.id, { onDelete: "set null" }),
  amountUgx: integer("amount_ugx"),
  reason: text("reason"),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
