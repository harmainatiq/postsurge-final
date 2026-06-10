import { storagePut } from "../storage";
import { ENV } from "./env";

export async function generateAndStoreImage(prompt: string): Promise<string> {
  if (!ENV.huggingFaceApiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not set");
  }

  console.log("[ImageGen] Using HuggingFace FLUX.1");
  const buffer = await generateViaHuggingFace(prompt);
  console.log("[ImageGen] HuggingFace succeeded");

  const key = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { url } = await storagePut(key, buffer, "image/png");
  console.log("[ImageGen] Uploaded to Cloudinary:", url);
  return url;
}

async function generateViaHuggingFace(prompt: string): Promise<Buffer> {
  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.huggingFaceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: 1024,
          height: 1024,
          num_inference_steps: 4,
          negative_prompt: "text, words, letters, watermark, logo, blurry, low quality, ugly, deformed",
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`HuggingFace image generation failed: ${response.status} ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Uses Groq to generate a vivid image scene description AND a catchy headline.
 * Returns both so the caller can generate a clean image and overlay the headline via Cloudinary.
 */
export async function buildEnhancedImagePrompt(
  topic: string,
  postContent: string
): Promise<{ imagePrompt: string; headline: string }> {
  if (!ENV.groqApiKey) {
    return buildImagePrompt(topic, postContent);
  }

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
            content: `You are an expert prompt engineer and social media strategist.
Given a social media post and its topic, return ONLY valid JSON with two fields:
1. "title": a punchy 5-8 word headline in Title Case that captures the post's core value proposition — extracted directly from the post content, NOT a generic rewrite of the topic. This will appear as a headline ON the image, so make it specific and compelling.
2. "scene": a vivid visual scene description for a square (1:1) social media image — directly tied to the title, specific lighting, colors, mood, composition. Absolutely NO text, typography, or signs in the scene.
Return ONLY: {"title": "...", "scene": "..."}`,
          },
          {
            role: "user",
            content: `Topic: ${topic}\n\nPost:\n${postContent.slice(0, 400)}`,
          },
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Groq API ${response.status}`);

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("Empty response from Groq");

    const parsed = JSON.parse(raw) as { scene?: string; title?: string };
    const scene = parsed.scene?.trim();
    const headline = parsed.title?.trim() || topic;

    if (!scene) throw new Error("Missing scene in Groq response");

    console.log("[ImageGen] Groq title:", headline);
    return { imagePrompt: scene, headline: headline.slice(0, 80) };
  } catch (err) {
    console.warn("[ImageGen] Groq prompt enhancement failed, using fallback:", err);
    return buildImagePrompt(topic, postContent);
  }
}

export function buildImagePrompt(topic: string, postContent: string): { imagePrompt: string; headline: string } {
  const clean = postContent
    .replace(/#\w+/g, "")
    .replace(/@\w+/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const firstSentence = (clean.split(/[.!?]/)[0] || clean).trim().slice(0, 150);
  const headline = topic;

  const lowerContent = clean.toLowerCase();
  let mood = "confident and inspiring";
  if (lowerContent.match(/grow|scale|success|achieve|win/)) mood = "ambitious and energetic";
  else if (lowerContent.match(/learn|tip|guide|how|step/)) mood = "educational and clear";
  else if (lowerContent.match(/team|connect|communit|collaborat/)) mood = "warm and collaborative";
  else if (lowerContent.match(/innovat|future|tech|ai|digital/)) mood = "futuristic and sleek";
  else if (lowerContent.match(/save|deal|offer|discount|price/)) mood = "bold and attention-grabbing";

  const imagePrompt =
    `Cinematic social media cover image. Subject: ${firstSentence}. Topic context: ${topic}. ` +
    `Mood: ${mood}. ` +
    `Visual style: photorealistic scene or clean modern digital illustration, vibrant accent colors, ` +
    `professional studio-quality lighting, sharp focus, square 1:1 composition. ` +
    `No text, no words, no letters, no signs anywhere in the image.`;

  return { imagePrompt, headline };
}

/**
 * Adds a Cloudinary text overlay to a Cloudinary URL.
 * Spaces are preserved (encoded as %20), no underscores in displayed text.
 */
export function addTextOverlay(cloudinaryUrl: string, text: string): string {
  if (!cloudinaryUrl.includes("cloudinary.com")) return cloudinaryUrl;

  const clean = text
    .replace(/[^\w\s-]/g, "")
    .trim()
    .slice(0, 80);

  if (!clean) return cloudinaryUrl;

  const encoded = clean.replace(/\s+/g, "%20");

  // Gradient fade on bottom + dual-layer shadow text effect, word wrap at 900px
  const gradient = `e_gradient_fade,y_-0.4`;
  const shadow   = `l_text:impact_85:${encoded},co_black,g_south,y_120,w_900`;
  const main     = `l_text:impact_85:${encoded},co_white,o_20,g_south,x_3,y_123,w_900`;

  return cloudinaryUrl.replace("/upload/", `/upload/${gradient}/${shadow}/${main}/`);
}
