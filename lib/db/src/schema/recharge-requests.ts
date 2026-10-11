import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const rechargeRequestsTable = pgTable("recharge_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "cascade" }),
  amountUgx: integer("amount_ugx").notNull(),
  payerPhone: text("payer_phone").notNull(),
  provider: text("provider"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
