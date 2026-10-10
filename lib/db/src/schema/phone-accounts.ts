import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const phoneAccountsTable = pgTable(
  "phone_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    phoneNumber: text("phone_number").notNull(),
    passwordHash: text("password_hash").notNull(),
    walletBalanceUgx: integer("wallet_balance_ugx").notNull().default(0),
    totalAccumulatedUgx: integer("total_accumulated_ugx").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    phoneNumberUnique: uniqueIndex("phone_accounts_phone_number_unique").on(table.phoneNumber),
  }),
);

export const insertPhoneAccountSchema = createInsertSchema(phoneAccountsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPhoneAccount = z.infer<typeof insertPhoneAccountSchema>;
export type PhoneAccount = typeof phoneAccountsTable.$inferSelect;
