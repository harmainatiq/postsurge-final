# Implementation Plan: Inngest-Owned Scheduling + Notifications

## Overview

Two changes working together:

1. **Inngest-owned scheduling** — PostSurge owns the schedule entirely. Scheduled posts are stored in the DB; Inngest fires at the right minute and calls bundle.social to publish *right now*. Bundle.social becomes a pure publisher, not a scheduler.
2. **In-app notifications** — After every successful publish (immediate or scheduled), a notification is saved to the DB and shown in a bell icon in the app nav. Frontend polls every 30 seconds.

---

## Part 1: Inngest-Owned Scheduling

### Problem with Current Flow

| Path | What happens now |
|---|---|
| User clicks "Schedule" | `posts.publish` calls bundle.social with `status: "SCHEDULED"` + future `scheduledFor` date → bundle.social owns delivery |
| Inngest cron fires | Calls bundle.social with `status: "SCHEDULED"` + original past `scheduledFor` date → still bundle.social's problem |

Neither path gives PostSurge confirmation that the post actually went live. No hook to send a notification.

### New Flow

| Path | What happens |
|---|---|
| User clicks "Schedule" | `posts.publish` saves `scheduledFor` + `platforms` + `isSelected: true` to DB. **Does NOT call bundle.social.** Returns immediately. |
| User clicks "Post Now" | `posts.publish` calls bundle.social with `postDate: new Date()` → on success → create notification → mark `isScheduled: true` |
| Inngest cron (every minute) | Finds ready posts → calls bundle.social with `postDate: new Date()` → on success → create notification → mark `isScheduled: true` |

Bundle.social always receives "publish right now" — Inngest controls when that happens.

---

### File Changes

#### 1. `server/routers.ts` — Split `posts.publish` into two paths

**Current behavior:** always calls bundle.social regardless of whether post is immediate or scheduled.

**New behavior:**

```ts
publish: protectedProcedure
  .input(z.object({
    postIds: z.array(z.number()),
    platforms: z.array(z.enum(["FACEBOOK", "LINKEDIN", "TWITTER", "INSTAGRAM"])),
    scheduledFor: z.date().optional(),
  }))
  .mutation(async ({ ctx, input }) => {

    // --- SCHEDULED PATH ---
    // Just save to DB. Inngest will publish at the right time.
    if (input.scheduledFor) {
      const allPosts = await getPostsByUserId(ctx.user.id);
      const toSchedule = allPosts.filter(p => input.postIds.includes(p.id));

      for (const post of toSchedule) {
        await updatePost(post.id, ctx.user.id, {
          scheduledFor: input.scheduledFor,
          platforms: JSON.stringify(input.platforms),
          isSelected: true,
          isScheduled: false,  // Inngest will set this to true when published
        });
      }

      return {
        success: true,
        mode: "scheduled",
        scheduled: toSchedule.length,
        scheduledFor: input.scheduledFor,
      };
    }

    // --- IMMEDIATE PATH ---
    // Call bundle.social now, create notification on success.
    const creds = await getBundleCredentials(ctx.user.id);
    if (!creds) throw new Error("bundle.social credentials not configured.");

    const allPosts = await getPostsByUserId(ctx.user.id);
    const toPublish = allPosts.filter(p => input.postIds.includes(p.id));
    const platforms = input.platforms as SupportedPlatform[];
    const errors: { id: number; error: string }[] = [];

    for (const post of toPublish) {
      const effectivePlatforms = post.imageUrl
        ? platforms
        : platforms.filter(p => p !== "INSTAGRAM");

      if (effectivePlatforms.length === 0) continue;

      try {
        const result = await publishToBundleSocial(
          post.content,
          effectivePlatforms,
          creds.apiKey,
          creds.teamId,
          new Date(),            // ← publish right now
          post.imageUrl ?? undefined
        );

        await updatePost(post.id, ctx.user.id, {
          isScheduled: true,
          platforms: JSON.stringify(result.publishedPlatforms),
        });

        // Create notification
        await createNotification({
          userId: ctx.user.id,
          postId: post.id,
          platforms: JSON.stringify(result.publishedPlatforms),
          imageUrl: post.imageUrl ?? null,
          postPreview: post.content.slice(0, 120),
          publishedAt: new Date(),
        });

      } catch (err) {
        errors.push({ id: post.id, error: String(err) });
      }
    }

    return {
      success: errors.length === 0,
      mode: "immediate",
      sent: toPublish.length - errors.length,
      errors,
    };
  }),
```

---

#### 2. `server/inngest/functions.ts` — Publish now + create notification

**Change 1:** Pass `new Date()` instead of `new Date(post.scheduledFor)` so bundle.social publishes immediately.

**Change 2:** After successful publish, call `createNotification`.

```ts
await publishToBundleSocial(
  post.content,
  platforms,
  creds.apiKey,
  creds.teamId,
  new Date(),            // ← was: post.scheduledFor ? new Date(post.scheduledFor) : undefined
  (post as any).imageUrl ?? undefined
);

await db
  .update(posts)
  .set({ isScheduled: true })
  .where(eq(posts.id, post.id));

// NEW: create notification after confirmed publish
await createNotification({
  userId: post.userId,
  postId: post.id,
  platforms: JSON.stringify(platforms),
  imageUrl: (post as any).imageUrl ?? null,
  postPreview: post.content.slice(0, 120),
  publishedAt: new Date(),
});
```

