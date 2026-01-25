/**
 * Architecture: Server entry point and composition root; wires routes, middleware, and infrastructure.
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index";
import { registerWebhookRoutes } from "./routes/webhooks";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startBackgroundJobs } from "./background-jobs";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Register Stripe webhook route BEFORE express.json()
registerWebhookRoutes(app);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
      
      // Record API health metrics (fire-and-forget) - can be disabled via DISABLE_HEALTH_METRICS env var
      if (process.env.DISABLE_HEALTH_METRICS !== 'true') {
        storage.recordHealthMetric({
          metricType: "api_request",
          metricName: path,
          value: duration,
          status: res.statusCode < 400 ? "success" : "error",
          metadata: {
            method: req.method,
            statusCode: res.statusCode,
          },
        }).catch((err) => {
          console.error("Failed to record health metric:", err);
        });
      }
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);
  
  // Seed database on startup in development
  if (process.env.NODE_ENV !== "production") {
    const { seedDatabase } = await import("./seed");
    await seedDatabase().catch(console.error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  await startBackgroundJobs();
})();
