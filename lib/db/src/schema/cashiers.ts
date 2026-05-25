import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const cashiersTable = pgTable("cashiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Cashier = typeof cashiersTable.$inferSelect;
