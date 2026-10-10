import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminSiteSettingsTable = pgTable("admin_site_settings", {
  id: text("id").primaryKey().default("default"),
  settings: jsonb("settings").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
