import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { phoneAccountsTable } from "./phone-accounts";

export const teamDepositMilestoneClaimsTable = pgTable(
  "team_deposit_milestone_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => phoneAccountsTable.id, { onDelete: "cascade" }),
    milestoneId: text("milestone_id").notNull(),
    rewardUgx: integer("reward_ugx").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    accountMilestoneUnique: uniqueIndex("team_deposit_milestone_account_unique").on(table.accountId, table.milestoneId),
  }),
);
