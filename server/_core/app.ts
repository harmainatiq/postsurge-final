import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { inngestHandler } from "../api/inngest";

export function createApp() {
  const app = express();
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Auth routes under /api/auth
  registerAuthRoutes(app);
  
  // Inngest API endpoint
  app.use("/api/inngest", inngestHandler);

  // Image proxy — fetches external images server-side to avoid CORS in the canvas editor
  app.get("/api/image-proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url) { res.status(400).send("url required"); return; }
    try {
      const upstream = await fetch(url);
      if (!upstream.ok) { res.status(502).send("upstream error"); return; }
      const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch {
      res.status(502).send("proxy error");
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Serve static files in production (skip on Vercel - CDN handles it)
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    serveStatic(app);
  }
  
  return app;
}

export default createApp();
