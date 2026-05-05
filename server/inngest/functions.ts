import { inngest } from "./client";
import { getDb, getBundleCredentials, createNotification } from "../db";
import { posts } from "../../drizzle/schema";
import { and, eq, lte, isNotNull } from "drizzle-orm";
import { publishToBundleSocial, type SupportedPlatform } from "../_core/bundleSocial";

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ["FACEBOOK", "LINKEDIN", "TWITTER", "INSTAGRAM"];

/**
 * Inngest cron — runs every minute, finds scheduled posts whose time has come,
 * publishes them via bundle.social, then marks them as sent.
 */
export const processScheduledPosts = inngest.createFunction(
  {
    id: "process-scheduled-posts",
    name: "Process Scheduled Posts",
  },
  { cron: "* * * * *" },
  async ({ step }) => {
    const db = await getDb();
    if (!db) {
      console.warn("[Scheduler] Database not available");
      return { status: "skipped", reason: "no-db" };
    }

    const now = new Date();

    const readyPosts = await step.run("fetch-ready-posts", async () => {
      return await db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.isSelected, true),
            isNotNull(posts.scheduledFor),
            lte(posts.scheduledFor, now),
            eq(posts.isScheduled, false)
          )
        );
    });

    if (readyPosts.length === 0) {
      return { status: "success", processed: 0 };
    }

    console.log(`[Scheduler] Found ${readyPosts.length} posts ready to publish`);

    let totalSent = 0;

    for (const post of readyPosts) {
      const result = await step.run(`publish-post-${post.id}`, async () => {
        try {
          const platforms = parsePlatforms(post.platforms);
          const creds = await getBundleCredentials(post.userId);

          if (!creds) {
            console.warn(`[Scheduler] User ${post.userId} has no bundle.social credentials, skipping post ${post.id}`);
            return { status: "skipped" };
          }

          const publishResult = await publishToBundleSocial(
            post.content,
            platforms,
            creds.apiKey,
            creds.teamId,
            new Date(),
            (post as any).imageUrl ?? undefined,
            (post as any).videoUrl ?? undefined
          );

          await db
            .update(posts)
            .set({
              isScheduled: true,
              platforms: JSON.stringify(publishResult.publishedPlatforms),
            })
            .where(eq(posts.id, post.id));

          await createNotification({
            userId: post.userId,
            postId: post.id,
            platforms: JSON.stringify(publishResult.publishedPlatforms),
            imageUrl: (post as any).imageUrl ?? null,
            postPreview: post.content.slice(0, 120),
            publishedAt: new Date(),
          });

          console.log(`[Scheduler] Published post ${post.id} to ${platforms.join(", ")}`);
          return { status: "success" };
        } catch (err) {
          console.error(`[Scheduler] Failed to publish post ${post.id}:`, err);
          await createNotification({
            userId: post.userId,
            postId: post.id,
            platforms: JSON.stringify(parsePlatforms(post.platforms)),
            imageUrl: (post as any).imageUrl ?? null,
            postPreview: post.content.slice(0, 120),
            publishedAt: new Date(),
            type: "failed",
            errorMessage: String(err),
          });
          return { status: "error", error: String(err) };
        }
      });

      if (result?.status === "success") totalSent++;
    }

    return { status: "success", processed: totalSent };
  }
);

function parsePlatforms(raw: string | null): SupportedPlatform[] {
  if (!raw) return ["FACEBOOK"];
  try {
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((p): p is SupportedPlatform =>
      SUPPORTED_PLATFORMS.includes(p as SupportedPlatform)
    );
    return valid.length > 0 ? valid : ["FACEBOOK"];
  } catch {
    return ["FACEBOOK"];
  }
}