---

#### 3. `server/_core/bundleSocial.ts` — No changes needed

The function already handles `postDate ?? new Date()`. Passing `new Date()` from both callers is sufficient — bundle.social treats a present/past `postDate` as publish-now.

---

## Part 2: Notifications

### Data Model

#### `drizzle/schema.ts` — Add `notifications` table

```ts
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  postId: serial("post_id").notNull(),
  platforms: text("platforms").notNull(),     // JSON: ["FACEBOOK","LINKEDIN"]
  imageUrl: text("image_url"),                 // Cloudinary URL for thumbnail
  postPreview: text("post_preview").notNull(), // First 120 chars of post content
  publishedAt: timestamp("published_at").notNull(),
  readAt: timestamp("read_at"),                // null = unread
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
```

Run `pnpm db:push` after adding this.

---

### DB Layer

#### `server/db.ts` — Add notification CRUD

```ts
// Create a notification record
export async function createNotification(data: {
  userId: number;
  postId: number;
  platforms: string;
  imageUrl: string | null;
  postPreview: string;
  publishedAt: Date;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

// Get all notifications for a user, newest first, limit 50
export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

// Count unread notifications for badge
export async function getUnreadCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return result[0]?.count ?? 0;
}

// Mark a single notification as read
export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

// Mark all unread notifications as read
export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
```

---

### tRPC Router

#### `server/routers.ts` — Add `notifications` router

```ts
notifications: router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getNotificationsByUserId(ctx.user.id);
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await getUnreadCount(ctx.user.id);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
}),
```

---

### Frontend

#### New file: `client/src/components/NotificationBell.tsx`

Responsibilities:
- Polls `notifications.unreadCount` every **30 seconds** via `refetchInterval: 30_000`
- Shows a bell icon (Lucide `Bell`) with a red badge if unread count > 0
- On click → opens `NotificationPanel`
- On panel open → calls `notifications.markAllRead`

```tsx
// Polling setup with React Query
const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
});
```

---

#### New file: `client/src/components/NotificationPanel.tsx`

A dropdown/popover (use Radix `Popover`) that shows the notification feed.

**Each notification card displays:**
- Post thumbnail image (if `imageUrl` exists) — small square on the left
- Platform icons (Facebook/LinkedIn/Twitter/Instagram SVG icons) — which platforms it published to
- Relative time ("2 minutes ago") via `date-fns` or manual formatting
- First line of `postPreview` (truncated to ~80 chars)
- Unread notifications have a subtle highlight background

**Empty state:** "No notifications yet. Published posts will appear here."

**Data fetching:**
```tsx
const { data: notificationsList } = trpc.notifications.list.useQuery(undefined, {
  refetchInterval: 30_000,
});
```

---

#### Wire into nav/header

Add `<NotificationBell />` to the app's top navigation bar, next to the user avatar/menu. The exact location depends on the existing layout component (check `client/src/` for a `Layout`, `Header`, or `Navbar` component).

---

## Implementation Order

Execute in this order to avoid broken states:

```
1. drizzle/schema.ts         → add notifications table
2. pnpm db:push              → run migration
3. server/db.ts              → add 5 notification DB functions
4. server/routers.ts         → add notifications router + update posts.publish
5. server/inngest/functions.ts → pass new Date(), add createNotification call
6. client: NotificationBell.tsx
7. client: NotificationPanel.tsx
8. client: wire bell into nav
```

---

## Behavior After Implementation

### Scheduled post flow
```
User sets scheduledFor = 3:00pm, clicks Schedule
  → posts.publish saves to DB only (isSelected: true, isScheduled: false)
  → Returns "Scheduled for 3:00pm"

Inngest cron fires at 3:00:xx
  → Finds post (scheduledFor <= now, isScheduled: false)
  → Calls bundle.social with postDate: new Date() → publishes immediately
  → Creates notification: "Published to LinkedIn, Twitter at 3:00pm"
  → Sets isScheduled: true
```

### Immediate post flow
```
User selects posts, clicks Post Now
  → posts.publish calls bundle.social with postDate: new Date()
  → On success → creates notification immediately
  → Sets isScheduled: true
  → Returns success
```

### Notification display
```
Bell icon shows badge: 2 unread
User clicks bell
  → Dropdown opens, all marked as read
  → Shows notification card:
     [image thumbnail] Published to LinkedIn, Twitter
                        "Your brand's latest insights on..."
                        3 minutes ago
```

---

## Key Decisions

| Decision | Reason |
|---|---|
| Polling (30s) not WebSocket/SSE | Vercel serverless can't hold persistent connections |
| `new Date()` passed to bundle.social | Inngest fires when it's time — bundle.social just executes, not schedules |
| One notification per publish event (not per platform) | Less noise; platforms shown as icons within the card |
| Limit 50 notifications in DB query | Keeps the panel fast; old notifications are still in DB |
| `refetchIntervalInBackground: false` | Don't poll when tab is not focused — saves bandwidth |
| Store `postPreview` in notification row | Post content could be edited later; snapshot at publish time is accurate |
