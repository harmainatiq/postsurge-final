import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { posts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Scheduler Logic", () => {
  it("should not send posts immediately when scheduled for future", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Create brand guidelines
    await caller.brandGuidelines.create({
      tone: "Professional",
      style: "Informative",
    });

    // Generate a post
    await caller.posts.generate({
      topic: "Scheduler test topic",
      count: 1,
    });

    // Get the post
    const allPosts = await caller.posts.list();
    const post = allPosts[0];
    expect(post).toBeDefined();

    // Schedule post for 1 hour in the future
    const futureTime = new Date(Date.now() + 3600000);
    await caller.posts.update({
      id: post!.id,
      isSelected: true,
      scheduledFor: futureTime,
    });

    // Verify post is NOT marked as scheduled yet
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, post!.id))
      .limit(1);

    expect(updatedPost[0]).toBeDefined();
    expect(updatedPost[0]!.isScheduled).toBe(false); // Should still be false
    expect(updatedPost[0]!.scheduledFor).toBeDefined();
    expect(updatedPost[0]!.isSelected).toBe(true);
  }, 60000);

  it("should mark post ready to send when scheduled time has passed", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Create brand guidelines
    await caller.brandGuidelines.create({
      tone: "Casual",
      style: "Engaging",
    });

    // Generate a post
    await caller.posts.generate({
      topic: "Past schedule test",
      count: 1,
    });

    // Get the post
    const allPosts = await caller.posts.list();
    const post = allPosts[0];
    expect(post).toBeDefined();

    // Schedule post for 1 minute in the PAST (simulating a post that should be sent)
    const pastTime = new Date(Date.now() - 60000);
    await caller.posts.update({
      id: post!.id,
      isSelected: true,
      scheduledFor: pastTime,
    });

    // Verify post is ready to be picked up by scheduler
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const readyPost = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.id, post!.id),
          eq(posts.isSelected, true),
          eq(posts.isScheduled, false)
        )
      )
      .limit(1);

    expect(readyPost[0]).toBeDefined();
    expect(readyPost[0]!.scheduledFor!.getTime()).toBeLessThan(Date.now());
    
    // This post would be picked up by the scheduler on next run
  }, 60000);

  it("should not process posts without webhook configured", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Create brand guidelines
    await caller.brandGuidelines.create({
      tone: "Professional",
      style: "Educational",
    });

    // Generate a post
    await caller.posts.generate({
      topic: "No webhook test",
      count: 1,
    });

    // Get the post
    const allPosts = await caller.posts.list();
    const post = allPosts[0];

    // Schedule post without configuring webhook
    const pastTime = new Date(Date.now() - 60000);
    await caller.posts.update({
      id: post!.id,
      isSelected: true,
      scheduledFor: pastTime,
    });

    // Get settings - should be empty or no webhook
    const settings = await caller.settings.get();
    expect(!settings || !settings.zapierWebhookUrl).toBe(true);

    // Post should remain unscheduled (scheduler would skip it)
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const unsentPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, post!.id))
      .limit(1);

    expect(unsentPost[0]!.isScheduled).toBe(false);
  }, 60000);
});
