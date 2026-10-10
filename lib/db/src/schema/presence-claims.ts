import { date, integer, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const presenceClaimsTable = pgTable(
  "presence_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "cascade" }),
    attendanceDate: date("attendance_date", { mode: "string" }).notNull(),
    rewardUgx: integer("reward_ugx").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    accountAttendanceUnique: uniqueIndex("presence_claims_account_date_unique").on(table.accountId, table.attendanceDate),
  }),
);
