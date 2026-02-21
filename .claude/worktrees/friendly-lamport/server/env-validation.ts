/**
 * Environment Variable Validation
 * Fail-fast validation of required environment variables on startup.
 */

interface EnvConfig {
  required: string[];
  optional: string[];
}

const envConfig: EnvConfig = {
  required: [
    "DATABASE_URL",
    "SESSION_SECRET",
  ],
  optional: [
    // Server config
    "PORT",
    "NODE_ENV",
    "APP_URL",
    // Stripe (required if using payment features)
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PUBLISHABLE_KEY",
    // CMS
    "CONTENTFUL_SPACE_ID",
    "CONTENTFUL_ACCESS_TOKEN",
    // Feature flags
    "BACKGROUND_JOBS_ENABLED",
    "STRIPE_SYNC_ENABLED",
    "DISABLE_HEALTH_METRICS",
    // Replit runtime (auto-provided)
    "REPLIT_DEV_DOMAIN",
    "REPLIT_DOMAINS",
    "REPLIT_DEPLOYMENT",
  ],
};

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of envConfig.required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("=".repeat(60));
    console.error("FATAL: Missing required environment variables:");
    console.error("");
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    console.error("");
    console.error("Please set these variables in your .env file or environment.");
    console.error("See .env.example for reference.");
    console.error("=".repeat(60));
    process.exit(1);
  }

  // Log optional variables that are not set (for debugging)
  if (process.env.NODE_ENV !== "production") {
    const unsetOptional = envConfig.optional.filter((key) => !process.env[key]);
    if (unsetOptional.length > 0) {
      console.log("Note: Optional environment variables not set:", unsetOptional.join(", "));
    }
  }
}
