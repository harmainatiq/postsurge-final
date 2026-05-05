import cron from "node-cron";
import { getDb } from "./db";
import { posts } from "../drizzle/schema";
import { and, eq, lte, isNotNull } from "drizzle-orm";
import { publishToBundleSocial, type SupportedPlatform } from "./_core/bundleSocial";
import { getBundleCredentials } from "./db";

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ["FACEBOOK", "LINKEDIN", "TWITTER", "INSTAGRAM"];

/**
 * Fallback node-cron scheduler for non-Inngest environments.
 */
export function startScheduler() {
  console.log("[Scheduler] Starting post scheduler...");

  cron.schedule("* * * * *", async () => {
    try {
      await processScheduledPosts();
    } catch (error) {
      console.error("[Scheduler] Error:", error);
    }
  });

  console.log("[Scheduler] Post scheduler started");
}

async function processScheduledPosts() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  const readyPosts = await db
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

  if (readyPosts.length === 0) return;

  console.log(`[Scheduler] Found ${readyPosts.length} posts ready to publish`);

  for (const post of readyPosts) {
    try {
      const platforms = parsePlatforms(post.platforms);
      const creds = await getBundleCredentials(post.userId);

      if (!creds) {
        console.warn(`[Scheduler] User ${post.userId} has no bundle.social credentials, skipping post ${post.id}`);
        continue;
      }

      await publishToBundleSocial(
        post.content,
        platforms,
        creds.apiKey,
        creds.teamId,
        post.scheduledFor ? new Date(post.scheduledFor) : undefined,
        (post as any).imageUrl ?? undefined
      );

      await db
        .update(posts)
        .set({ isScheduled: true })
        .where(eq(posts.id, post.id));

      console.log(`[Scheduler] Published post ${post.id} to ${platforms.join(", ")}`);
    } catch (err) {
      console.error(`[Scheduler] Failed to publish post ${post.id}:`, err);
    }
  }
}

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
