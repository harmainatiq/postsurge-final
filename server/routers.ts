import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getBrandGuidelineByUserId,
  createBrandGuideline,
  updateBrandGuideline,
  createPosts,
  getPostsByUserId,
  updatePost,
  deletePost,
  getSelectedPosts,
  getUserSettings,
  upsertUserSettings,
  saveBundleCredentials,
  getBundleCredentials,
  updateUserName,
  createNotification,
  getNotificationsByUserId,
  getAllNotificationsByUserId,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { publishToBundleSocial, getConnectedAccounts, type SupportedPlatform } from "./_core/bundleSocial";
import { generateAndStoreImage, buildEnhancedImagePrompt, addTextOverlay } from "./_core/imageGeneration";
import { generateAndStoreVideo, buildVideoPrompt } from "./_core/videoGeneration";
import { storagePutDataUrl } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  brandGuidelines: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getBrandGuidelineByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        brandName: z.string().optional(),
        tone: z.string().min(1),
        style: z.string().min(1),
        targetAudience: z.string().optional(),
        contentPreferences: z.string().optional(),
        keywords: z.string().optional(),
        avoidWords: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createBrandGuideline({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        brandName: z.string().optional(),
        tone: z.string().optional(),
        style: z.string().optional(),
        targetAudience: z.string().optional(),
        contentPreferences: z.string().optional(),
        keywords: z.string().optional(),
        avoidWords: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return await updateBrandGuideline(id, ctx.user.id, updates);
      }),
  }),

  posts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getPostsByUserId(ctx.user.id);
    }),

    getByBatch: protectedProcedure
      .input(z.object({ batchId: z.string() }))
      .query(async ({ ctx, input }) => {
        const all = await getPostsByUserId(ctx.user.id);
        return all.filter(p => p.batchId === input.batchId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().optional(),
        isSelected: z.boolean().optional(),
        scheduledFor: z.date().optional(),
        platforms: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return await updatePost(id, ctx.user.id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deletePost(input.id, ctx.user.id);
        return { success: true };
      }),

    getSelected: protectedProcedure.query(async ({ ctx }) => {
      return await getSelectedPosts(ctx.user.id);
    }),

    publish: protectedProcedure
      .input(z.object({
        postIds: z.array(z.number()),
        platforms: z.array(z.enum(["FACEBOOK", "LINKEDIN", "TWITTER", "INSTAGRAM"])),
        scheduledFor: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {

        // --- SCHEDULED PATH ---
        // Save to DB only. Inngest will publish at the right time.
        if (input.scheduledFor) {
          console.log(`[Publish:SCHEDULE] userId:`, ctx.user.id, "scheduledFor:", input.scheduledFor.toISOString());
          const allPosts = await getPostsByUserId(ctx.user.id);
          const toSchedule = allPosts.filter(p => input.postIds.includes(p.id));

          if (toSchedule.length === 0) throw new Error("No matching posts found");

          for (const post of toSchedule) {
            await updatePost(post.id, ctx.user.id, {
              scheduledFor: input.scheduledFor,
              platforms: JSON.stringify(input.platforms),
              isSelected: true,
              isScheduled: false,
            });
          }

          return {
            success: true,
            mode: "scheduled" as const,
            scheduled: toSchedule.length,
            scheduledFor: input.scheduledFor,
            publishedPlatforms: [],
            skippedPlatforms: [],
            errors: [],
          };
        }

        // --- IMMEDIATE PATH ---
        console.log(`[Publish:POST NOW] userId:`, ctx.user.id, "postIds:", input.postIds);
        const creds = await getBundleCredentials(ctx.user.id);
        if (!creds) throw new Error("bundle.social credentials not configured. Please add your API Key and Team ID in Settings.");

        const allPosts = await getPostsByUserId(ctx.user.id);
        const toPublish = allPosts.filter(p => input.postIds.includes(p.id));

        if (toPublish.length === 0) throw new Error("No matching posts found");

        const platforms = input.platforms as SupportedPlatform[];
        const errors: { id: number; error: string }[] = [];
        const publishSummary: { published: SupportedPlatform[]; skipped: SupportedPlatform[] }[] = [];

        for (const post of toPublish) {
          const effectivePlatforms = post.imageUrl
            ? platforms
            : platforms.filter(p => p !== "INSTAGRAM");

          if (effectivePlatforms.length === 0) {
            console.warn(`[Publish:POST NOW] post ${post.id} skipped — no image for Instagram-only selection`);
            publishSummary.push({ published: [], skipped: platforms });
            continue;
          }

          try {
            const result = await publishToBundleSocial(
              post.content,
              effectivePlatforms,
              creds.apiKey,
              creds.teamId,
              new Date(),
              post.imageUrl ?? undefined,
              (post as any).videoUrl ?? undefined
            );

            await updatePost(post.id, ctx.user.id, {
              isScheduled: true,
              platforms: JSON.stringify(result.publishedPlatforms),
            });

            await createNotification({
              userId: ctx.user.id,
              postId: post.id,
              platforms: JSON.stringify(result.publishedPlatforms),
              imageUrl: post.imageUrl ?? null,
              postPreview: post.content.slice(0, 120),
              publishedAt: new Date(),
            });

            publishSummary.push({ published: result.publishedPlatforms, skipped: result.skippedPlatforms });
          } catch (err) {
            console.error(`[Publish:POST NOW] post ${post.id} FAILED:`, String(err));
            errors.push({ id: post.id, error: String(err) });
          }
        }

        const allPublished = Array.from(new Set(publishSummary.flatMap(s => s.published)));
        const allSkipped = Array.from(new Set(publishSummary.flatMap(s => s.skipped)));

        return {
          success: errors.length === 0,
          mode: "immediate" as const,
          sent: toPublish.length - errors.length,
          errors,
          publishedPlatforms: allPublished,
          skippedPlatforms: allSkipped,
        };
      }),

    updateImage: protectedProcedure
      .input(z.object({
        id: z.number(),
        imageDataUrl: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const { url } = await storagePutDataUrl(input.imageDataUrl);
        await updatePost(input.id, ctx.user.id, { imageUrl: url });
        return { imageUrl: url };
      }),

    generate: protectedProcedure
      .input(z.object({
        topic: z.string().min(1),
        count: z.number().min(1).max(30).default(5),
        minWords: z.number().min(10).max(500).optional().default(100),
        generateImages: z.boolean().default(false),
        imageTitleMode: z.enum(["ai", "manual", "none"]).default("ai"),
        imageTitle: z.string().optional(),
        generateVideos: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get user's brand guidelines
        const guidelines = await getBrandGuidelineByUserId(ctx.user.id);

        // Build AI prompt
        const systemPrompt = `You are a professional social media content creator. Generate engaging social media posts based on the following brand guidelines:

${guidelines ? `
Brand: ${guidelines.brandName || 'Not specified'}
Tone: ${guidelines.tone}
Style: ${guidelines.style}
Target Audience: ${guidelines.targetAudience || 'General audience'}
Content Preferences: ${guidelines.contentPreferences || 'None specified'}
Keywords to include: ${guidelines.keywords || 'None'}
Words to avoid: ${guidelines.avoidWords || 'None'}
` : 'No brand guidelines set. Use a professional, engaging tone.'}

Generate ${input.count} unique social media posts about the topic: "${input.topic}"

Requirements:
- Each post MUST be at least ${input.minWords} words — do not generate shorter posts
- Posts should be suitable for Twitter/LinkedIn/Facebook
- Posts should be diverse in approach and angle
- Include relevant hashtags where appropriate
- Make posts actionable and engaging
- Return ONLY a JSON array of strings, where each string is one complete post
- Format: ["post 1 text", "post 2 text", ...]`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate ${input.count} posts about: ${input.topic}. Each post must be at least ${input.minWords} words.` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "social_posts",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  posts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of social media post texts"
                  }
                },
                required: ["posts"],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Failed to generate posts");
        }

        const contentText = typeof content === 'string' ? content : JSON.stringify(content);
        const parsed = JSON.parse(contentText);
        const generatedPosts = parsed.posts as string[];

        // Create batch ID for grouping
        const batchId = nanoid();

        // Save all posts to database with images
        const postsToInsert = await Promise.all(
          generatedPosts.map(async (postContent) => {
            let imageUrl: string | undefined;
            if (input.generateImages) {
              try {
                const { imagePrompt, headline: aiHeadline } = await buildEnhancedImagePrompt(input.topic, postContent);
                const rawUrl = await generateAndStoreImage(imagePrompt);
                if (input.imageTitleMode === "none") {
                  imageUrl = rawUrl;
                } else if (input.imageTitleMode === "manual" && input.imageTitle?.trim()) {
                  imageUrl = addTextOverlay(rawUrl, input.imageTitle.trim());
                } else {
                  imageUrl = addTextOverlay(rawUrl, aiHeadline);
                }
              } catch (err) {
                console.warn("[Generate] Image generation failed for a post:", err);
              }
            }

            let videoUrl: string | undefined;
            if (input.generateVideos) {
              try {
                const videoPrompt = await buildVideoPrompt(input.topic, postContent);
                videoUrl = await generateAndStoreVideo(videoPrompt);
              } catch (err) {
                console.warn("[Generate] Video generation failed for a post:", err);
              }
            }

            return {
              userId: ctx.user.id,
              batchId,
              topic: input.topic,
              content: postContent,
              imageUrl: imageUrl ?? null,
              videoUrl: videoUrl ?? null,
              isSelected: false,
              isScheduled: false,
            };
          })
        );

        await createPosts(postsToInsert);

        // Return the batch ID so frontend can fetch the posts
        return { batchId, count: generatedPosts.length };
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getUserSettings(ctx.user.id);
      return settings || null;
    }),

    initSettings: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getUserSettings(ctx.user.id);
      if (!existing) {
        await upsertUserSettings({ userId: ctx.user.id });
      }
      return { success: true };
    }),

    saveBundleCredentials: protectedProcedure
      .input(z.object({
        apiKey: z.string().min(1),
        teamId: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveBundleCredentials(ctx.user.id, input.apiKey, input.teamId);
        return { success: true };
      }),

    getConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
      const creds = await getBundleCredentials(ctx.user.id);
      if (!creds) return [];
      return await getConnectedAccounts(creds.apiKey, creds.teamId);
    }),

    updateName: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserName(ctx.user.id, input.name);
        return { success: true };
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getNotificationsByUserId(ctx.user.id);
    }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
      return await getAllNotificationsByUserId(ctx.user.id);
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
});

export type AppRouter = typeof appRouter;
