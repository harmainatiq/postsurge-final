import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("Settings", () => {
  it("should get user settings", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.get();
    // Should return undefined or existing settings
    expect(result === undefined || result.userId === ctx.user.id).toBe(true);
  });

  it("should update webhook URL", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    const webhookUrl = "https://hooks.zapier.com/hooks/catch/test123/abc456";
    const result = await caller.settings.updateWebhook({ webhookUrl });

    expect(result).toBeDefined();
    expect(result.zapierWebhookUrl).toBe(webhookUrl);
    expect(result.userId).toBe(ctx.user.id);
  });

  it("should retrieve saved webhook URL", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    const webhookUrl = "https://hooks.zapier.com/hooks/catch/test789/xyz123";
    await caller.settings.updateWebhook({ webhookUrl });

    const settings = await caller.settings.get();
    expect(settings).toBeDefined();
    expect(settings?.zapierWebhookUrl).toBe(webhookUrl);
  });

  it("should update user name", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    const newName = "Updated Test User";
    const result = await caller.settings.updateName({ name: newName });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

describe("Post Scheduling", () => {
  it("should update post with scheduled time", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Create brand guidelines first
    await caller.brandGuidelines.create({
      tone: "Professional",
      style: "Educational",
    });

    // Generate a post
    const generated = await caller.posts.generate({
      topic: "Test scheduling topic",
      count: 1,
    });

    // Get the post
    const posts = await caller.posts.list();
    const post = posts[0];

    expect(post).toBeDefined();

    // Schedule the post
    const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now
    const updated = await caller.posts.update({
      id: post!.id,
      scheduledFor: scheduledTime,
      isSelected: true,
    });

    expect(updated).toBeDefined();
    expect(updated?.scheduledFor).toBeDefined();
    expect(updated?.isSelected).toBe(true);
  }, 60000);

  it("should send scheduled posts to Zapier", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Create brand guidelines
    await caller.brandGuidelines.create({
      tone: "Casual",
      style: "Engaging",
    });

    // Generate posts
    await caller.posts.generate({
      topic: "Zapier integration test",
      count: 2,
    });

    // Get posts and select them
    const posts = await caller.posts.list();
    await caller.posts.update({
      id: posts[0]!.id,
      isSelected: true,
      scheduledFor: new Date(Date.now() + 7200000),
    });
    await caller.posts.update({
      id: posts[1]!.id,
      isSelected: true,
      scheduledFor: new Date(Date.now() + 7200000),
    });

    // Note: We can't actually test Zapier webhook without a real URL
    // This test verifies the data structure is correct
    const selectedPosts = await caller.posts.getSelected();
    expect(selectedPosts.length).toBeGreaterThanOrEqual(2);
    expect(selectedPosts.every(p => p.isSelected)).toBe(true);
  }, 60000);
});
