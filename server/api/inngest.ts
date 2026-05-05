import { serve } from "inngest/express";
import { inngest } from "../inngest/client";
import { processScheduledPosts } from "../inngest/functions";

/**
 * Inngest API endpoint
 * This endpoint is called by Inngest to execute scheduled functions
 */
export const inngestHandler = serve({
  client: inngest,
  functions: [processScheduledPosts],
});
