/**
 * Architecture: Authentication helpers and middleware used by routes.
 */

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser, SubscriptionTier, SUBSCRIPTION_TIERS, TIER_ENTITLEMENTS } from "@shared/schema";
import { comparePasswords, hashPassword } from "./domain/password";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email.toLowerCase());
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        // Update last login
        await storage.updateLastLogin(user.id);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

}

export { hashPassword };

// Middleware to check if user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Authentication required");
  }
  next();
}

// Middleware to check if user has active subscription
export function requireSubscription(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Authentication required");
  }

  const user = req.user as SelectUser;
  if (user.subscriptionStatus !== "active") {
    return res.status(403).send("Active subscription required");
  }

  next();
}

// Middleware to check if user is admin
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Authentication required");
  }

  const user = req.user as SelectUser;
  if (user.role !== "admin") {
    return res.status(403).send("Admin access required");
  }

  next();
}

// Middleware factory to check if user has required subscription tier
export function requireTier(requiredTier: SubscriptionTier | SubscriptionTier[]) {
  const requiredTiers = Array.isArray(requiredTier) ? requiredTier : [requiredTier];

  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }

    const user = req.user as SelectUser;
    if (user.subscriptionStatus !== "active") {
      return res.status(403).json({
        error: "Active subscription required",
        code: "SUBSCRIPTION_REQUIRED"
      });
    }

    const userTier = (user.subscriptionTier || 'basic') as SubscriptionTier;
    const userTierLevel = SUBSCRIPTION_TIERS[userTier]?.level ?? 0;

    // Check if user's tier level meets any of the required tiers
    const hasAccess = requiredTiers.some(tier => {
      const requiredLevel = SUBSCRIPTION_TIERS[tier]?.level ?? 0;
      return userTierLevel >= requiredLevel;
    });

    if (!hasAccess) {
      const minRequiredTier = requiredTiers.reduce((min, tier) => {
        const level = SUBSCRIPTION_TIERS[tier]?.level ?? 99;
        return level < (SUBSCRIPTION_TIERS[min]?.level ?? 99) ? tier : min;
      }, requiredTiers[0]);

      return res.status(403).json({
        error: `${SUBSCRIPTION_TIERS[minRequiredTier].name} tier or higher required`,
        code: "TIER_UPGRADE_REQUIRED",
        requiredTier: minRequiredTier,
        currentTier: userTier
      });
    }

    next();
  };
}

// Middleware factory to check tier entitlement for a specific feature
export function requireFeatureEntitlement(featureKey: string) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }

    const user = req.user as SelectUser;
    if (user.subscriptionStatus !== "active") {
      return res.status(403).json({
        error: "Active subscription required",
        code: "SUBSCRIPTION_REQUIRED"
      });
    }

    const userTier = (user.subscriptionTier || 'basic') as SubscriptionTier;
    const allowedTiers = TIER_ENTITLEMENTS[featureKey];

    if (!allowedTiers) {
      // Feature not in entitlement matrix, allow access
      return next();
    }

    if (!allowedTiers.includes(userTier)) {
      const minRequiredTier = allowedTiers.reduce((min, tier) => {
        const level = SUBSCRIPTION_TIERS[tier]?.level ?? 99;
        return level < (SUBSCRIPTION_TIERS[min]?.level ?? 99) ? tier : min;
      }, allowedTiers[0]);

      return res.status(403).json({
        error: `${SUBSCRIPTION_TIERS[minRequiredTier].name} tier or higher required for this feature`,
        code: "TIER_UPGRADE_REQUIRED",
        feature: featureKey,
        requiredTier: minRequiredTier,
        currentTier: userTier
      });
    }

    next();
  };
}

// Helper function to check if a user has access to a feature based on their tier
export function hasTierAccess(user: SelectUser, featureKey: string): boolean {
  const userTier = (user.subscriptionTier || 'basic') as SubscriptionTier;
  const allowedTiers = TIER_ENTITLEMENTS[featureKey];

  if (!allowedTiers) {
    return true; // Feature not in entitlement matrix, allow access
  }

  return allowedTiers.includes(userTier);
}
