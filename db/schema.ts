import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const timestamps = {
  createdAt: instant("created_at").notNull(),
  updatedAt: instant("updated_at").notNull(),
};

// Better Auth finds columns by these property names, so they can't be renamed.
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("is_email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: instant("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

// Unused while email codes are the only sign-in, but Better Auth requires it.
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: instant("access_token_expires_at"),
    refreshTokenExpiresAt: instant("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: instant("expires_at").notNull(),
    ...timestamps,
  },
  (table) => [
    // One live code per email. lib/auth.ts replaces the old row before creating a new one.
    uniqueIndex("verifications_identifier_unique").on(table.identifier),
    index("verifications_expires_at_idx").on(table.expiresAt),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey(),
    kind: text("kind", { enum: ["inbox", "standard"] }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    check("projects_kind_check", sql`${table.kind} IN ('inbox', 'standard')`),
    uniqueIndex("projects_one_inbox_unique")
      .on(table.createdBy)
      .where(sql`kind = 'inbox'`),
  ],
);

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner"] }).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId] }),
    check("project_members_role_check", sql`${table.role} IN ('owner')`),
    uniqueIndex("project_members_one_owner_unique")
      .on(table.projectId)
      .where(sql`role = 'owner'`),
    index("project_members_user_id_project_id_idx").on(table.userId, table.projectId),
  ],
);

// The key is a keyed hash, so no email or IP address is stored here.
export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    key: text("key").notNull(),
    occurredAt: instant("occurred_at").notNull(),
  },
  (table) => [
    index("rate_limit_events_key_occurred_at_idx").on(table.key, table.occurredAt),
    index("rate_limit_events_occurred_at_idx").on(table.occurredAt),
  ],
);

export const emailUsage = pgTable(
  "email_usage",
  {
    day: date("day").notNull(), // UTC
    purpose: text("purpose", { enum: ["sign_in"] }).notNull(),
    count: integer("count").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.day, table.purpose] }),
    check("email_usage_purpose_check", sql`${table.purpose} IN ('sign_in')`),
  ],
);
