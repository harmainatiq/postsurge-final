import { Bundlesocial } from "bundlesocial";

export type SupportedPlatform = "FACEBOOK" | "LINKEDIN" | "TWITTER" | "INSTAGRAM";

function getClient(apiKey: string): Bundlesocial {
  return new Bundlesocial(apiKey);
}

/**
 * Get connected platform types for a team.
 */
async function getConnectedPlatformTypes(
  client: Bundlesocial,
  teamId: string
): Promise<SupportedPlatform[]> {
  try {
    const team = await client.team.teamGetTeam({ id: teamId });
    const accounts = (team as any).socialAccounts ?? [];
    return accounts
      .filter((a: any) => ["FACEBOOK", "LINKEDIN", "TWITTER", "INSTAGRAM"].includes(a.type))
      .map((a: any) => a.type as SupportedPlatform);
  } catch {
    return [];
  }
}

async function uploadImageToBundleSocial(
  client: Bundlesocial,
  teamId: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
    const result = await client.upload.uploadCreate({ formData: { teamId, file: blob } });
    return (result as any).id as string;
  } catch (err) {
    console.warn("[BundleSocial] Image upload failed, posting without image:", err);
    return null;
  }
}

async function uploadVideoToBundleSocial(
  client: Bundlesocial,
  teamId: string,
  videoUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "video/mp4" });
    const result = await client.upload.uploadCreate({ formData: { teamId, file: blob } });
    return (result as any).id as string;
  } catch (err) {
    console.warn("[BundleSocial] Video upload failed, posting without video:", err);
    return null;
  }
}

export type PublishResult = {
  bundlePostId: string;
  publishedPlatforms: SupportedPlatform[];
  skippedPlatforms: SupportedPlatform[];
};

/**
 * Publish or schedule a post via bundle.social.
 * Only posts to platforms that are actually connected in the team.
 */
export async function publishToBundleSocial(
  content: string,
  platforms: SupportedPlatform[],
  apiKey: string,
  teamId: string,
  postDate?: Date,
  imageUrl?: string,
  videoUrl?: string
): Promise<PublishResult> {
  console.log("[BundleSocial] publishToBundleSocial called");
  console.log("[BundleSocial] teamId:", teamId);
  console.log("[BundleSocial] requested platforms:", platforms);
  console.log("[BundleSocial] postDate:", postDate?.toISOString() ?? "immediate");
  console.log("[BundleSocial] imageUrl:", imageUrl ?? "none");
  console.log("[BundleSocial] videoUrl:", videoUrl ?? "none");
  console.log("[BundleSocial] content length:", content.length);
  console.log("[BundleSocial] content preview:", content.slice(0, 100));

  if (!apiKey || !teamId) {
    throw new Error("bundle.social API Key and Team ID are required. Please configure them in Settings.");
  }
  if (platforms.length === 0) {
    throw new Error("At least one platform must be selected");
  }

  const client = getClient(apiKey);

  // Filter to only connected platforms
  console.log("[BundleSocial] Fetching connected platforms from bundle.social...");
  const connectedPlatforms = await getConnectedPlatformTypes(client, teamId);
  console.log("[BundleSocial] connected platforms:", connectedPlatforms);

  const publishedPlatforms = platforms.filter(p => connectedPlatforms.includes(p));
  const skippedPlatforms = platforms.filter(p => !connectedPlatforms.includes(p));
  console.log("[BundleSocial] will publish to:", publishedPlatforms);
  console.log("[BundleSocial] skipping (not connected):", skippedPlatforms);

  if (publishedPlatforms.length === 0) {
    throw new Error(
      `None of the selected platforms are connected in bundle.social. ` +
      `Selected: ${platforms.join(", ")}. ` +
      `Connected: ${connectedPlatforms.length > 0 ? connectedPlatforms.join(", ") : "none"}. ` +
      `Please connect your accounts at app.bundle.social.`
    );
  }

  // Instagram requires image or video — remove if neither present
  const hasMedia = !!(imageUrl || videoUrl);
  const effectivePlatforms = hasMedia
    ? publishedPlatforms
    : publishedPlatforms.filter(p => p !== "INSTAGRAM");

  console.log("[BundleSocial] effective platforms (after Instagram check):", effectivePlatforms);

  if (effectivePlatforms.length === 0) {
    throw new Error("Instagram requires an image or video. No other connected platforms selected.");
  }

  let uploadId: string | null = null;
  if (videoUrl) {
    console.log("[BundleSocial] Uploading video to bundle.social...");
    uploadId = await uploadVideoToBundleSocial(client, teamId, videoUrl);
    console.log("[BundleSocial] video uploadId:", uploadId ?? "upload failed, proceeding without video");
  } else if (imageUrl) {
    console.log("[BundleSocial] Uploading image to bundle.social...");
    uploadId = await uploadImageToBundleSocial(client, teamId, imageUrl);
    console.log("[BundleSocial] image uploadId:", uploadId ?? "upload failed, proceeding without image");
  }

  const scheduledDate = postDate ?? new Date();

  const TWITTER_LIMIT = 280;
  const twitterText = content.length > TWITTER_LIMIT
    ? content.slice(0, content.lastIndexOf(" ", TWITTER_LIMIT - 3)).trimEnd() + "..."
    : content;

  const data: Record<string, any> = {};
  for (const platform of effectivePlatforms) {
    data[platform] = {
      text: platform === "TWITTER" ? twitterText : content,
      ...(uploadId ? { uploadIds: [uploadId] } : {}),
    };
  }
  console.log("[BundleSocial] Twitter text length:", twitterText.length);

  const requestBody = {
    teamId,
    title: content.slice(0, 80),
    postDate: scheduledDate.toISOString(),
    status: "SCHEDULED" as const,
    socialAccountTypes: effectivePlatforms,
    data,
  };
  console.log("[BundleSocial] postCreate requestBody:", JSON.stringify(requestBody, null, 2));

  let result: any;
  try {
    result = await client.post.postCreate({ requestBody });
    console.log("[BundleSocial] postCreate success, id:", (result as any)?.id);
  } catch (err: any) {
    console.error("[BundleSocial] postCreate failed:", err?.message ?? err);
    console.error("[BundleSocial] error details:", JSON.stringify(err?.body ?? err, null, 2));
    throw err;
  }

  return {
    bundlePostId: (result as any).id as string,
    publishedPlatforms: effectivePlatforms,
    skippedPlatforms: [
      ...skippedPlatforms,
      ...(hasMedia ? [] : publishedPlatforms.filter(p => p === "INSTAGRAM")),
    ],
  };
}

/**
 * Fetch connected social accounts for a user's team.
 */
export async function getConnectedAccounts(apiKey: string, teamId: string) {
  if (!apiKey || !teamId) return [];
  const client = getClient(apiKey);
  const team = await client.team.teamGetTeam({ id: teamId });
  const accounts = (team as any).socialAccounts ?? [];
  return accounts
    .filter((a: any) => ["FACEBOOK", "LINKEDIN", "TWITTER", "INSTAGRAM"].includes(a.type))
    .map((a: any) => ({
      id: a.id as string,
      type: a.type as SupportedPlatform,
      displayName: (a.displayName || a.username || a.type) as string,
      avatarUrl: a.avatarUrl as string | undefined,
    }));
}
