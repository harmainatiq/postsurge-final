import { storagePut } from "../storage";
import { ENV } from "./env";

/**
 * Text-to-video via WaveSpeed AI.
 *
 * Priority:
 *   1. bytedance/seedance-v1-pro-fast/text-to-video  — 6s = $0.072/video (cheap, good quality)
 *   2. minimax/hailuo-02/t2v-standard                — 6s = $0.23/video (quality fallback) *
 * Requires WAVESPEED_API_KEY from https://wavespeed.ai
 */
export async function generateAndStoreVideo(prompt: string): Promise<string> {
  if (!ENV.wavespeedApiKey) {
    throw new Error("WAVESPEED_API_KEY is required for video generation. Get one at https://wavespeed.ai");
  }

  let predictionId: string;

  try {
    console.log("[VideoGen] Submitting to WaveSpeed seedance-v1-pro-fast (6s, ~$0.07)...");
    predictionId = await submitTask("bytedance/seedance-v1-pro-fast/text-to-video", {
      prompt,
      duration: 6,
      resolution: "480p",
    });
    console.log("[VideoGen] Using model: seedance-v1-pro-fast");
  } catch (err) {
    console.warn("[VideoGen] seedance-v1-pro-fast failed, falling back to hailuo-02/t2v-standard:", err);
    predictionId = await submitTask("minimax/hailuo-02/t2v-standard", { prompt, duration: 6 });
    console.log("[VideoGen] Using model: hailuo-02/t2v-standard (fallback)");
  }

  const downloadUrl = await pollForCompletion(predictionId);
  console.log("[VideoGen] Complete, downloading...");

  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Failed to download video: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const key = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { url } = await storagePut(key, buffer, "video/mp4");

  console.log("[VideoGen] Uploaded to Cloudinary:", url);
  return url;
}

async function submitTask(modelId: string, input: Record<string, unknown>): Promise<string> {
  const response = await fetch(`https://api.wavespeed.ai/api/v3/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.wavespeedApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`WaveSpeed [${modelId}] submit failed: ${response.status} ${err}`);
  }

  const data = await response.json() as { code?: number; message?: string; data?: { id?: string } };
  if (data.code !== 200) throw new Error(`WaveSpeed error: ${data.message}`);
  const id = data.data?.id;
  if (!id) throw new Error("WaveSpeed returned no prediction id");
  return id;
}

async function pollForCompletion(predictionId: string): Promise<string> {
  const maxAttempts = 60; // 10 min max

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(10_000);

    const response = await fetch(
      `https://api.wavespeed.ai/api/v3/predictions/${predictionId}/result`,
      { headers: { Authorization: `Bearer ${ENV.wavespeedApiKey}` } }
    );

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`WaveSpeed poll failed: ${response.status} ${err}`);
    }

    const data = await response.json() as {
      code?: number;
      data?: { status?: string; outputs?: string[]; error?: string };
    };

    const status = data.data?.status;
    console.log(`[VideoGen] Poll ${i + 1}: ${status}`);

    if (status === "completed") {
      const url = data.data?.outputs?.[0];
      if (!url) throw new Error("WaveSpeed completed but no output URL");
      return url;
    }

    if (status === "failed") {
      throw new Error(`WaveSpeed generation failed: ${data.data?.error ?? "unknown error"}`);
    }
  }

  throw new Error("WaveSpeed video generation timed out after 10 minutes");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a cinematic video prompt using Groq for better scene description.
 * Falls back to a template-based prompt if Groq is unavailable.
 */
export async function buildVideoPrompt(topic: string, postContent: string): Promise<string> {
  if (ENV.groqApiKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an expert video prompt engineer for social media content.
Given a social media post topic and content, write a single cinematic video scene description for a 10-second social media video clip.

Rules:
- Describe ONE continuous visual scene (not multiple cuts)
- Include: subject/action, camera movement, lighting, mood, environment
- Optimized for 10 seconds: start with motion, build to a peak, end with impact
- Style: cinematic, high-energy, social-media-ready (think Instagram Reels / TikTok)
- NO text, NO captions, NO logos, NO watermarks in the scene
- Return ONLY the scene description, no extra commentary, max 200 words`,
            },
            {
              role: "user",
              content: `Topic: ${topic}\n\nPost content:\n${postContent.slice(0, 400)}\n\nWrite a 10-second social media video scene for this topic.`,
            },
          ],
          max_tokens: 200,
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const scene = data.choices?.[0]?.message?.content?.trim();
        if (scene) {
          console.log("[VideoGen] Groq prompt:", scene.slice(0, 100) + "...");
          return scene;
        }
      }
    } catch (err) {
      console.warn("[VideoGen] Groq prompt generation failed, using fallback:", err);
    }
  }

  // Fallback: template-based prompt
  const clean = postContent
    .replace(/#\w+/g, "")
    .replace(/@\w+/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const firstSentence = (clean.split(/[.!?]/)[0] || clean).trim().slice(0, 120);

  return (
    `10-second social media video for topic: "${topic}". ` +
    `Scene: ${firstSentence}. ` +
    `Cinematic camera movement, dynamic pacing for social media, vibrant colors, ` +
    `professional lighting, high energy, no text or captions. ` +
    `Optimized for Instagram Reels and TikTok format.`
  );
}
