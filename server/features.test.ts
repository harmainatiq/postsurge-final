import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";

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

describe("Brand Guidelines", () => {
  it("should create brand guidelines", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    const result = await caller.brandGuidelines.create({
      brandName: "Test Brand",
      tone: "Professional and friendly",
      style: "Educational",
      targetAudience: "Coaches and solopreneurs",
      contentPreferences: "Focus on sales funnels and lead generation",
      keywords: "conversion, automation, sales",
      avoidWords: "cheap, discount",
    });

    expect(result).toBeDefined();
    expect(result.brandName).toBe("Test Brand");
    expect(result.tone).toBe("Professional and friendly");
    expect(result.userId).toBe(ctx.user.id);
  });

  it("should retrieve brand guidelines", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Create guidelines first
    await caller.brandGuidelines.create({
      tone: "Casual",
      style: "Informative",
    });

    // Retrieve guidelines
    const result = await caller.brandGuidelines.get();

    expect(result).toBeDefined();
    expect(result?.tone).toBe("Casual");
    expect(result?.style).toBe("Informative");
  });

  it("should update brand guidelines", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Create guidelines
    const created = await caller.brandGuidelines.create({
      tone: "Professional",
      style: "Educational",
    });

    // Update guidelines
    const updated = await caller.brandGuidelines.update({
      id: created.id,
      tone: "Friendly and approachable",
    });

    expect(updated).toBeDefined();
    expect(updated?.tone).toBe("Friendly and approachable");
    expect(updated?.style).toBe("Educational"); // Should remain unchanged
  });
});

describe("Post Generation", () => {
  it("should generate posts with AI", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Set up brand guidelines first
    await caller.brandGuidelines.create({
      tone: "Professional",
      style: "Educational",
      targetAudience: "Marketers",
    });

    // Generate posts
    const result = await caller.posts.generate({
      topic: "Email marketing best practices",
      count: 5,
    });

    expect(result).toBeDefined();
    expect(result.batchId).toBeDefined();
    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBeLessThanOrEqual(5);
  }, 60000); // Increase timeout for AI generation

  it("should list generated posts", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Generate posts
    await caller.posts.generate({
      topic: "Social media tips",
      count: 3,
    });

    // List posts
    const posts = await caller.posts.list();

    expect(posts).toBeDefined();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]?.topic).toBe("Social media tips");
  }, 60000);

  it("should update post selection", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Generate posts
    await caller.posts.generate({
      topic: "Content marketing",
      count: 2,
    });

    // Get posts
    const posts = await caller.posts.list();
    const firstPost = posts[0];

    expect(firstPost).toBeDefined();
    expect(firstPost!.isSelected).toBe(false);

    // Update selection
    const updated = await caller.posts.update({
      id: firstPost!.id,
      isSelected: true,
    });

    expect(updated).toBeDefined();
    expect(updated?.isSelected).toBe(true);
  }, 60000);

  it("should update post content", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Generate posts
    await caller.posts.generate({
      topic: "SEO strategies",
      count: 1,
    });

    // Get posts
    const posts = await caller.posts.list();
    const firstPost = posts[0];

    expect(firstPost).toBeDefined();

    // Update content
    const newContent = "This is updated content for the post.";
    const updated = await caller.posts.update({
      id: firstPost!.id,
      content: newContent,
    });

    expect(updated).toBeDefined();
    expect(updated?.content).toBe(newContent);
  }, 60000);

  it("should delete a post", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Generate posts
    await caller.posts.generate({
      topic: "Marketing automation",
      count: 2,
    });

    // Get posts
    const postsBefore = await caller.posts.list();
    const countBefore = postsBefore.length;
    const firstPost = postsBefore[0];

    expect(firstPost).toBeDefined();

    // Delete post
    await caller.posts.delete({ id: firstPost!.id });

    // Verify deletion
    const postsAfter = await caller.posts.list();
    expect(postsAfter.length).toBe(countBefore - 1);
  }, 60000);

  it("should get selected posts only", async () => {
    const ctx = createAuthContext(Math.floor(Math.random() * 1000000));
    const caller = appRouter.createCaller(ctx);

    // Generate posts
    await caller.posts.generate({
      topic: "Lead generation",
      count: 3,
    });

    // Get posts and select some
    const posts = await caller.posts.list();
    await caller.posts.update({
      id: posts[0]!.id,
      isSelected: true,
    });
    await caller.posts.update({
      id: posts[1]!.id,
      isSelected: true,
    });

    // Get selected posts
    const selected = await caller.posts.getSelected();

    expect(selected).toBeDefined();
    expect(selected.length).toBe(2);
    expect(selected.every(p => p.isSelected)).toBe(true);
  }, 60000);
});

describe("Database Cleanup", () => {
  it("should clean up test data", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for cleanup");
      return;
    }

    // This is just to verify database connection works
    expect(db).toBeDefined();
  });
});
