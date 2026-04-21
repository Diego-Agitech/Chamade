import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const members = sqliteTable("members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).default(true),
  lastLoginAt: text("last_login_at"),
  color: text("color").notNull(),
  emoji: text("emoji"),
  notifyOnNewStay: integer("notify_on_new_stay", { mode: "boolean" }).default(true),
  notifyOnOverlap: integer("notify_on_overlap", { mode: "boolean" }).default(true),
  notifyOnTodoAssigned: integer("notify_on_todo_assigned", { mode: "boolean" }).default(true),
  notifyOnNewExpense: integer("notify_on_new_expense", { mode: "boolean" }).default(false),
  notifyMonthlyFinanceReport: integer("notify_monthly_finance_report", { mode: "boolean" }).default(true),
  notifyWeeklyDigest: integer("notify_weekly_digest", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const stays = sqliteTable("stays", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isRental: integer("is_rental", { mode: "boolean" }).default(false),
  rentalGuestName: text("rental_guest_name"),
  notes: text("notes"),
  createdBy: text("created_by").references(() => members.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const todoCategories = sqliteTable("todo_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order").default(0),
});

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id").references(() => todoCategories.id),
  title: text("title").notNull(),
  description: text("description"),
  attachmentUrl: text("attachment_url"),
  isDone: integer("is_done", { mode: "boolean" }).default(false),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).default("todo"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  createdBy: text("created_by").references(() => members.id),
  assignedTo: text("assigned_to").references(() => members.id),
  dueDate: text("due_date"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
});

export const expenseCategories = sqliteTable("expense_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  nature: text("nature", { enum: ["OPEX", "CAPEX"] }).notNull(),
  zone: text("zone", {
    enum: ["chamade", "pavillon", "poolhouse", "piscine", "vignes", "jardin", "global"],
  }).default("global"),
  icon: text("icon"),
  color: text("color"),
  amortizationYears: integer("amortization_years"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nature: text("nature", { enum: ["OPEX", "CAPEX"] }).notNull(),
  categoryId: text("category_id")
    .references(() => expenseCategories.id)
    .notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").default("EUR"),
  vatAmount: real("vat_amount"),
  description: text("description").notNull(),
  vendor: text("vendor"),
  date: text("date").notNull(),
  paidBy: text("paid_by").references(() => members.id),
  relatedStayId: text("related_stay_id").references(() => stays.id),
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  recurrenceFrequency: text("recurrence_frequency", {
    enum: ["monthly", "quarterly", "yearly"],
  }),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const revenues = sqliteTable("revenues", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  source: text("source", { enum: ["rental", "vignes", "divers"] }).notNull(),
  subcategory: text("subcategory"),
  grossAmount: real("gross_amount").notNull(),
  deductions: real("deductions").default(0),
  netAmount: real("net_amount").notNull(),
  currency: text("currency").default("EUR"),
  description: text("description").notNull(),
  date: text("date").notNull(),
  receivedBy: text("received_by").references(() => members.id),
  payerName: text("payer_name"),
  relatedStayId: text("related_stay_id").references(() => stays.id),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const compensationPayments = sqliteTable("compensation_payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromMemberId: text("from_member_id")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  toMemberId: text("to_member_id")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const keyContacts = sqliteTable("key_contacts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  email: text("email"),
  serviceZone: text("service_zone"),
  notes: text("notes"),
  isEmergency: integer("is_emergency", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const notificationLog = sqliteTable("notification_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").references(() => members.id),
  type: text("type").notNull(),
  relatedEntityId: text("related_entity_id"),
  sentAt: text("sent_at").default(sql`CURRENT_TIMESTAMP`),
  success: integer("success", { mode: "boolean" }).default(true),
});
