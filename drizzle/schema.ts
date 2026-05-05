import { pgTable, serial, text, timestamp, varchar, boolean, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Brand guidelines table - stores user's brand voice and content preferences
 */
export const brandGuidelines = pgTable("brand_guidelines", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  brandName: varchar("brand_name", { length: 255 }),
  tone: text("tone").notNull(),
  style: text("style").notNull(),
  targetAudience: text("target_audience"),
  contentPreferences: text("content_preferences"),
  keywords: text("keywords"),
  avoidWords: text("avoid_words"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BrandGuideline = typeof brandGuidelines.$inferSelect;
export type InsertBrandGuideline = typeof brandGuidelines.$inferInsert;

/**
 * Generated posts table - stores AI-generated social media posts
 */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  batchId: varchar("batch_id", { length: 64 }).notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  isSelected: boolean("is_selected").default(false).notNull(),
  isScheduled: boolean("is_scheduled").default(false).notNull(),
  scheduledFor: timestamp("scheduled_for"),
  platforms: text("platforms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * User settings table - stores user preferences and integrations
 */
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().unique(),
  bundleSocialApiKey: text("bundle_social_api_key"),
  bundleSocialTeamId: text("bundle_social_team_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Notifications table - stores publish events for the in-app notification feed
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  postId: serial("post_id").notNull(),
  platforms: text("platforms").notNull(),      // JSON: ["FACEBOOK","LINKEDIN"]
  imageUrl: text("image_url"),                  // Cloudinary URL for thumbnail
  postPreview: text("post_preview").notNull(),  // First 120 chars of post content
  publishedAt: timestamp("published_at").notNull(),
  readAt: timestamp("read_at"),
  type: text("type").notNull().default("published"), // "published" | "failed"
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
