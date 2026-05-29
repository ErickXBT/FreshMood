import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminAccountsTable = pgTable("admin_accounts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role").notNull().default("owner"),
  permissions: jsonb("permissions").$type<string[]>(),
  resetOtp: text("reset_otp"),
  resetOtpExpiresAt: timestamp("reset_otp_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminAccountSchema = createInsertSchema(adminAccountsTable).omit({ id: true, createdAt: true });
export type InsertAdminAccount = z.infer<typeof insertAdminAccountSchema>;
export type AdminAccount = typeof adminAccountsTable.$inferSelect;
