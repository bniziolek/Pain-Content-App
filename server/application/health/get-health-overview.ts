/**
 * Architecture: Application service layer. Gets overall system health overview.
 */

import type { AppContext } from "../context";

interface HealthOverview {
  system: {
    uptime: number; // in seconds
    nodeVersion: string;
    environment: string;
  };
  database: {
    status: "healthy" | "degraded" | "error";
    connectionCount?: number;
    maxConnections?: number;
    activeConnections?: number;
    idleConnections?: number;
    responseTime?: number; // in ms
    error?: string;
  };
  api: {
    recentRequests: number;
    averageResponseTime?: number; // p50
    p95ResponseTime?: number;
    p99ResponseTime?: number;
    errorRate?: number; // percentage
    errorCount?: number;
    successCount?: number;
  };
  email: {
    totalSent: number;
    delivered: number;
    bounced: number;
    deliveryRate: number; // percentage
    bounceRate: number; // percentage
  };
  externalServices: {
    stripe: { status: "healthy" | "unknown"; lastChecked?: Date };
    contentful: { status: "healthy" | "unknown"; lastChecked?: Date };
  };
}

export async function getHealthOverview(
  context: AppContext
): Promise<HealthOverview> {
  const now = context.now();

  // System health
  const uptime = process.uptime();
  const nodeVersion = process.version;
  const environment = process.env.NODE_ENV || "development";

  // Database health
  let databaseHealth: HealthOverview["database"] = {
    status: "healthy",
  };

  try {
    const dbStart = Date.now();
    const poolStats = await context.storage.getDatabasePoolStats();
    const dbResponseTime = Date.now() - dbStart;

    databaseHealth = {
      status: "healthy",
      connectionCount: poolStats.totalConnections,
      maxConnections: poolStats.maxConnections,
      activeConnections: poolStats.activeConnections,
      idleConnections: poolStats.idleConnections,
      responseTime: dbResponseTime,
    };
  } catch (error) {
    databaseHealth = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // API health (last hour)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  let apiHealth: HealthOverview["api"] = {
    recentRequests: 0,
  };

  try {
    const apiMetrics = await context.storage.getApiMetrics(oneHourAgo);
    apiHealth = {
      recentRequests: apiMetrics.totalRequests,
      averageResponseTime: apiMetrics.p50,
      p95ResponseTime: apiMetrics.p95,
      p99ResponseTime: apiMetrics.p99,
      errorRate: apiMetrics.errorRate,
      errorCount: apiMetrics.errorCount,
      successCount: apiMetrics.successCount,
    };
  } catch (error) {
    console.error("Failed to get API metrics:", error);
  }

  // Email health (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let emailHealth: HealthOverview["email"] = {
    totalSent: 0,
    delivered: 0,
    bounced: 0,
    deliveryRate: 0,
    bounceRate: 0,
  };

  try {
    const emailMetrics = await context.storage.getEmailMetrics(sevenDaysAgo);
    emailHealth = {
      totalSent: emailMetrics.totalSent,
      delivered: emailMetrics.delivered,
      bounced: emailMetrics.bounced,
      deliveryRate:
        emailMetrics.totalSent > 0
          ? (emailMetrics.delivered / emailMetrics.totalSent) * 100
          : 0,
      bounceRate:
        emailMetrics.totalSent > 0
          ? (emailMetrics.bounced / emailMetrics.totalSent) * 100
          : 0,
    };
  } catch (error) {
    console.error("Failed to get email metrics:", error);
  }

  // External services health
  const externalServices: HealthOverview["externalServices"] = {
    stripe: { status: "unknown" },
    contentful: { status: "unknown" },
  };

  // Check Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    externalServices.stripe = { status: "healthy", lastChecked: now };
  }

  // Check Contentful
  if (context.cms.isConfigured()) {
    externalServices.contentful = { status: "healthy", lastChecked: now };
  }

  return {
    system: {
      uptime,
      nodeVersion,
      environment,
    },
    database: databaseHealth,
    api: apiHealth,
    email: emailHealth,
    externalServices,
  };
}
