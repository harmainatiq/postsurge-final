import { eq, and, desc, count, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, brandGuidelines, InsertBrandGuideline, BrandGuideline, posts, InsertPost, Post, userSettings, InsertUserSettings, UserSettings, notifications, Notification } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function createUser(user: InsertUser): Promise<typeof users.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(user).returning();
  return result[0]!;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLastSignedIn(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

// Brand Guidelines helpers
export async function getBrandGuidelineByUserId(userId: number): Promise<BrandGuideline | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(brandGuidelines).where(eq(brandGuidelines.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBrandGuideline(guideline: InsertBrandGuideline): Promise<BrandGuideline> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(brandGuidelines).values(guideline).returning();
  return result[0]!;
}

export async function updateBrandGuideline(id: number, userId: number, updates: Partial<InsertBrandGuideline>): Promise<BrandGuideline | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(brandGuidelines)
    .set(updates)
    .where(and(eq(brandGuidelines.id, id), eq(brandGuidelines.userId, userId)));

  const updated = await db.select().from(brandGuidelines).where(eq(brandGuidelines.id, id)).limit(1);
  return updated.length > 0 ? updated[0] : undefined;
}

// Posts helpers
export async function createPosts(postList: InsertPost[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(posts).values(postList);
}

export async function getPostsByUserId(userId: number): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt), posts.id);
}

export async function getPostsByBatchId(batchId: string, userId: number): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(posts)
    .where(and(eq(posts.batchId, batchId), eq(posts.userId, userId)))
    .orderBy(desc(posts.createdAt));
}

export async function updatePost(id: number, userId: number, updates: Partial<InsertPost>): Promise<Post | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(posts)
    .set(updates)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)));

  const updated = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return updated.length > 0 ? updated[0] : undefined;
}

export async function deletePost(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(posts).where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

export async function getSelectedPosts(userId: number): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(posts)
    .where(and(eq(posts.userId, userId), eq(posts.isSelected, true)))
    .orderBy(desc(posts.createdAt));
}

// ============================================================================
// User Settings Operations
// ============================================================================

export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserSettings(data: InsertUserSettings & { userId: number }): Promise<UserSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserSettings(data.userId);

  if (existing) {
    await db.update(userSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSettings.userId, data.userId));
  } else {
    await db.insert(userSettings).values(data);
  }

  const result = await getUserSettings(data.userId);
  if (!result) throw new Error("Failed to create/update settings");
  return result;
}

export async function saveBundleCredentials(
  userId: number,
  apiKey: string,
  teamId: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserSettings(userId);
  if (existing) {
    await db.update(userSettings)
      .set({ bundleSocialApiKey: apiKey, bundleSocialTeamId: teamId, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, bundleSocialApiKey: apiKey, bundleSocialTeamId: teamId });
  }
}

export async function getBundleCredentials(userId: number): Promise<{ apiKey: string; teamId: string } | null> {
  const settings = await getUserSettings(userId);
  if (
    !settings?.bundleSocialApiKey ||
    !settings?.bundleSocialTeamId ||
    settings.bundleSocialApiKey === "_pending_" ||
    settings.bundleSocialTeamId === "_pending_"
  ) return null;
  return { apiKey: settings.bundleSocialApiKey, teamId: settings.bundleSocialTeamId };
}

export async function updateUserName(userId: number, name: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ name }).where(eq(users.id, userId));
}

// ============================================================================
// Notification Operations
// ============================================================================

export async function createNotification(data: {
  userId: number;
  postId: number;
  platforms: string;
  imageUrl: string | null;
  postPreview: string;
  publishedAt: Date;
  type?: string;
  errorMessage?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotificationsByUserId(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function getAllNotificationsByUserId(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(500);
}

export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return result[0]?.count ?? 0;
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
