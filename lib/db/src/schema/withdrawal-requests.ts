import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const withdrawalRequestsTable = pgTable("withdrawal_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "restrict" }),
  amountUgx: integer("amount_ugx").notNull(),
  feeUgx: integer("fee_ugx").notNull(),
  receivedUgx: integer("received_ugx").notNull(),
  payoutPhone: text("payout_phone").notNull(),
  payoutProvider: text("payout_provider").notNull().default("registered"),
  payoutHolderName: text("payout_holder_name"),
  status: text("status").notNull().default("pending"),
  resolutionNote: text("resolution_note"),
  processedByAccountId: uuid("processed_by_account_id").references(() => phoneAccountsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequestsTable).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  processedByAccountId: true,
  resolutionNote: true,
  status: true,
});

export type InsertWithdrawalRequest = typeof withdrawalRequestsTable.$inferInsert;
export type WithdrawalRequest = typeof withdrawalRequestsTable.$inferSelect;
