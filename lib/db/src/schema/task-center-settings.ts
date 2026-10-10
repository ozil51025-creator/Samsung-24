import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const taskCenterSettingsTable = pgTable("task_center_settings", {
  id: text("id").primaryKey().default("default"),
  tasks: jsonb("tasks").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
