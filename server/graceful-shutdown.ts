/**
 * Graceful Shutdown Handler
 * Handles SIGTERM/SIGINT signals for clean container shutdown.
 */

import type { Server } from "http";

let isShuttingDown = false;

export function setupGracefulShutdown(server: Server, cleanup?: () => Promise<void>): void {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      console.log("Shutdown already in progress...");
      return;
    }
    
    isShuttingDown = true;
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        console.error("Error during server close:", err);
        process.exit(1);
      }

      console.log("Server closed. No longer accepting connections.");

      // Run custom cleanup (close DB connections, flush logs, etc.)
      if (cleanup) {
        try {
          console.log("Running cleanup tasks...");
          await cleanup();
          console.log("Cleanup completed.");
        } catch (cleanupErr) {
          console.error("Error during cleanup:", cleanupErr);
          process.exit(1);
        }
      }

      console.log("Graceful shutdown complete.");
      process.exit(0);
    });

    // Force exit after timeout if graceful shutdown hangs
    const SHUTDOWN_TIMEOUT = 30000; // 30 seconds
    setTimeout(() => {
      console.error(`Shutdown timeout (${SHUTDOWN_TIMEOUT}ms) exceeded. Forcing exit.`);
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);
  };

  // Handle termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
}
