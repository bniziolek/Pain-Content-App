import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser, SubscriptionTier, SUBSCRIPTION_TIERS, TIER_ENTITLEMENTS } from "@shared/schema";
import { toPublicUser } from "./serializers/user";
import { logClinicianAction, logAuditEvent } from "./audit";
import { hashPassword, comparePasswords } from "./domain/password";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export { hashPassword };

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

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).send("Email and password are required");
      }

      const normalizedEmail = email.toLowerCase();
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      const user = await storage.createUser({
        email: normalizedEmail,
        password: await hashPassword(password),
        name: name || null,
      });

      // Audit log: user registration
      await logClinicianAction(req, user, 'user_create', {
        resourceType: 'user',
        resourceId: user.id,
        details: { method: 'self_registration' },
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(toPublicUser(user));
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    const getClientIp = (request: any): string => {
      const forwarded = request.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
      if (Array.isArray(forwarded)) return forwarded[0];
      return request.socket?.remoteAddress || 'unknown';
    };

    passport.authenticate("local", async (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        // Audit log: failed login attempt
        await logAuditEvent(req, {
          actorType: 'clinician',
          actorEmail: req.body?.email,
          action: 'login_failed',
          details: { reason: info?.message || 'invalid_credentials' },
          outcome: 'failure',
        });
        
        // Try to record failed login if user exists
        const existingUser = await storage.getUserByEmail(req.body?.email);
        if (existingUser) {
          try {
            await storage.createLoginHistory({
              userId: existingUser.id,
              ipAddress: getClientIp(req),
              userAgent: req.headers['user-agent'] || 'unknown',
              outcome: 'failure',
              failureReason: info?.message || 'invalid_credentials',
            });
          } catch (e) {
            console.error('Failed to log login history:', e);
          }
        }
        
        return res.status(401).send(info?.message || "Authentication failed");
      }
      req.login(user, async (err) => {
        if (err) return next(err);
        // Audit log: successful login
        await logClinicianAction(req, user, 'login', {
          details: { method: 'password' },
        });
        
        // Record successful login in history
        try {
          await storage.createLoginHistory({
            userId: user.id,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'] || 'unknown',
            outcome: 'success',
          });
        } catch (e) {
          console.error('Failed to log login history:', e);
        }
        
        res.status(200).json(toPublicUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    const user = req.user;
    req.logout(async (err) => {
      if (err) return next(err);
      // Audit log: logout
      if (user) {
        await logClinicianAction(req, user as SelectUser, 'logout', {});
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(toPublicUser(req.user as SelectUser));
  });
}

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
